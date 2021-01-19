/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { ITypedEvent } from "@ff/core/Publisher";

////////////////////////////////////////////////////////////////////////////////

const _DRAG_DISTANCE = 2;

export type PointerEventType = "pointer-down" | "pointer-up" | "pointer-hover" | "pointer-move";
export type TriggerEventType = "wheel" | "double-click" | "context-menu";
export type PointerEventSource = "mouse" | "pen" | "touch";

export interface IPointer
{
    id: number;
    offsetX: number;
    offsetY: number;
}

export interface IManipEvent
{
    centerX: number;
    centerY: number;

    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;

    stopPropagation: boolean;
}

export interface IPointerEvent extends IManipEvent, ITypedEvent<PointerEventType>
{
    originalEvent: PointerEvent;
    source: PointerEventSource;

    isPrimary: boolean;
    isDragging: boolean;

    pointerCount: number;
    activePointers: IPointer[];

    movementX: number;
    movementY: number;
}

export interface ITriggerEvent extends IManipEvent, ITypedEvent<TriggerEventType>
{
    originalEvent: Event;

    wheel: number;
}

export interface IManipListener
{
    onPointer: (event: IPointerEvent) => boolean;
    onTrigger: (event: ITriggerEvent) => boolean;
}

/**
 * Composable class, listens for mouse and touch events on its target and converts
 * them to [[IPointerEvent]] and [[ITriggerEvent]] events. [[IManip]] receivers of these events
 * can be chained. Events are handed down the chain, starting with the [[IManip]] instance
 * assigned to [[ManipTarget.next]].
 */
export default class ManipTarget
{
    listener: IManipListener = null;

    protected activePointers: IPointer[] = [];
    protected activeType = "";

    protected centerX = 0;
    protected centerY = 0;

    protected startX = 0;
    protected startY = 0;
    protected isDragging = false;

    constructor(target?: HTMLElement)
    {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUpOrCancel = this.onPointerUpOrCancel.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onWheel = this.onWheel.bind(this);

        if (target) {
            target.addEventListener("pointerdown", this.onPointerDown);
            target.addEventListener("pointermove", this.onPointerMove);
            target.addEventListener("pointerup", this.onPointerUpOrCancel);
            target.addEventListener("pointercancel", this.onPointerUpOrCancel);
            target.addEventListener("doubleclick", this.onDoubleClick);
            target.addEventListener("contextmenu", this.onContextMenu);
            target.addEventListener("wheel", this.onWheel);
        }
    }

    onPointerDown(event: PointerEvent): void
    {
        // only events of a single pointer type can be handled at a time
        if (this.activeType && event.pointerType !== this.activeType) {
            return;
        }

        if (this.activePointers.length === 0) {
            this.startX = event.offsetX;
            this.startY = event.offsetY;
            this.isDragging = false;
        }

        this.activeType = event.pointerType;

        this.activePointers.push({
            id: event.pointerId,
            offsetX: event.offsetX,
            offsetY: event.offsetY
        });

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

        const manipEvent = this.createManipPointerEvent(event, "pointer-down");

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }

    onPointerMove(event: PointerEvent): void
    {
        const activePointers = this.activePointers;

        for (let i = 0, n = activePointers.length; i < n; ++i) {
            const pointer = activePointers[i];
            if (event.pointerId === pointer.id) {
                pointer.offsetX = event.offsetX;
                pointer.offsetY = event.offsetY;
            }
        }

        if (activePointers.length > 0 && !this.isDragging) {
            const delta = Math.abs(event.offsetX - this.startX) + Math.abs(event.offsetY - this.startY);
            if (delta > _DRAG_DISTANCE) {
                this.isDragging = true;
            }
        }

        const eventType = activePointers.length ? "pointer-move" : "pointer-hover";
        const manipEvent = this.createManipPointerEvent(event, eventType);

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }

    onPointerUpOrCancel(event: PointerEvent): void
    {
        const activePointers = this.activePointers;
        let found = false;

        for (let i = 0, n = activePointers.length; i < n; ++i) {
            if (event.pointerId === activePointers[i].id) {
                activePointers.splice(i, 1);
                found = true;
                break;
            }
        }

        if (!found) {
            console.warn("[ManipTarget.onPointerUpOrCancel] orphan pointer up/cancel event #id", event.pointerId);
            return;
        }

        const manipEvent = this.createManipPointerEvent(event, "pointer-up");
        if (activePointers.length === 0) {
            this.activeType = "";
        }

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }

    onDoubleClick(event: MouseEvent): void
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "double-click")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onContextMenu(event: MouseEvent): void
    {
        this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "context-menu")
        );

        // prevent default context menu regardless of whether event was consumed or not
        event.preventDefault();
    }

    onWheel(event: WheelEvent): void
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "wheel")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    protected createManipPointerEvent(event: PointerEvent, type: PointerEventType): IPointerEvent
    {
        // calculate center and movement
        let centerX = 0;
        let centerY = 0;
        let movementX = 0;
        let movementY = 0;

        const pointers = this.activePointers;
        const count = pointers.length;

        if (count > 0) {
            for (let i = 0; i < count; ++i) {
                centerX += pointers[i].offsetX;
                centerY += pointers[i].offsetY;
            }

            centerX /= count;
            centerY /= count;

            if (type === "pointer-move" || type === "pointer-hover") {
                movementX = centerX - this.centerX;
                movementY = centerY - this.centerY;
            }

            this.centerX = centerX;
            this.centerY = centerY;
        }
        else {
            centerX = this.centerX;
            centerY = this.centerY;
        }

        return {
            originalEvent: event,
            type: type,
            source: event.pointerType as PointerEventSource,

            isPrimary: event.isPrimary,
            isDragging: this.isDragging,
            activePointers: pointers,
            pointerCount: count,

            centerX,
            centerY,
            movementX,
            movementY,

            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey,

            stopPropagation: false,
        };
    }

    protected createManipTriggerEvent(event: MouseEvent, type: TriggerEventType): ITriggerEvent
    {
        let wheel = 0;

        if (type === "wheel") {
            wheel = (event as WheelEvent).deltaY;
        }

        return {
            originalEvent: event,

            type,
            wheel,

            centerX: event.offsetX,
            centerY: event.offsetY,

            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey,

            stopPropagation: false,
        }
    }

    protected sendPointerEvent(event: IPointerEvent): boolean
    {
        return this.listener && this.listener.onPointer(event);
    }

    protected sendTriggerEvent(event: ITriggerEvent): boolean
    {
        return this.listener && this.listener.onTrigger(event);
    }
}