// Simplified access to chrome.storage.local with extra checks (it seems to be little bit more anal than necessary but I want to catch as many stupid bugs as possible)
"use strict";
// require: none

var DH = window.DH || {};

DH.storage3 = (function () {
    // Simplified access to chrome.storage.local
    var self = {};
    self.ops = 0;

    function checkKey(aFunctionName, aKey) {
        if (typeof aKey !== 'string') {
            throw "DH.storage3." + aFunctionName + " key " + aKey + " is not string!";
        }
    }

    function checkFun(aFunctionName, aCallback) {
        if (typeof aCallback !== 'function') {
            throw "DH.storage3." + aFunctionName + " callback is not function!";
        }
    }

    self.keyExists = function (aKey, aCallback) {
        // pass to callback true if key exists in storage
        checkKey('keyExists', aKey);
        checkFun('keyExists', aCallback);
        chrome.storage.local.get(aKey, function (aValue) {
            aCallback(aValue.hasOwnProperty(aKey));
            return;
        });
    };

    self.erase = function (aKey) {
        // erase single key
        checkKey('erase', aKey);
        chrome.storage.local.remove(aKey);
    };

    self.size = function (aKey, aCallback) {
        // pass to callback size of a key's value in bytes
        checkKey('size', aKey);
        checkFun('size', aCallback);
        chrome.storage.local.get(aKey, function (aValue) {
            if (aValue.hasOwnProperty(aKey)) {
                aCallback(aValue[aKey].toString().length);
                return;
            }
            aCallback(0);
            return;
        });
    };

    self.sizeAll = function (aHuman, aCallback) {
        // pass to callback size used by entire storage
        checkFun('sizeAll', aCallback);
        chrome.storage.local.getBytesInUse(function (aValue) {
            if (aHuman) {
                if (aValue > 1024) {
                    aCallback(Math.ceil(aValue / 1024) + ' kB');
                    return;
                }
                aCallback(aValue + ' B');
                return;
            }
            aCallback(aValue);
            return;
        });
    };

    self.keys = function (aCallback) {
        // pass to callback all keys
        checkFun('keys', aCallback);
        chrome.storage.local.get(null, function (aValue) {
            aCallback(Object.keys(aValue));
            return;
        });
    };

    self.eraseAll = function (aNothing) {
        // erase entire storage
        if (aNothing !== undefined) {
            throw "DH.storage3.eraseAll does not require parameter, perhaps you wanted to call DH.storage3.erase(key)";
        }
        chrome.storage.local.clear();
    };

    self.debug = function (aCallback) {
        // pass to callback size occupied by each keys and first few bytes of data
        chrome.storage.local.get(null, function (aValue) {
            if (aCallback) {
                aCallback(aValue);
                return;
            }
            console.log(aValue, JSON.stringify(aValue));
        });
    };

    self.readString = function (aKey, aDefault, aCallback) {
        // read string
        self.ops++;
        checkKey('readString', aKey);
        checkFun('readString', aCallback);
        if ((aDefault !== undefined) && (typeof aDefault !== 'string')) {
            throw "DH.storage3.readString default " + aDefault + " is not string nor undefined!";
        }
        chrome.storage.local.get(aKey, function (aValue) {
            if (aValue.hasOwnProperty(aKey)) {
                aCallback(aValue[aKey]);
                return;
            }
            aCallback(aDefault);
            return;
        });
    };

    self.writeString = function (aKey, aValue, aCallback) {
        // write string
        self.ops++;
        checkKey('writeString', aKey);
        checkKey('writeString/value', aValue);
        //checkFun('writeString', aCallback);
        var o = {};
        o[aKey] = aValue;
        chrome.storage.local.set(o, function () {
            if (aCallback) {
                aCallback(aValue);
                return;
            }
        });
    };

    self.readBoolean = function (aKey, aDefault, aCallback) {
        // read true/false, undefined as default, everything else is default with warning
        self.readString(aKey, undefined, function (s) {
            // console.info(aKey, aDefault, s, typeof s);
            if (s === undefined) {
                aCallback(aDefault || false);
                return;
            }
            if ((s !== 'true') && (s !== 'false')) {
                console.warn('DH.storage3.readBoolean: unusual boolean value "' + s + '" for "' + aKey + '", using default');
                aCallback(aDefault || false);
                return;
            }
            aCallback(s === 'true');
            return;
        });
    };

    self.writeBoolean = function (aKey, aValue, aCallback) {
        // write true/false
        var v = aValue === true ? true : false;
        if ((aValue !== true) && (aValue !== false)) {
            console.warn('DH.storage3.writeBoolean: unusual boolean value "' + aValue + '" for "' + aKey + '", using false');
            v = false;
        }
        self.writeString(aKey, v === true ? 'true' : 'false', function () {
            if (aCallback) {
                aCallback(v);
                return;
            }
        });
    };

    self.readNumber = function (aKey, aDefault, aCallback) {
        // read number, undefined as default, everything else is default with warning
        self.readString(aKey, undefined, function (s) {
            var f;
            if (s === undefined) {
                aCallback(aDefault || 0);
                return;
            }
            f = parseFloat(s);
            if (isNaN(f)) {
                console.warn('DH.storage3.readNumber: unusual number value "' + s + '" for "' + aKey + '", using default');
                aCallback(aDefault || 0);
                return;
            }
            aCallback(f);
            return;
        });
    };

    self.writeNumber = function (aKey, aValue, aCallback) {
        // write number
        var v = aValue;
        if (typeof aValue !== 'number') {
            console.warn('DH.storage3.writeNumber: unusual number value "' + aValue + '" for "' + aKey + '", using 0');
            v = 0;
        }
        self.writeString(aKey, aValue.toString(), function () {
            if (aCallback) {
                aCallback(v);
                return;
            }
        });
    };

    self.inc = function (aKey, aDefault, aCallback) {
        // read number, increment it, write it back
        self.readNumber(aKey, aDefault, function (i) {
            i++;
            self.writeNumber(aKey, i, function () {
                aCallback(i);
                return;
            });
        });
    };

    self.readObject = function (aKey, aDefault, aCallback) {
        // read object, undefined as default, everything else is default with warning
        self.readString(aKey, undefined, function (s) {
            var o;
            if (aDefault === undefined) {
                aDefault = {};
            }
            if (typeof aDefault !== 'object') {
                console.warn('DH.storage3.readObject: default is not object in "' + aKey + '" but "' + aDefault + '", using {}');
                aDefault = {};
            }
            if (s === undefined) {
                aCallback(aDefault);
                return;
            }
            o = JSON.parse(s);
            if (typeof o !== 'object') {
                console.warn('DH.storage3.readObject: unusual value "' + s + '" for "' + aKey + '", using default');
                aCallback(aDefault);
                return;
            }
            aCallback(o);
            return;
        });
    };

    self.writeObject = function (aKey, aValue, aCallback) {
        // write object
        var v = aValue;
        if (typeof aValue !== 'object') {
            console.warn('DH.storage3.writeObject: unusual object value "' + aValue + '" for "' + aKey + '", using {}');
            v = {};
        }
        self.writeString(aKey, JSON.stringify(aValue), function () {
            if (aCallback) {
                aCallback(v);
                return;
            }
        });
    };

    self.readArray = function (aKey, aDefault, aCallback) {
        // read array, undefined as default, everything else is default with warning
        self.readString(aKey, undefined, function (s) {
            var o;
            if (aDefault === undefined) {
                aDefault = [];
            }
            if (!Array.isArray(aDefault)) {
                console.warn('DH.storage3.readArray: default is not array in "' + aKey + '" but "' + aDefault + '", using []');
                aDefault = [];
            }
            if (s === undefined) {
                aCallback(aDefault);
                return;
            }
            o = JSON.parse(s);
            if (!Array.isArray(o)) {
                console.warn('DH.storage3.readArray: unusual value "' + s + '" for "' + aKey + '", using default');
                aCallback(aDefault);
                return;
            }
            aCallback(o);
            return;
        });
    };

    self.writeArray = function (aKey, aValue, aCallback) {
        // write array
        var v = aValue;
        if (!Array.isArray(aValue)) {
            console.warn('DH.storage3.writeArray: unusual array value "' + aValue + '" for "' + aKey + '", using []');
            v = [];
        }
        self.writeString(aKey, JSON.stringify(aValue), function () {
            if (aCallback) {
                aCallback(v);
                return;
            }
        });
    };

    self.asyncOnly = function () {
        // return true if storage is async only (packaged chrome apps)
        return window.hasOwnProperty('chrome') && window.chrome.hasOwnProperty('storage') && window.chrome.storage.hasOwnProperty('local') && (typeof window.chrome.storage === 'object');
    };

    return self;
}());

