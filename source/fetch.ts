/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

type Method = "get" | "put" | "patch"| "post" | "delete" | "GET" | "PUT" | "PATCH" | "POST" | "DELETE";

export default {
    json: async function(url: string, method: Method, data?: string | {}): Promise<any> {

        if (data && typeof data !== "string") {
            data = JSON.stringify(data);
        }

        const params: any = {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            method: method,
            credentials: "include",
            body: data
        };

        return fetch(url, params).then(result => {
            if (!result.ok) {
                const message = `fetch.json (${method} at '${url}'), error: ${result.status} - ${result.statusText}`;
                console.warn(message);
                throw new Error(message);
            }

            return result.json();

        }).catch(error => {
            console.warn(`fetch.json (${method} at '${url}'), error: ${error.message}`);
            throw error;
        });
    },

    file: async function(url: string, method: Method, file: File, detectType: boolean = true): Promise<any> {

        const params: any = {
            method,
            credentials: "include",
            body: file
        };

        if (!detectType) {
            params.headers = {
                "Content-Type": "application/octet-stream"
            };
        }

        return fetch(url, params).then(result => {
            if (!result.ok) {
                const message = `fetch.file (${method} at '${url}'), error: ${result.status} - ${result.statusText}`;
                console.warn(message);
                throw new Error(message);
            }

            return result;

        }).catch(error => {
            console.warn(`fetch.file (${method} at '${url}'), error: ${error.message}`);
            throw error;
        });
    }
};