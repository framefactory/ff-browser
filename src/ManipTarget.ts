/**
 * FF Typescript Foundation Library
 * Copyright 2023 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { ITypedEvent } from "@ffweb/core/Publisher.js";

////////////////////////////////////////////////////////////////////////////////

const _DRAG_DISTANCE = 2;

export type PointerEventType = "pointer-down" | "pointer-up" | "pointer-hover" | "pointer-move";
export type TriggerEventType = "wheel" | "double-click" | "context-menu" | "drag-enter" | "drag-over" | "drag-leave" | "drag-end" | "drop";
export type PointerEventSource = "mouse" | "pen" | "touch";

export interface IPointer
{
    id: number;
    offsetX: number;
    offsetY: number;
}

export interface IManipEvent extends ITypedEvent<PointerEventType | TriggerEventType>
{
    originalEvent: Event;

    /** The x coordinate of the center of all active pointers. */
    centerX: number;
    /** The y coordinate of the center of all active pointers. */
    centerY: number;
    /** True if the shift modifier is active. */
    shiftKey: boolean;
    /** True if the control modifier is active. */
    ctrlKey: boolean;
    /** True if the alt modifier is active. */
    altKey: boolean;
    /** True if the meta modifier is active. */
    metaKey: boolean;

    /** Set this to true to stop the event from further propagating. */
    stopPropagation: boolean;
}

export interface IPointerEvent extends IManipEvent
{
    type: PointerEventType;

    originalEvent: PointerEvent;
    source: PointerEventSource;

    primaryButton: number;
    isPrimary: boolean;
    isDragging: boolean;

    pointerCount: number;
    activePointers: IPointer[];

    movementX: number;
    movementY: number;
}

export interface ITriggerEvent extends IManipEvent
{
    type: TriggerEventType;

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
export class ManipTarget
{
    listener: IManipListener = null;

    protected activePointers: IPointer[] = [];
    protected activeType = "";
    protected primaryButton = 0;

    protected centerX = 0;
    protected centerY = 0;

    protected startX = 0;
    protected startY = 0;
    protected isDragging = false;

    private _element: HTMLElement = null;


    constructor(targetElement?: HTMLElement)
    {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUpOrCancel = this.onPointerUpOrCancel.bind(this);

        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDrop = this.onDrop.bind(this);

        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onWheel = this.onWheel.bind(this);

        this.element = targetElement;
    }

    get element(): HTMLElement {
        return this._element;
    }

    set element(targetElement: HTMLElement) {
        const thisElement = this._element;
        if (thisElement) {
            thisElement.removeEventListener("pointerdown", this.onPointerDown);
            thisElement.removeEventListener("pointermove", this.onPointerMove);
            thisElement.removeEventListener("pointerup", this.onPointerUpOrCancel);
            thisElement.removeEventListener("pointercancel", this.onPointerUpOrCancel);
            thisElement.removeEventListener("dragenter", this.onDragEnter);
            thisElement.removeEventListener("dragover", this.onDragOver);
            thisElement.removeEventListener("dragleave", this.onDragLeave);
            thisElement.removeEventListener("dragend", this.onDragEnd);
            thisElement.removeEventListener("drop", this.onDrop);
            thisElement.removeEventListener("doubleclick", this.onDoubleClick);
            thisElement.removeEventListener("contextmenu", this.onContextMenu);
            thisElement.removeEventListener("wheel", this.onWheel);
        }

        this._element = targetElement;

        if (targetElement) {
            targetElement.addEventListener("pointerdown", this.onPointerDown);
            targetElement.addEventListener("pointermove", this.onPointerMove);
            targetElement.addEventListener("pointerup", this.onPointerUpOrCancel);
            targetElement.addEventListener("pointercancel", this.onPointerUpOrCancel);
            targetElement.addEventListener("dragenter", this.onDragEnter);
            targetElement.addEventListener("dragover", this.onDragOver);
            targetElement.addEventListener("dragleave", this.onDragLeave);
            targetElement.addEventListener("dragend", this.onDragEnd);
            targetElement.addEventListener("drop", this.onDrop);
            targetElement.addEventListener("doubleclick", this.onDoubleClick);
            targetElement.addEventListener("contextmenu", this.onContextMenu);
            targetElement.addEventListener("wheel", this.onWheel);
        }
    }

    onPointerDown(event: PointerEvent): void
    {
        // only events of a single pointer type can be handled at a time
        if (this.activeType && event.pointerType !== this.activeType) {
            return;
        }

        if (event.isPrimary) {
            this.startX = event.offsetX;
            this.startY = event.offsetY;
            this.isDragging = false;
            this.primaryButton = event.button || 0;
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

        if (event.isPrimary && activePointers.length > 0 && !this.isDragging) {
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
        if (event.isPrimary) {
            this.primaryButton = 0;
            this.isDragging = false;
        }

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }
    
    onDragEnter(event: DragEvent): void
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "drag-enter")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onDragOver(event: DragEvent): void
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "drag-over")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onDragLeave(event: DragEvent): void
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "drag-leave")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onDragEnd(event: DragEvent): void
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "drag-end")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onDrop(event: DragEvent): void
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "drop")
        );

        if (consumed) {
            event.preventDefault();
        }
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
            centerX = event.offsetX;
            centerY = event.offsetY;
        }

        return {
            originalEvent: event,
            type: type,
            source: event.pointerType as PointerEventSource,

            primaryButton: this.primaryButton,
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