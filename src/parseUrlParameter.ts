/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * Returns the value of the variable in the URL query string with the given name.
 * Source: https://stackoverflow.com/questions/901115
 * @param name Name of the variable to look for.
 * @param url URL to search. If omitted, the browser's current location is used.
 * @returns undefined if not found, "" if empty, string value of variable otherwise
 */
export function parseUrlParameter(name: string, url?: string)
{
    if (!url) {
        url = window.location.href;
    }

    name = name.replace(/[\[\]]/g, '\\$&');

    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);

    if (!results) {
        return undefined;
    }

    if (!results[2]) {
        return "";
    }

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}