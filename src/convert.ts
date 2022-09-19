/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export function dataURItoBlob(dataURI: string): Blob
{
    // extract the data part from the dataURI
    const byteString = atob(dataURI.split(',')[1]);

    const buffer = new ArrayBuffer(byteString.length);
    const bytes = new Uint8Array(buffer);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
        bytes[i] = byteString.charCodeAt(i);
    }

    // extract the type information from the dataURI
    const mimeType = dataURI.split(',')[0].split(':')[1].split(';')[0];

    return new Blob([buffer], { type: mimeType });
}
