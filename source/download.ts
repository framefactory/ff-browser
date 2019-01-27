/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */


const _triggerDownload = function(dataURL: string, fileName: string)
{
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default {
    text: function(text: string, fileName: string) {

        const dataURL = window.URL.createObjectURL(new Blob([text], { type: "text/plain" }));
        _triggerDownload(dataURL, fileName);
    },
    json: function(json: object | string, fileName: string) {

        if (typeof json === "object") {
            json = JSON.stringify(json);
        }

        const dataURL = window.URL.createObjectURL(new Blob([json], { type: "text/json" }));
        _triggerDownload(dataURL, fileName);
    },
    url: function(url: string, fileName: string) {
        _triggerDownload(url, fileName);
    }
}

