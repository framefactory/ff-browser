/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

////////////////////////////////////////////////////////////////////////////////

/**
 * Uses browser local storage to store and retrieve persistent data
 * for a specific page, designated by its url path.
 */
export class PageStore<T=any>
{
    readonly storage: Storage;
    readonly path: string;
    readonly preset: T;

    constructor(path: string, preset: T)
    {
        this.storage = window?.localStorage;
        this.path = path;
        this.preset = preset;
    }

    isSupported(): boolean
    {
        return !!this.storage;
    }

    get(): T
    {
        const item = this.storage?.getItem(this.path);
        return item ? JSON.parse(item) : this.preset;
    }

    set(obj: T): void
    {
        this.storage?.setItem(this.path, JSON.stringify(obj));
    }
}