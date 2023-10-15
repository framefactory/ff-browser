/**
 * FF Typescript Foundation Library
 * Copyright 2023 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export class HttpError extends Error
{
    status: number;
    statusText: string;

    constructor(status: number, statusText: string)
    {
        super(`${status} ${statusText}`);

        this.status = status;
        this.statusText = statusText;
    }
}

export const apiGet = async function<R, P extends {} = {}>(endpoint: string, params?: P): Promise<R>
{
    return apiCall("GET", endpoint, params);
}

export const apiPost = async function<R, P = any>(endpoint: string, params?: P): Promise<R>
{
    return apiCall("POST", endpoint, params);
}

export const apiPut = async function<R, P = any>(endpoint: string, params?: P): Promise<R>
{
    return apiCall("PUT", endpoint, params);
}

export const apiDelete = async function<R, P = any>(endpoint: string, params?: P): Promise<R>
{
    return apiCall("DELETE", endpoint, params);
}

export const apiCall = async function<R, P = any>(method: string, endpoint: string, params?: P): Promise<R>
{
    method = method.toUpperCase();
    const url = new URL(endpoint, window.location.origin);

    if (params === undefined) {
        params = {} as P;
    }

    if (method === "GET") {
        Object.keys(params).forEach(key => {
            if (typeof params[key] !== "boolean" || params[key]) {
                url.searchParams.set(key, params[key]);
            }
        });
    }

    const init: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "same-origin",
    };

    if (method !== "GET") {
        init.body = JSON.stringify(params);
    }

    const response = await fetch(url.toString(), init);

    if (!response.ok) {
        throw new HttpError(response.status, response.statusText);
    }

    return response.json();
}