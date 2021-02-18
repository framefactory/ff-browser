/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

export class LocalStorage
{
    readonly storage: Storage;

    constructor()
    {
        this.storage = window ? window.localStorage : undefined;
    }

    isSupported(): boolean
    {
        return !!this.storage;
    }

    get<T = any>(endpoint: string, id: string): T
    {
        this.throwIfNotSupported();

        const key = this.getKey(endpoint, id);

        const json = this.storage.getItem(key);
        if (!json) {
            return undefined;
        }

        return JSON.parse(json);
    }

    set<T = any>(endpoint: string,  obj: T, id: string): string
    {
        this.throwIfNotSupported();

        id = id || obj["id"] || uniqueId();
        const key = this.getKey(endpoint, id);
        this.storage.setItem(key, JSON.stringify(obj));

        return id;
    }

    remove(endpoint: string, id: string): boolean
    {
        this.throwIfNotSupported();

        const key = this.getKey(endpoint, id);

        if (this.storage.getItem(key)) {
            this.storage.removeItem(key);
            return true;
        }

        return false;
    }

    protected getKey(endpoint: string, id: string): string
    {
        return endpoint + "/" + id;
    }

    protected throwIfNotSupported(): void
    {
        if (!this.storage) {
            throw new Error("local storage not supported");
        }
    }
}

const localStorage = new LocalStorage();
export default localStorage;
