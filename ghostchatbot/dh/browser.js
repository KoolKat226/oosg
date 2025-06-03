// Small embedded browser (iframe with url bar)
// require: none
"use strict";

var DH = window.DH || {};

DH.top = function () {
    // returns highest used zIndex plus 1
    var w = document.createTreeWalker(document.body), n, r = 0;
    n = w.nextNode();
    while (n) {
        if (n.style && n.style.zIndex > 0) {
            r = parseInt(n.style.zIndex, 10);
        }
        n = w.nextNode();
    }
    return r + 1;
};

DH.browser = function (aUrl) {
    // Show small fullscreen embedded browser (iframe with url bar)
    console.log('DH.browser', aUrl);
    var div, menu, input, go, close, iframe;

    div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.backgroundColor = 'white';
    div.style.left = '0';
    div.style.top = '0';
    div.style.right = '0';
    div.style.bottom = '0';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.zIndex = DH.top();
    document.body.appendChild(div);

    menu = document.createElement('div');
    menu.style.display = 'flex';
    div.appendChild(menu);

    input = document.createElement('input');
    input.type = 'url';
    input.value = aUrl;
    input.style.flex = 1;
    menu.appendChild(input);

    go = document.createElement('button');
    go.textContent = 'Go';
    go.addEventListener('click', function () { iframe.src = input.value; });
    menu.appendChild(go);

    close = document.createElement('button');
    close.textContent = 'X';
    close.addEventListener('click', function () { div.parentElement.removeChild(div); });
    menu.appendChild(close);

    iframe = document.createElement('iframe');
    iframe.src = aUrl;
    iframe.style.border = 0;
    iframe.style.flex = 1;
    div.appendChild(iframe);
};

