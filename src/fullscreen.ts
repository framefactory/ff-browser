/**
 * FF Typescript Foundation Library
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * Puts the given HTML element in fullscreen mode.
 * @param {HTMLElement | null} element The element to present in fullscreen mode.
 */
export function enterFullscreen(element: HTMLElement) : void
{
    let elem: any = element;

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
}

export function exitFullscreen(): void
{
    document.exitFullscreen();
}