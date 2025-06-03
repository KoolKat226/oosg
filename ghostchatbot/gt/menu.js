// Main menu
"use strict";
// globals: document, window, DH, setTimeout, GT

var GT = GT || {};

GT.menuLogNote = 'x';

GT.menu = function (aTitle, aMainSubtitle, aButtons, aCallback) {
    // Show ending menu
    GT.pause = true;
    if (GT.menuVisible) {
        console.log('Menu already visible');
        return;
    }
    GT.menuVisible = true;

    if (!aButtons) {
        console.error('GT.menu no buttons ' + GT.menuLogNote || 'z');
        return;
    }

    // background
    var bg, h1, h2, div, i, t, tp = GT.keyboard && GT.keyboard.touchpad;
    bg = document.createElement('div');
    bg.className = 'menu';

    // title
    h1 = document.createElement('h1');
    h1.textContent = aTitle;
    bg.appendChild(h1);
    h2 = document.createElement('h2');
    h2.textContent = aMainSubtitle;
    bg.appendChild(h2);

    // div
    div = document.createElement('div');
    div.className = 'main';
    bg.appendChild(div);

    function one(aCaption, aCallback, aCallbackData, aSubtitle) {
        // One button
        var item = document.createElement('button'), sub;
        item.textContent = aCaption;
        item.className = 'item';
        item.addEventListener('click', function (event) {
            aCallback(aCaption, aCallbackData, aSubtitle, event);
        });
        item.data = aCallbackData;
        if (aSubtitle) {
            sub = document.createElement('div');
            sub.className = 'subtitle';
            sub.textContent = aSubtitle;
            sub.data = aCallbackData;
            item.appendChild(sub);
        }
        if (!aCallback) {
            item.disabled = true;
        }
        div.appendChild(item);
        return item;
    }

    function onFeedback() {
        var f = DH.feedback('https://ghost.sk/feedback/send.php', 'gt2', 'extra', function (aSent) {
            if (aSent) {
                alert('Thank you for your feedback');
                /*
                fb.textContent = 'Feedback sent';
                setTimeout(function () {
                    fb.textContent = 'Feedback';
                }, 2000);
                */
            }
        }, false);
        // minimal styling
        f.div.style.zIndex = 30;
        f.div.style.backgroundColor = '#6daa2c';
        f.h1.style.fontWeight = 'normal';
        f.h1.style.textAlign = 'center';
        f.send.style.minWidth = '20%';
        f.cancel.style.minWidth = '20%';
        f.send.style.minHeight = '1cm';
        f.cancel.style.minHeight = '1cm';
    }

    function hide() {
        // hide menu
        GT.menuVisible = false;
        bg.parentElement.removeChild(bg);
        GT.pause = false;
        // restore touchpad
        if (GT.keyboard) {
            GT.keyboard.touchpad = tp;
        }
    }

    one('Return to game', hide);

    for (i = 0; i < aButtons.length; i++) {
        t = aButtons[i].split('\n');
        one(t[0], aButtons[i] === 'Feedback' ? onFeedback : aCallback, aButtons[i], t[1]);
    }

    // disable touchpad
    if (GT.keyboard) {
        GT.keyboard.touchpad = false;
    }

    // show menu
    document.body.appendChild(bg);
    return { bg: bg, hide: hide };
};

