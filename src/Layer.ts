/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Publisher } from "@ffweb/core/Publisher.js";
import { Vector2 } from "@ffweb/core/Vector2.js";
import { Vector3 } from "@ffweb/core/Vector3.js";
import { Matrix3 } from "@ffweb/core/Matrix3.js";

import { IManipEvent, IPointerEvent, ITriggerEvent } from "./ManipTarget.js";

////////////////////////////////////////////////////////////////////////////////

export { IManipEvent, IPointerEvent, ITriggerEvent };
export type Context = CanvasRenderingContext2D;

const _vec3 = new Vector3();

export class Layer extends Publisher
{
    private _children: Layer[] = [];
    private _parent: Layer = null;

    private _localTransform = new Matrix3();
    private _globalTransform = new Matrix3();
    private _globalTransformInverse = new Matrix3();
    private _zIndex = 0;

    private _needsUpdate = false;
    private _needsSort = false;


    constructor(parent?: Layer)
    {
        super();
        this.addEvents("update", "paint", "pointer", "trigger");

        this.parent = parent;
    }

    get parent(): Layer {
        return this._parent;
    }
    set parent(parent: Layer) {
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

    get children(): Readonly<Layer[]> {
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

    get localTransform(): Matrix3 {
        return this._localTransform;
    }
    get globalTransform(): Readonly<Matrix3> {
        return this._globalTransform;
    }
    get globalTransformInverse(): Readonly<Matrix3> {
        return this._globalTransformInverse;
    }

    dispose()
    {
        this.parent = null;    
    }

    globalPointToLocal(x: number, y: number): Vector2
    {
        _vec3.set(x, y, 1);
        this.globalTransformInverse.multiplyVector(_vec3);

        return _vec3.toVector2();
    }

    globalDirectionToLocal(x: number, y: number): Vector2
    {
        _vec3.set(x, y, 0);
        this.globalTransformInverse.multiplyVector(_vec3);

        return _vec3.toVector2();
    }

    eventPositionToLocal(event: IManipEvent): Vector2
    {
        _vec3.set(event.centerX, event.centerY, 1);
        this.globalTransformInverse.multiplyVector(_vec3);

        return _vec3.toVector2();
    }

    eventDeltaToLocal(event: IPointerEvent): Vector2
    {
        _vec3.set(event.movementX, event.movementY, 0);
        this.globalTransformInverse.multiplyVector(_vec3);

        return _vec3.toVector2();
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

    pick(event: IManipEvent, context: Context, parentUpdated: boolean): Layer
    {
        context.save();
        const childrenNeedUpdate = this._update(context, parentUpdated);

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
        const childrenNeedUpdate = this._update(context, parentUpdated);

        this.onPaint(context);

        const children = this._children;
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].paint(context, childrenNeedUpdate);
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

    private _update(context: Context, parentUpdated: boolean): boolean
    {
        if (this._needsSort) {
            this._children.sort((a, b) => a._zIndex - b._zIndex);
            this._needsSort = false;
        }

        if (this._needsUpdate) {
            this.onUpdate(context);
            this.emit("update");
        }

        const e = this._localTransform.elements;
        context.transform(e[0], e[1], e[3], e[4], e[6], e[7]);

        if (this._needsUpdate || parentUpdated) {
            const t = context.getTransform();
            this._globalTransform.set(t.a, t.b, 0, t.c, t.d, 0, t.e, t.f, 1);
            this._globalTransformInverse.copy(this._globalTransform).invert();
        }

        const childrenNeedUpdate = this._needsUpdate || parentUpdated;
        this._needsUpdate = false;
        return childrenNeedUpdate;
    }
}