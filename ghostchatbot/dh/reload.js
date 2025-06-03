// F5 will reload app
// require: none
"use strict";

if (window.hasOwnProperty('chrome') && chrome.runtime && chrome.app && chrome.app.window) {
    try {
        chrome.app.window.current();
        window.addEventListener('keydown', function (event) {
            if ((event.key === 'F5') || (event.keyIdentifier === 'F5')) {
                chrome.runtime.reload();
            }
        });
    } catch (ignore) {
    }
}
