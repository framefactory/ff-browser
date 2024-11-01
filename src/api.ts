/**
 * FF Typescript Foundation Library
 * Copyright 2024 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 * 
 * This file provides a set of utility functions for making API calls using
 * different HTTP methods. It includes type definitions for API responses and
 * errors, and functions for making GET, POST, PUT, and DELETE requests.
 *
 * This is the browser version of the API utility functions.
 * See the `ff-node` package for the Node.js version.
 */

/**
 * API error object with message, http status code, and optional type.
 */
export type ApiError = {
    message: string,
    code: number,
    type?: string,
}

/**
 * API response object for successful requests.
 */
export type ApiOkResponse<T> = {
    ok: true;
    data: T;
};

/**
 * API response object for failed requests.
 */
export type ApiErrorResponse = {
    ok: false;
    error: ApiError;
}

/**
 * Generic API response type that can be either an `ApiOkResponse` or an `ApiErrorResponse`.
 */
export type ApiResponse<T = never>
    = ApiOkResponse<T> | ApiErrorResponse;

/**
 * Makes a GET request to the given endpoint with optional query parameters.
 * @param endpoint The URL to send the request to.
 * @param params Optional query parameters.
 * @returns A promise that resolves to an `ApiResponse` object.
 */
export const apiGet = async function<R, P extends {} = {}>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("GET", endpoint, params);
}

/**
 * Makes a POST request to the given endpoint with optional body parameters.
 * @param endpoint The URL to send the request to.
 * @param params Optional body parameters.
 * @returns A promise that resolves to an `ApiResponse` object.
 */
export const apiPost = async function<R, P = any>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("POST", endpoint, params);
}

/**
 * Makes a PUT request to the given endpoint with optional body parameters.
 * @param endpoint The URL to send the request to.
 * @param params Optional body parameters.
 * @returns A promise that resolves to an `ApiResponse` object.
 */
export const apiPut = async function<R, P = any>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("PUT", endpoint, params);
}

/**
 * Makes a DELETE request to the given endpoint with optional query parameters.
 * @param endpoint The URL to send the request to.
 * @param params Optional query parameters.
 * @returns A promise that resolves to an `ApiResponse` object.
 */
export const apiDelete = async function<R, P = any>(endpoint: string, params?: P): Promise<ApiResponse<R>>
{
    return apiCall("DELETE", endpoint, params);
}

/**
 * Base function that makes an API call using the given HTTP method, endpoint, and parameters.
 * @param method The HTTP method to use (GET, POST, PUT, DELETE).
 * @param endpoint The URL to send the request to.
 * @param params Optional parameters to include in the request.
 * @returns A promise that resolves to an `ApiResponse` object.
 */
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

    if (response.ok === false) {
        if (text) {
            try {
                const data = JSON.parse(text);
                return {
                    ok: false,
                    error: data,
                } satisfies ApiErrorResponse;
            }
            catch (err) { }    
        }

        return {
            ok: false,
            error: {
                message: text || response.statusText,
                code: response.status,
                type: "http",
            },
        } satisfies ApiErrorResponse;
    }

    if (!text || text === "OK") {
        return {
            ok: true,
            data: null,
        } satisfies ApiOkResponse<R>;
    }

    try {
        const data = JSON.parse(text)

        return {
            ok: true,
            data,
        } satisfies ApiOkResponse<R>;        
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