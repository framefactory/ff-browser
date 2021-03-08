/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import ManipTarget, { IManipListener, IPointerEvent, ITriggerEvent } from "./ManipTarget";
import Layer from "./Layer";

////////////////////////////////////////////////////////////////////////////////

export default class Painter implements IManipListener
{
    private _canvas: HTMLCanvasElement = null;
    private _context: CanvasRenderingContext2D = null;
    private _manip = new ManipTarget();
    private _rootLayer: Layer = null;
    private _activeLayer: Layer = null;
    private _paintScheduled = false;
    private _resizeObserver: ResizeObserver;

    constructor()
    {
        this.doPaint = this.doPaint.bind(this);
        this.onResize = this.onResize.bind(this);
        

        this._manip.listener = this;
        this._resizeObserver = new ResizeObserver(this.onResize);
    }

    get rootLayer(): Layer {
        return this._rootLayer;
    }

    set rootLayer(layer: Layer) {
        if (this._rootLayer) {
            this._rootLayer.off("paint", this.schedulePaint, this);
        }

        this._rootLayer = layer;

        if (layer) {
            layer.on("paint", this.schedulePaint, this);
        }

        this.schedulePaint();
    }

    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }
    set canvas(element: HTMLCanvasElement) {
        if (this._canvas) {
            this._resizeObserver.unobserve(this._canvas);
            this._context = null;
        }

        this._canvas = element;
        this._manip.element = element;

        if (element) {
            this._context = element.getContext("2d");
            this._resizeObserver.observe(element);
        }
    }

    onPointer(event: IPointerEvent): boolean
    {
        const root = this._rootLayer;
        const context = this._context;

        if (!root || !context) {
            return false;
        }

        if (event.type === "pointer-hover" || (event.isPrimary && event.type === "pointer-down")) {
            this._activeLayer = root.pick(event, context) || root;
        }

        let layer = this._activeLayer;
        while (layer && !event.stopPropagation) {
            layer.dispatchPointerEvent(event);
            layer = layer.parent;
        }

        return event.stopPropagation;
    }

    onTrigger(event: ITriggerEvent): boolean
    {
        const root = this._rootLayer;
        const context = this._context;

        if (!root || !context) {
            return false;
        }

        let layer = root.pick(event, context) || root;
        while (layer && !event.stopPropagation) {
            layer.dispatchTriggerEvent(event);
            layer = layer.parent;
        }

        return event.stopPropagation;
    }

    protected onResize(entries: ResizeObserverEntry[])
    {
        const entry = entries[0];
        this._canvas.width = entry.contentRect.width;
        this._canvas.height = entry.contentRect.height;

        this.schedulePaint();
    }

    protected schedulePaint()
    {
        if (!this._paintScheduled) {
            this._paintScheduled = true;
            window.requestAnimationFrame(this.doPaint);
        }
    }

    protected doPaint()
    {
        if (this._context && this._rootLayer) {
            this._rootLayer.paint(this._context);
        }

        this._paintScheduled = false;
    }
}