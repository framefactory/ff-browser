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

        let ok, status;

        return fetch(url, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            method: method,
            credentials: "include",
            body: data as string

        }).then(result => {
            if (!result.ok) {
                console.warn(`fetch (${method} at ${url}) status ${result.status} ${result.statusText}`);
            }

            ok = result.ok;
            status = result.status;
            return result.json();

        }).then(json => {
            if (json.error) {
                console.warn(json.error);
            }

            return { ok, status, json };

        }).catch(err => {
            console.error(`fetch (${method} at ${url}) error: ${err}`);
            throw err;
        });
    },

    file: async function(url: string, method: Method, file: File): Promise<any> {
        return fetch(url, {
            headers: {
                "Content-Type": file.type
            },
            method,
            credentials: "include",
            body: file

        }).catch(err => {
            console.error(`fetch (${method} at ${url}) error: ${err}`);
            throw err;
        });
    }
};