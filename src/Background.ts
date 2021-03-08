/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Color from "@ff/core/Color";
import Layer, { Context } from "./Layer";

////////////////////////////////////////////////////////////////////////////////

export default class Background extends Layer
{
    private _color = new Color();

    get color(): Color {
        return this._color;
    }
    set color(value: Color) {
        this._color = value;
        this.requestUpdate();
    }

    paint(context: Context)
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