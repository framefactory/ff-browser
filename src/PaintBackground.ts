/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Color } from "@ffweb/core/Color.js";
import { PaintSheet, PaintLayer, Context } from "./PaintSheet.js";

////////////////////////////////////////////////////////////////////////////////

const _dpr = window.devicePixelRatio || 1;

export class PaintBackground extends PaintSheet
{
    private _color = new Color();

    constructor(parent?: PaintLayer)
    {
        super(parent);
        this.localTransform.makeScale(_dpr, _dpr);
    }

    get color(): Color {
        return this._color;
    }
    set color(value: Color) {
        this._color = value;
        this.requestUpdate();
    }

    protected onPaint(context: Context)
    {
        const width = context.canvas.width / _dpr;
        const height = context.canvas.height / _dpr;
        const color = this._color;

        if (color.alpha < 1) {
            context.clearRect(0, 0, width, height);
        }
        if (color.alpha > 0) {
            context.fillStyle = color.toString();
            context.fillRect(0, 0, width, height);    
        }
    }
}