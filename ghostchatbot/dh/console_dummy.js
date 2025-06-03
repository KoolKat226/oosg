// Dummy DH.console
"use strict";
// globals: document, window

var DH = window.DH || {};

DH.console = DH.console || {
    show: function () { alert('DH.console.show not implemented'); },
    disable: function () { return; }
};

