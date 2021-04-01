/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Publisher from "@ff/core/Publisher";

////////////////////////////////////////////////////////////////////////////////

export interface IPulseState
{
    frame: number;
    now: number;
    seconds: number;
    delta: number;
    fps: number;
    averageDelta: number;
    averageFps: number;
    realtime: boolean;
}

export default class Pulse extends Publisher
{
    private _event: IPulseState;
    private _handle = 0;
    private _start = 0;
    private _stop = 0;
    private _deltaHistory: number[] = [];
    private _historyIndex = 0
    private _historySize = 60;

    constructor()
    {
        super();
        this.addEvent("pulse");

        this._event = {
            frame: 0,
            now: 0,
            seconds: 0,
            delta: 0,
            fps: 0,
            averageDelta: 0,
            averageFps: 0,
            realtime: false,
        };

        this._onAnimationFrame = this._onAnimationFrame.bind(this);
    }

    get isRunning(): boolean {
        return this._handle > 0;
    }

    get state(): Readonly<IPulseState> {
        return this._event;
    }

    get fps(): number {
        return this._event.fps;
    }

    set fps(value: number) {
        this._event.fps = value;
    }

    start()
    {
        if (this._handle > 0) {
            return;
        }

        this._start = Date.now();

        const context = this._event;
        context.frame = 0;
        context.realtime = true;

        this._onAnimationFrame();
    }

    stop()
    {
        if (this._handle > 0) {
            cancelAnimationFrame(this._handle);
            this._handle = 0;
            this._stop = Date.now();
        }
    }

    continue()
    {
        if (this._handle > 0) {
            return;
        }

        this._start += Date.now() - this._stop;

        const context = this._event;
        context.realtime = true;

        this._onAnimationFrame();
    }

    nudge(delta = 0)
    {
        if (this._handle > 0) {
            throw new Error("can't pulse manually while running");
        }

        const context = this._event;
        context.frame++;

        if (delta > 0) {
            context.delta = delta;
            context.seconds += delta;
            context.fps = 1 / delta;
        }
        else if (context.fps > 0) {
            context.delta = 1 / context.fps;
            context.seconds += delta;
        }
        else {
            throw new Error("must provide delta > 0 or set fps first");
        }

        this.emit("pulse", context);
    }

    private _onAnimationFrame()
    {
        const event = this._event;

        event.now = Date.now();
        const seconds = (event.now - this._start) * 0.001;
        event.delta = seconds - event.seconds;
        event.fps = event.delta > 0 ? 1 / event.delta : 0;
        event.averageDelta = this._getAverageDelta(event.delta);
        event.averageFps = event.averageDelta > 0 ? 1 / event.averageDelta : 0;

        event.frame++;
        event.seconds = seconds;

        this._handle = requestAnimationFrame(this._onAnimationFrame);
        this.emit("pulse", event);
    }

    private _getAverageDelta(delta: number): number
    {
        const size = this._historySize;

        if (delta > 0) {
            this._historyIndex = (this._historyIndex + 1) % size;
            this._deltaHistory[this._historyIndex] = delta;
        }

        let sum = 0;
        let count = 0;
        for (let i = 0; i < size; ++i) {
            const d = this._deltaHistory[i];
            if (d > 0) {
                count++;
                sum += d;
            }
        }

        return sum > 0 ? sum / count : 0;
    }
}
