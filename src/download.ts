/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

const _triggerDownload = function(data: Blob, fileName: string)
{
    const dataURL = window.URL.createObjectURL(data);
    const linkElement = document.createElement("a");
    linkElement.download = fileName;
    linkElement.href = dataURL;

    const clickHandler = () => {
        setTimeout(() => {
            URL.revokeObjectURL(dataURL);
            linkElement.removeEventListener("click", clickHandler);
          }, 150);
    };

    linkElement.addEventListener("click", clickHandler);

    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
};

export default {
    /**
     * Prompts the user to download the provided text content as a file.
     * @param text text string to include.
     * @param fileName name of the downloadable file.
     */
    text: function(text: string, fileName: string): void {

        _triggerDownload(new Blob([text], { type: "text/plain" }), fileName);
    },

    /**
     * Prompts the user to download the provided JSON content as a file.
     * @param json JSON data to include.
     * @param fileName name of the downloadable file.
     */
    json: function(json: object | string, fileName: string): void {

        if (typeof json === "object") {
            json = JSON.stringify(json);
        }

        _triggerDownload(new Blob([json], { type: "text/json" }), fileName);
    },
}

