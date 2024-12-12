/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Vector2 } from "@ffweb/core/Vector2.js";
import { Vector3 } from "@ffweb/core/Vector3.js";
import { Matrix3 } from "@ffweb/core/Matrix3.js";

import { IManipEvent, IPointerEvent } from "./ManipTarget.js";
import { PaintLayer, type Context } from "./PaintLayer.js";

////////////////////////////////////////////////////////////////////////////////

export { PaintLayer, Context };

const _dpr = window.devicePixelRatio || 1;
const _vec3 = new Vector3();

/**
 * A paint sheet is a paint layer with its own affine transform
 * which affects the content of the sheet and its children.
 */
export class PaintSheet extends PaintLayer
{
    private _localTransform = new Matrix3();
    private _globalTransform = new Matrix3();
    private _globalTransformInverse = new Matrix3();

    constructor(parent?: PaintLayer)
    {
        super(parent);
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

    globalPointToLocal(x: number, y: number): Vector2
    {
        _vec3.set(x * _dpr, y * _dpr, 1);
        this.globalTransformInverse.transformVector(_vec3);

        return _vec3.toVector2();
    }

    globalDirectionToLocal(x: number, y: number): Vector2
    {
        _vec3.set(x * _dpr, y * _dpr, 0);
        this.globalTransformInverse.transformVector(_vec3);

        return _vec3.toVector2();
    }

    eventPositionToLocal(event: IManipEvent): Vector2
    {
        _vec3.set(event.centerX * _dpr, event.centerY * _dpr, 1);
        this.globalTransformInverse.transformVector(_vec3);

        return _vec3.toVector2();
    }

    eventDeltaToLocal(event: IPointerEvent): Vector2
    {
        _vec3.set(event.movementX * _dpr, event.movementY * _dpr, 0);
        this.globalTransformInverse.transformVector(_vec3);

        return _vec3.toVector2();
    }

    protected update(context: Context, parentUpdated: boolean): boolean
    {
        const didUpdate = super.update(context, parentUpdated);

        const e = this._localTransform.elements;
        context.transform(e[0], e[1], e[3], e[4], e[6], e[7]);

        if (didUpdate) {
            const t = context.getTransform();
            this._globalTransform.set(t.a, t.b, 0, t.c, t.d, 0, t.e, t.f, 1);
            this._globalTransformInverse.copy(this._globalTransform).invert();
        }

        return didUpdate;
    }
}