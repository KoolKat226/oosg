// Runtime type checking (mostly used during refactoring)
// require: none
"use strict";

var DH = window.DH || {};

DH.type = {};

DH.type.is = function (aVariable, aName, aType) {
    // pass if aVariable is of given type
    var a = typeof aVariable, s;
    if (a !== aType) {
        s = "Variable " + aName + " is not " + aType + " but " + (typeof aVariable) + "!";
        console.error(s);
        throw s;
    }
};

DH.type.isNumber = function (aVariable, aName) {
    // pass if aVariable is number
    var s;
    DH.type.is(aVariable, aName, 'number');
    if (isNaN(aVariable)) {
        s = "Variable " + aName + " is not a number (NaN)!";
        console.error(s);
        throw s;
    }
};

DH.type.isInteger = function (aVariable, aName) {
    // pass if aVariable is integer
    var s;
    DH.type.isNumber(aVariable, aName);
    if (aVariable % 1 !== 0) {
        s = "Variable " + aName + " is not integer!";
        console.error(s);
        throw s;
    }
};

DH.type.inRange = function (aVariable, aName, aMin, aMax) {
    // pass if aVariable is number in given min-max range
    var s;
    DH.type.is(aVariable, aName, 'number');
    if ((aVariable < aMin) || (aVariable > aMax)) {
        s = "Variable " + aName + " has value " + aVariable + " out of range <" + aMin + ", " + aMax + ">";
        console.error(s);
        throw s;
    }
};

DH.type.isBoolean = function (aVariable, aName) {
    // pass if aVariable is boolean
    DH.type.is(aVariable, aName, 'boolean');
};

DH.type.isString = function (aVariable, aName) {
    // pass if aVariable is string
    DH.type.is(aVariable, aName, 'string');
};

DH.type.isObject = function (aVariable, aName) {
    // pass if aVariable is object
    DH.type.is(aVariable, aName, 'object');
};

DH.type.isFunction = function (aVariable, aName) {
    // pass if aVariable is function
    DH.type.is(aVariable, aName, 'function');
};

DH.type.isArray = function (aVariable, aName) {
    // pass if aVariable is array
    var s;
    if (!aVariable) {
        s = "Undefined variable " + aName + ", expected array!";
        console.error(s);
        throw s;
    }
    if (!Array.isArray(aVariable)) {
        s = "Variable " + aName + " is not array but " + typeof aVariable + "!";
        console.error(s);
        throw s;
    }
};

DH.type.isArrayOf = function (aVariable, aName, aType) {
    // pass if aVariable is array of type
    var i, a, s;
    DH.type.isArray(aVariable, aName);
    for (i = 0; i < aVariable.length; i++) {
        a = typeof aVariable[i];
        if (a !== aType) {
            s = "Variable " + aName + "[" + i + "] is not " + aType + "!";
            console.error(s);
            throw s;
        }
    }
};

DH.type.isArrayOfNumber = function (aVariable, aName) {
    // pass if aVariable is array of numbers
    DH.type.isArrayOf(aVariable, aName, 'number');
};

DH.type.isArrayOfBoolean = function (aVariable, aName) {
    // pass if aVariable is array of booleans
    DH.type.isArrayOf(aVariable, aName, 'boolean');
};

DH.type.isArrayOfString = function (aVariable, aName) {
    // pass if aVariable is array of strings
    DH.type.isArrayOf(aVariable, aName, 'string');
};

DH.type.isArrayOfObject = function (aVariable, aName) {
    // pass if aVariable is array of objects
    DH.type.isArrayOf(aVariable, aName, 'object');
};

DH.type.isArrayOfFunction = function (aVariable, aName) {
    // pass if aVariable is array of functions
    DH.type.isArrayOf(aVariable, aName, 'function');
};

DH.type.unused = function () {
    // this does nothing but hides JSLint warning
    return;
};

