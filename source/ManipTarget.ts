/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export enum EManipPointerEventType { Down, Hover, Move, Up }
export enum EManipPointerEventSource { Mouse, Pen, Touch }
export enum EManipTriggerEventType { Wheel, DblClick, ContextMenu }

const _pointerTypeToSource = {
    "mouse": EManipPointerEventSource.Mouse,
    "pen": EManipPointerEventSource.Pen,
    "touch": EManipPointerEventSource.Touch
};

export interface IPointerPosition
{
    id: number;
    clientX: number;
    clientY: number;
}

export interface IManipBaseEvent
{
    centerX: number;
    centerY: number;
    localX: number;
    localY: number;

    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}

export interface IManipPointerEvent extends IManipBaseEvent
{
    originalEvent: PointerEvent;
    type: EManipPointerEventType;
    source: EManipPointerEventSource;

    isPrimary: boolean;
    activePositions: IPointerPosition[];
    pointerCount: number;

    movementX: number;
    movementY: number;
}

export interface IManipTriggerEvent extends IManipBaseEvent
{
    originalEvent: Event;
    type: EManipTriggerEventType;

    wheel: number;
}

export interface IManip
{
    onPointer: (event: IManipPointerEvent) => boolean;
    onTrigger: (event: IManipTriggerEvent) => boolean;
}

export default class ManipTarget
{
    next: IManip;

    protected activePositions: IPointerPosition[];
    protected activeType: string;

    protected centerX: number;
    protected centerY: number;

    constructor()
    {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUpOrCancel = this.onPointerUpOrCancel.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onWheel = this.onWheel.bind(this);

        this.next = null;
        this.activePositions = [];
        this.activeType = "";
        this.centerX = 0;
        this.centerY = 0;
    }

    onPointerDown(event: PointerEvent)
    {
        // only events of a single pointer type can be handled at a time
        if (this.activeType && event.pointerType !== this.activeType) {
            return;
        }

        this.activeType = event.pointerType;
        this.activePositions.push({
            id: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY
        });

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

        const manipEvent = this.createManipPointerEvent(event, EManipPointerEventType.Down);

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }

    onPointerMove(event: PointerEvent)
    {
        const activePositions = this.activePositions;

        for (let i = 0, n = activePositions.length; i < n; ++i) {
            const position = activePositions[i];
            if (event.pointerId === position.id) {
                position.clientX = event.clientX;
                position.clientY = event.clientY;
            }
        }

        const eventType = activePositions.length ? EManipPointerEventType.Move : EManipPointerEventType.Hover;
        const manipEvent = this.createManipPointerEvent(event, eventType);

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }

    onPointerUpOrCancel(event: PointerEvent)
    {
        const activePositions = this.activePositions;
        let found = false;

        for (let i = 0, n = activePositions.length; i < n; ++i) {
            if (event.pointerId === activePositions[i].id) {
                activePositions.splice(i, 1);
                found = true;
                break;
            }
        }

        if (!found) {
            //console.warn("orphan pointer up/cancel event #id", event.pointerId);
            return;
        }

        const manipEvent = this.createManipPointerEvent(event, EManipPointerEventType.Up);
        if (activePositions.length === 0) {
            this.activeType = "";
        }

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }

    onDoubleClick(event: MouseEvent)
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, EManipTriggerEventType.DblClick)
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onContextMenu(event: MouseEvent)
    {
        this.sendTriggerEvent(
            this.createManipTriggerEvent(event, EManipTriggerEventType.ContextMenu)
        );

        // prevent default context menu regardless of whether event was consumed or not
        event.preventDefault();
    }

    onWheel(event: WheelEvent)
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, EManipTriggerEventType.Wheel)
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    protected createManipPointerEvent(event: PointerEvent, type: EManipPointerEventType): IManipPointerEvent
    {
        // calculate center and movement
        let centerX = 0;
        let centerY = 0;
        let localX = 0;
        let localY = 0;
        let movementX = 0;
        let movementY = 0;

        const positions = this.activePositions;
        const count = positions.length;

        if (count > 0) {
            for (let i = 0; i < count; ++i) {
                centerX += positions[i].clientX;
                centerY += positions[i].clientY;
            }

            centerX /= count;
            centerY /= count;

            if (type === EManipPointerEventType.Move || type === EManipPointerEventType.Hover) {
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

        const element = event.currentTarget;
        if (element instanceof Element) {
            const rect = element.getBoundingClientRect();
            localX = event.clientX - rect.left;
            localY = event.clientY - rect.top;
        }

        return {
            originalEvent: event,
            type: type,
            source: _pointerTypeToSource[event.pointerType],

            isPrimary: event.isPrimary,
            activePositions: positions,
            pointerCount: count,

            centerX,
            centerY,
            localX,
            localY,
            movementX,
            movementY,

            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey
        };
    }

    protected createManipTriggerEvent(event: MouseEvent, type: EManipTriggerEventType): IManipTriggerEvent
    {
        let wheel = 0;

        if (type === EManipTriggerEventType.Wheel) {
            wheel = (event as WheelEvent).deltaY;
        }

        let localX = 0;
        let localY = 0;

        const element = event.currentTarget;
        if (element instanceof Element) {
            localX = event.clientX - element.clientLeft;
            localY = event.clientY - element.clientTop;
        }

        return {
            originalEvent: event,

            type,
            wheel,

            centerX: event.clientX,
            centerY: event.clientY,
            localX,
            localY,

            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey
        }
    }

    protected sendPointerEvent(event: IManipPointerEvent): boolean
    {
        return this.next && this.next.onPointer(event);
    }

    protected sendTriggerEvent(event: IManipTriggerEvent): boolean
    {
        return this.next && this.next.onTrigger(event);
    }
}