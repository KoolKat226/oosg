// Animated fullscreen window (flash.js = fullscreen splash.js)
// require: none
"use strict";
// globals: document, window, setTimeout

var DH = window.DH || {};

DH.flash = function (aTitle, aButtons, aColor, aShowCallback, aButtonCallback) {
    // Animated fullscreen window
    var div, h1, content, header, i, button, buttons, first, hide, hasButtons = Array.isArray(aButtons) && aButtons.length > 0;
    aButtons = typeof aButtons === 'string' ? [aButtons] : aButtons;

    // window
    div = document.createElement('div');
    div.className = 'flash';
    if (aColor) {
        div.style.backgroundColor = aColor;
    }

    // header with title
    header = document.createElement('div');
    header.className = 'header';
    div.appendChild(header);
    if (aTitle) {
        h1 = document.createElement('h1');
        h1.textContent = aTitle;
        header.appendChild(h1);
    }

    function onKeyDown(event) {
        // Enter will choose first button, Esc will Close
        if (event.keyCode === 13) {
            if (hasButtons) {
                first.click();
            } else {
                hide();
            }
        }
        if (event.keyCode === 27) {
            hide();
        }
    }
    window.addEventListener('keydown', onKeyDown, true);

    hide = function () {
        //var btn = event && event.target && event.target.nodeName === 'BUTTON' && event.target.textContent;
        div.style.opacity = 0;
        div.style.left = '40vw';
        div.style.top = '40vh';
        div.style.width = '20vw';
        div.style.height = '20vh';
        window.removeEventListener('keydown', onKeyDown, true);
        /*
        setTimeout(function () {
            if (!callback_called) {
                callback_called = true;
                if (aButtonCallback) {
                    aButtonCallback(btn);
                }
            }
        }, 700);
        */
    };

    function onButtonClick(event) {
        var btn = event && event.target && event.target.nodeName === 'BUTTON' && event.target.textContent;
        if (aButtonCallback) {
            if (btn === 'Close') {
                hide();
            }
            aButtonCallback(btn);
        }
    }

    content = document.createElement('div');
    content.className = 'content';
    div.appendChild(content);

    if (aButtons) {
        buttons = document.createElement('div');
        buttons.className = 'buttons';
        div.appendChild(buttons);

        for (i = 0; i < aButtons.length; i++) {
            button = document.createElement('button');
            button.textContent = aButtons[i];
            button.addEventListener('click', onButtonClick);
            buttons.appendChild(button);
            if (i === 0) {
                first = button;
            }
        }
    }

    document.body.appendChild(div);

    // start animation
    setTimeout(function () {
        div.style.opacity = 1;
        div.style.left = 0;
        div.style.top = 0;
        div.style.width = '100vw';
        div.style.height = '100vh';
    }, 100);

    // content callback
    if (typeof aShowCallback === 'function') {
        setTimeout(function () {
            aShowCallback(content);
            content.style.opacity = 1;
        }, 500);
    }

    // text callback
    if (typeof aShowCallback === 'string') {
        content.textContent = aShowCallback;
        content.style.opacity = 1;
    }

    return {
        header: header,
        div: div,
        h1: h1,
        content: content,
        buttons: buttons,
        hide: hide
    };
};

