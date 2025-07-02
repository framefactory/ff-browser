/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

////////////////////////////////////////////////////////////////////////////////

export interface IDragListener
{
    onDragStart?: (event: PointerEvent) => void;
    onDragMove?: (event: PointerEvent, dx: number, dy: number) => void;
    onDragEnd?: (event: PointerEvent) => void;
    onClick?: (event: PointerEvent) => void;
}

/**
 * Composable class, listens to pointer events on a bound HTML element
 * and emits drag events when the pointer is moved while pressed down.
 */
export class DragTarget
{
    listener: IDragListener = null;
    isEnabled = true;
    dragEnabled = true;

    private _element: HTMLElement = null;

    private _isActive = false;
    private _isDragging = false;

    private _startX = 0;
    private _startY = 0;

    private _lastX = 0;
    private _lastY = 0;
    
    private _minDragDistance;
    private _preventDefault;


    constructor(targetElement?: HTMLElement, minDragDistance: number = 0, preventDefault: boolean = false)
    {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        
        this._minDragDistance = minDragDistance;
        this._preventDefault = preventDefault;

        this.element = targetElement;
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

    get element(): HTMLElement {
        return this._element;
    }
    set element(value: HTMLElement) {
        const thisElement = this._element;
        if (thisElement) {
            thisElement.removeEventListener("pointerdown", this.onPointerDown);
            thisElement.removeEventListener("pointermove", this.onPointerMove);
            thisElement.removeEventListener("pointerup", this.onPointerUp);
            thisElement.removeEventListener("pointercancel", this.onPointerUp);
        }

        this._element = value;

        if (value) {
            value.addEventListener("pointerdown", this.onPointerDown);
            value.addEventListener("pointermove", this.onPointerMove);
            value.addEventListener("pointerup", this.onPointerUp);
            value.addEventListener("pointercancel", this.onPointerUp);
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
        else {
            this.listener?.onClick?.(event);
        }

        if (this._preventDefault) {
            event.preventDefault();
        }
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
                    this.listener?.onDragStart?.(event);

                    this._lastX = event.clientX;
                    this._lastY = event.clientY;
                    }
            }
            else {
                this.listener?.onDragMove?.(event, dx, dy);

                this._lastX = event.clientX;
                this._lastY = event.clientY;
            }
        }

        if (this._preventDefault) {
            event.preventDefault();
        }
    }

    protected onPointerUp(event: PointerEvent): void
    {
        if (event.isPrimary && this._isActive) {
            if (this._isDragging) {
                this.listener?.onDragEnd?.(event);
                this._isDragging = false;
            }
            else {
                this.listener?.onClick?.(event);
            }

            this._element.releasePointerCapture(event.pointerId);
            this._isActive = false;
        }

        if (this._preventDefault) {
            event.preventDefault();
        }
    }
}