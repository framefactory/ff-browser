/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Publisher } from "@ffweb/core/Publisher.js";
import { type IManipEvent, type IPointerEvent, type ITriggerEvent } from "./ManipTarget.js";

////////////////////////////////////////////////////////////////////////////////

export { IManipEvent, IPointerEvent, ITriggerEvent };
export type Context = CanvasRenderingContext2D;

/**
 * 2D paint layer.
 */
export class PaintLayer extends Publisher
{
    private _children: PaintLayer[] = [];
    private _parent: PaintLayer = null;

    private _zIndex = 0;

    private _needsUpdate = false;
    private _needsSort = false;


    constructor(parent?: PaintLayer)
    {
        super();
        this.addEvents("update", "paint", "pointer", "trigger");

        this.parent = parent;
    }

    get parent(): PaintLayer {
        return this._parent;
    }
    set parent(parent: PaintLayer) {
        const thisParent = this._parent;

        if (parent === thisParent) {
            return;
        }
        
        if (thisParent) {
            const index = thisParent._children.indexOf(this);
            if (index >= 0) {
                thisParent._children.splice(index, 1);
            }
        }

        this._parent = parent;

        if (parent) {
            parent._children.push(this);
            parent._needsSort = true;
            this._needsUpdate = true;
        }
    }

    get children(): Readonly<PaintLayer[]> {
        return this._children;
    }

    get zIndex(): number {
        return this._zIndex;
    }
    set zIndex(value: number) {
        if (value !== this._zIndex) {
            this._zIndex = value;
            if (this._parent) {
                this._parent._needsSort = true;
            }
        }
    }

    dispose()
    {
        this.parent = null;    
    }

    requestUpdate(): void
    {
        this._needsUpdate = true;
        this.requestPaint();
    }

    requestPaint(): void
    {
        this.emit("paint");

        if (this._parent) {
            this._parent.requestPaint();
        }
    }

    pick(event: IManipEvent, context: Context, parentUpdated: boolean): PaintLayer
    {
        context.save();
        const childrenNeedUpdate = this.update(context, parentUpdated);

        let pickLayer = null;

        const children = this._children;
        for (let i = children.length - 1; i >= 0; --i) {
            pickLayer = children[i].pick(event, context, childrenNeedUpdate);
            if (pickLayer) {
                break;
            }
        }

        if (!pickLayer && this.onPick(event, context)) {
            pickLayer = this;
        }

        context.restore();
        return pickLayer;
    }

    paint(context: Context, parentUpdated: boolean): void
    {
        context.save();
        const thisUpdated = this.update(context, parentUpdated);

        this.onPaint(context);

        const children = this._children;
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].paint(context, thisUpdated);
        }

        context.restore();
    }

    dispatchPointerEvent(event: IPointerEvent): void
    {
        if (this.onPointer(event)) {
            event.stopPropagation = true;
            return;
        }

        this.emit("pointer", event);

        if (this._parent && !event.stopPropagation) {
            this._parent.dispatchPointerEvent(event);
        }
    }

    dispatchTriggerEvent(event: ITriggerEvent): void
    {
        if (this.onTrigger(event)) {
            event.stopPropagation = true;
            return;
        }

        this.emit("trigger", event);

        if (this._parent && !event.stopPropagation) {
            this._parent.dispatchTriggerEvent(event);
        }
    }

    protected onPointer(event: IPointerEvent): boolean
    {
        event;
        return false;
    }

    protected onTrigger(event: ITriggerEvent): boolean
    {
        event;
        return false;
    }

    protected onPick(event: IManipEvent, context: Context): boolean
    {
        event;
        context;
        return false;
    }

    protected onUpdate(context: Context): void
    {
        context;
        return;
    }

    protected onPaint(context: Context): void
    {
        context;
        return;
    }

    protected update(context: Context, parentUpdated: boolean): boolean
    {
        if (this._needsSort) {
            this._children.sort((a, b) => a._zIndex - b._zIndex);
            this._needsSort = false;
        }

        const needsUpdate = parentUpdated || this._needsUpdate;

        if (needsUpdate) {
            this.onUpdate(context);
            this.emit("update");
        }

        this._needsUpdate = false;
        return needsUpdate;
    }
}