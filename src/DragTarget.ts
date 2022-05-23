/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

////////////////////////////////////////////////////////////////////////////////

export default class DragTarget
{
    isEnabled = true;
    dragEnabled = true;

    onDragStart: (event: PointerEvent) => void = null;
    onDragMove: (event: PointerEvent, dx: number, dy: number) => void = null;
    onDragEnd: (event: PointerEvent) => void = null;
    onClick: (event: PointerEvent) => void = null;

    private _element: HTMLElement = null;
    private _isActive = false;
    private _isDragging = false;

    private _startX = 0;
    private _startY = 0;

    private _lastX = 0;
    private _lastY = 0;
    
    private _minDragDistance;

    constructor(minDragDistance = 0)
    {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        
        this._minDragDistance = minDragDistance;
    }

    get isDragging(): boolean {
        return this._isDragging;
    }
    get startX(): number {
        return this._startX;
    }
    get startY(): number {
        return this._startY;
    }
    get lastX(): number {
        return this._lastX;
    }
    get lastY(): number {
        return this._lastY;
    }

    bind(element: HTMLElement): void
    {
        this.unbind();
        this._element = element;

        element.addEventListener("pointerdown", this.onPointerDown);
        element.addEventListener("pointermove", this.onPointerMove);
        element.addEventListener("pointerup", this.onPointerUp);
        element.addEventListener("pointercancel", this.onPointerUp);
    }

    unbind(): void
    {
        const element = this._element;
        this._element = null;
        
        if (element) {
            element.removeEventListener("pointerdown", this.onPointerDown);
            element.removeEventListener("pointermove", this.onPointerMove);
            element.removeEventListener("pointerup", this.onPointerUp);
            element.removeEventListener("pointercancel", this.onPointerUp);
        }
    }

    protected onPointerDown(event: PointerEvent): void
    {

        if (event.isPrimary && this.isEnabled) {
            this._startX = this._lastX = event.clientX;
            this._startY = this._lastY = event.clientY;

            this._element.setPointerCapture(event.pointerId);
            this._isActive = true;
        }

        event.stopPropagation();
        event.preventDefault();
    }

    protected onPointerMove(event: PointerEvent): void
    {
        if (this.isEnabled && event.isPrimary && this._isActive && this.dragEnabled) {
            const dx = event.clientX - this._lastX;
            const dy = event.clientY - this._lastY;

            if (!this._isDragging) {
                const dist = Math.abs(dx) + Math.abs(dy);

                if (dist >= this._minDragDistance) {
                    this._isDragging = true;
                    this.onDragStart && this.onDragStart(event);                

                    this._lastX = event.clientX;
                    this._lastY = event.clientY;
                    }
            }
            else {
                this.onDragMove && this.onDragMove(event, dx, dy);

                this._lastX = event.clientX;
                this._lastY = event.clientY;
            }
        }

        event.stopPropagation();
        event.preventDefault();
    }

    protected onPointerUp(event: PointerEvent): void
    {
        if (event.isPrimary && this._isActive) {
            if (this._isDragging) {
                this.onDragEnd && this.onDragEnd(event);
                this._isDragging = false;
            }
            else {
                this.onClick && this.onClick(event);
            }

            this._element.releasePointerCapture(event.pointerId);
            this._isActive = false;
        }

        event.stopPropagation();
        event.preventDefault();
    }
}