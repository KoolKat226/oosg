// Copy text to clipboard
"use strict";
// require: none
// globals: document, setTimeout

var DH = window.DH || {};

DH.copyToClipboard = function (aData) {
    // copy piece of text to clipboard
    var t = document.createElement('textarea'), d;
    t.style.position = 'fixed';
    t.style.left = 0;
    t.style.top = 0;
    t.style.width = '2em';
    t.style.height = '2em';
    t.style.padding = 0;
    t.style.border = 0;
    t.style.outline = 0;
    t.style.boxShadow = 'none';
    t.style.opacity = 0.0;
    d = typeof aData === 'string' ? aData : JSON.stringify(aData);
    t.value = d;
    document.body.appendChild(t);
    t.select();
    setTimeout(function () {
        try {
            document.execCommand('copy');
            document.body.removeChild(t);
        } catch (e) {
            console.error('Cannot copy to clipboard', e);
            prompt('Copy', d);
        }
    }, 1000);
};

DH.copyToClipboard2 = function (aData, aLabel) {
    // This version works on Android
    var bg, div, label, textarea, button, s;

    bg = document.createElement('div');
    bg.style.background = 'rgba(0,0,0,0.5)';
    bg.style.position = 'fixed';
    bg.style.left = 0;
    bg.style.top = 0;
    bg.style.right = 0;
    bg.style.bottom = 0;
    bg.style.display = 'flex';
    bg.style.flexDirection = 'column';
    bg.style.alignItems = 'center';
    bg.style.justifyContent = 'center';
    bg.style.zIndex = 106;
    bg.addEventListener('click', function () {
        if (aData) {
            textarea.select();
            if (!document.execCommand('copy')) {
                alert('Copy failed!');
            }
            bg.style.opacity = 0.5;
            setTimeout(function () {
                bg.parentElement.removeChild(bg);
            }, 300);
        } else {
            bg.parentElement.removeChild(bg);
        }
    });
    document.body.appendChild(bg);

    textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = 0;
    textarea.style.top = 0;
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = 0;
    textarea.style.border = 0;
    textarea.style.outline = 0;
    textarea.style.boxShadow = 'none';
    textarea.style.opacity = 0;
    s = typeof aData === 'string' ? aData : JSON.stringify(aData);
    textarea.value = s;
    bg.appendChild(textarea);

    div = document.createElement('div');
    div.style.backgroundColor = 'white';
    div.style.border = '1px solid black';
    div.style.borderRadius = '1ex';
    div.style.padding = '1em';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    bg.appendChild(div);

    label = document.createElement('div');
    aLabel = aLabel || '%d kB will be copied to clipboard';
    label.textContent = aLabel.replace('%d', (Math.ceil(s.length / 1000)).toFixed(0));
    label.style.fontSize = 'large';
    div.appendChild(label);

    button = document.createElement('button');
    button.textContent = 'OK';
    button.style.flex = 1;
    div.appendChild(button);
};

