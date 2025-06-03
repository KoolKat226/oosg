// Small wrapper for throw to be visible in console (especially on mobile)
// require: console
"use strict";

var DH = window.DH || {};

DH.throw = function (aMessage) {
    // small wrapper for throw to be visible in console
    // usage: throw DH.throw("Something went wrong!");
    console.error(aMessage);
    return aMessage;
};
