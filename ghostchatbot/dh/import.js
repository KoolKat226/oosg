// Import piece of data by pasting it into textarea
// require: none
"use strict";
// globals: Android

var DH = window.DH || {};

DH.import = function (aCallback, aCallbackCancel) {
    // import data
    var div, h1, textarea, confirm, cancel, bottom;

    div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = 0;
    div.style.top = 0;
    div.style.right = 0;
    div.style.bottom = 0;
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.backgroundColor = 'white';
    div.style.color = 'black';
    div.style.padding = '1ex';
    div.style.zIndex = 106;

    h1 = document.createElement('h1');
    h1.textContent = 'Import';
    h1.style.margin = '0';
    h1.style.padding = '0';
    h1.style.fontSize = 'large';
    div.appendChild(h1);

    textarea = document.createElement('textarea');
    textarea.placeholder = 'Please paste here data you want to import, then press the import button in bottom left corner';
    textarea.style.display = 'block';
    textarea.style.width = "100%";
    textarea.style.flex = '1';
    textarea.style.boxSizing = 'border-box';
    div.appendChild(textarea);

    bottom = document.createElement('div');
    bottom.style.paddingTop = '1ex';
    div.appendChild(bottom);

    confirm = document.createElement('button');
    confirm.textContent = 'Import';
    confirm.style.marginRight = '1ex';
    confirm.onclick = function () {
        var s = textarea.value;
        div.parentElement.removeChild(div);
        aCallback(s);
    };
    bottom.appendChild(confirm);

    cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.style.marginRight = '1ex';
    cancel.onclick = function () {
        div.parentElement.removeChild(div);
        if (aCallbackCancel) {
            aCallbackCancel();
        }
    };
    bottom.appendChild(cancel);

    document.body.appendChild(div);
    textarea.focus();

    return { h1: h1, div: div, textarea: textarea, confirm: confirm, cancel: cancel };
};

DH.import2 = function (aCallback, aFilter) {
    // this version uses file chooser on android and returns the data
    if (typeof Android === 'object' && Android.isReal()) {
        aFilter = aFilter || '*/*';
        console.log('Android import, filter ' + aFilter);
        Android.dataCallback = function () {
            console.log('android import callback 1');
            aCallback(Android.getData());
            console.log('android import callback 2');
        };
        console.log('Android choosefile');
        Android.chooseFile(aFilter);
        console.log('Android choosefile done');
    } else {
        DH.import(aCallback);
    }
};

