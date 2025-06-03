// Simple key-value storage that works in file://, http:// and in chrome apps.
// Because chrome apps does not support synchronous code, even local storage is
// asynchronous here which makes it behave the same in all cases. This makes
// everything annoying but there is no way around.
// This is second version of storage and will soon replace original storage
// require: type
"use strict";

var DH = window.DH || {};

DH.storage2 = (function () {
    // create storage object
    var self = {};

    // detect which storage is available
    self.mode = '';
    if (window.hasOwnProperty('chrome') && chrome.storage && chrome.storage.local) {
        self.mode = 'chrome.storage.local';
    } else if (localStorage) {
        self.mode = 'localStorage';
    }
    console.log('DH.storage2.mode = ' + self.mode);

    self.read = function (aKey, aCallback) {
        // read data
        DH.type.isString(aKey, 'aKey');
        DH.type.isFunction(aCallback, 'aCallback');
        if (self.mode === 'chrome.storage.local') {
            chrome.storage.local.get(aKey, function (aValue) {
                if (aValue.hasOwnProperty(aKey)) {
                    aCallback(aValue[aKey]);
                } else {
                    aCallback('');
                }
            });
            return;
        }
        if (self.mode === 'localStorage') {
            if (localStorage.hasOwnProperty(aKey)) {
                aCallback(localStorage.getItem(aKey));
            } else {
                aCallback('');
            }
            return;
        }
        throw 'Unsupported storage mode: ' + self.mode;
    };

    self.write = function (aKey, aValue, aCallback) {
        // write data
        DH.type.isString(aKey, 'aKey');
        DH.type.isString(aValue, 'aValue');
        if (aCallback) {
            DH.type.isFunction(aCallback, 'aCallback');
        }
        if (self.mode === 'chrome.storage.local') {
            var o = {};
            o[aKey] = aValue;
            chrome.storage.local.set(o, function () {
                if (typeof aCallback === 'function') {
                    aCallback(aValue);
                }
            });
            return;
        }
        if (self.mode === 'localStorage') {
            localStorage.setItem(aKey, aValue);
            if (typeof aCallback === 'function') {
                aCallback(aValue);
            }
            return;
        }
        throw 'Unsupported storage mode: ' + self.mode;
    };

    self.erase = function (aKey, aCallback) {
        // erase data
        DH.type.isString(aKey, 'aKey');
        if (aCallback) {
            DH.type.isFunction(aCallback, 'aCallback');
        }
        if (self.mode === 'chrome.storage.local') {
            chrome.storage.local.remove(aKey, function () {
                if (typeof aCallback === 'function') {
                    aCallback('');
                }
            });
            return;
        }
        if (self.mode === 'localStorage') {
            localStorage.removeItem(aKey);
            if (typeof aCallback === 'function') {
                aCallback('');
            }
            return;
        }
        throw 'Unsupported storage mode: ' + self.mode;
    };

    return self;
}());

