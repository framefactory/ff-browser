/**
 * FF Typescript Foundation Library
 * Copyright 2023 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export type ApiError = {
    message: string,
    code: number,
    type?: string,
}

export type ApiOkResponse<T> = {
    ok: true;
    data: T;
};

export type ApiErrorResponse = {
    ok: false;
    error: ApiError;
}

export type ApiResponse<T = never>
    = ApiOkResponse<T> | ApiErrorResponse;


export const apiGet = async function<R, P extends {} = {}>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("GET", endpoint, params);
}

export const apiPost = async function<R, P = any>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("POST", endpoint, params);
}

export const apiPut = async function<R, P = any>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("PUT", endpoint, params);
}

export const apiDelete = async function<R, P = any>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("DELETE", endpoint, params);
}

export const apiCall = async function<R, P = any>(method: string, endpoint: string, params?: P): Promise<ApiResponse<R>>
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
            "Accept": "application/json",
        },
        credentials: "same-origin",
    };

    if (method === "POST" && params instanceof FormData) {
        init.body = params;
    }
    else if (method !== "GET") {
        init.body = JSON.stringify(params);
        init.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url.toString(), init);
    const text = await response.text();

    try {
        const data = text && text !== "OK" ? JSON.parse(text) : undefined;

        if (response.ok) {
            return {
                ok: true,
                data,
            } satisfies ApiOkResponse<R>;
        }

        return {
            ok: false,
            error: data,
        } satisfies ApiErrorResponse;
        
    }
    catch (err) {
        return {
            ok: false,
            error: {
                message: "Invalid JSON: failed to parse response.",
                code: response.status,
                type: "format",
            },
        } satisfies ApiErrorResponse;
    }
}