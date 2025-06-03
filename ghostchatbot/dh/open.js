// Open new page (works in both extension and packaged chrome app)
// require: none
"use strict";

var DH = window.DH || {};

DH.open = function (aUrl, aWidth, aHeight) {
    // open window
    if (window.hasOwnProperty('chrome') && chrome.app && chrome.app.window) {
        if (aWidth && aHeight) {
            chrome.app.window.create(aUrl, {id: aUrl, bounds: { width: aWidth, height: aHeight }});
        } else {
            chrome.app.window.create(aUrl, {id: aUrl});
        }
    } else {
        window.open(aUrl);
    }
};

