/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Color } from "@ffweb/core/Color.js";
import { Layer, Context } from "./Layer.js";

////////////////////////////////////////////////////////////////////////////////

export class Background extends Layer
{
    private _color = new Color();

    get color(): Color {
        return this._color;
    }
    set color(value: Color) {
        this._color = value;
        this.requestUpdate();
    }

    protected onPaint(context: Context)
    {
        const { width, height } = context.canvas;
        const color = this._color;

        context.resetTransform();

        if (color.alpha < 1) {
            context.clearRect(0, 0, width, height);
        }
        if (color.alpha > 0) {
            context.fillStyle = color.toString();
            context.fillRect(0, 0, width, height);    
        }
    }
}