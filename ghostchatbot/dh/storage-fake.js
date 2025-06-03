// Fake storage that does nothing (for porting chrome packaged apps games)
"use strict";
// require: none
// globals: chrome

var DH = window.DH || {};

DH.storage = (function () {
    var self = {}, data = {}, initialized = false, callbacks = [];
    self.ops = 0;

    self.prepare = function (aCallback) {
        // Call callback when storage is ready (now or later)
        //console.warn('DH.storage.prepare');
        if (initialized) {
            aCallback();
            return;
        }
        callbacks.push(aCallback);
    };

    chrome.storage.local.get({data: {}}, function (aData) {
        //console.warn('DH.storage.internal_init');
        var i, k;
        // merge new into old
        for (k in data) {
            if (data.hasOwnProperty(k)) {
                aData.data[k] = data[k];
            }
        }
        data = aData.data;
        //console.log('storage data', JSON.stringify(data, undefined, 4));
        // write merged data
        chrome.storage.local.set({data: data}, function () {
            for (i = 0; i < callbacks.length; i++) {
                callbacks[i]();
            }
            callbacks = [];
            initialized = true;
        });
    });

    self.keyExists = function (aKey) {
        //console.warn('DH.storage.keyExists', aKey);
        return data.hasOwnProperty(aKey);
    };

    self.erase = function (aKey) {
        // erase single key
        //console.warn('DH.storage.erase', aKey);
        delete data[aKey];
        chrome.storage.local.set({data: data});
    };

    self.size = function (aKey) {
        // return size of a key's value in bytes
        //console.warn('DH.storage.size', aKey);
        return data[aKey].length;
    };

    self.sizeAll = function () {
        // return size used by entire storage
        //console.warn('DH.storage.sizeAll');
        return JSON.stringify(data).length;
    };

    self.keys = function () {
        // return all keys
        //console.warn('DH.storage.keys');
        return Object.keys(data);
    };

    self.eraseAll = function () {
        // erase entire storage
        //console.warn('DH.storage.eraseAll');
        chrome.storage.local.clear();
    };

    self.debug = function () {
        // return size occupied by each keys and first few bytes of data
        //console.warn('DH.storage.debug');
        return JSON.stringify(data, undefined, 4);
    };

    self.readString = function (aKey, aDefault) {
        // read string
        //console.warn('DH.storage.readString', aKey, aDefault);
        return data.hasOwnProperty(aKey) ? data[aKey] : aDefault;
    };

    self.writeString = function (aKey, aValue, aCallback) {
        // write string
        //console.warn('DH.storage.writeString', aKey, aValue);
        if (aValue === undefined) {
            data[aKey] = '';
        } else {
            data[aKey] = aValue.toString();
        }
        chrome.storage.local.set({data: data}, aCallback);
    };

    self.readBoolean = function (aKey, aDefault) {
        // read true/false, undefined as default, everything else is default with warning
        //console.warn('DH.storage.readBoolean', aKey, aDefault);
        var s = self.readString(aKey, aDefault).toString().toLowerCase();
        if (['1', 'true', 'on', 'enabled'].indexOf(s) >= 0) {
            return true;
        }
        return aDefault;
    };

    self.writeBoolean = function (aKey, aValue, aCallback) {
        // write true/false
        //console.warn('DH.storage.writeBoolean', aKey, aValue);
        self.writeString(aKey, aValue ? 'true' : 'false', aCallback);
    };

    self.readNumber = function (aKey, aDefault) {
        // read number, undefined as default, everything else is default with warning
        //console.warn('DH.storage.readNumber', aKey, aDefault);
        return parseFloat(self.readString(aKey, aDefault));
    };

    self.writeNumber = function (aKey, aValue, aCallback) {
        // write number
        //console.warn('DH.storage.writeNumber', aKey, aValue);
        data[aKey] = aValue.toString();
        chrome.storage.local.set({data: data}, aCallback);
    };

    self.inc = function (aKey, aDefault, aCallback) {
        // read number, increment it, write it back
        //console.warn('DH.storage.inc', aKey, aDefault);
        var i = self.readNumber(aKey, aDefault);
        self.writeNumber(aKey, i + 1, aCallback);
        return i + 1;
    };

    self.readObject = function (aKey, aDefault) {
        // read object, undefined as default, everything else is default with warning
        //console.warn('DH.storage.readObject', aKey, aDefault);
        try {
            return JSON.parse(self.readString(aKey, aDefault) || aDefault);
        } catch (e) {
            //console.warn(e);
            return aDefault;
        }
    };

    self.writeObject = function (aKey, aValue, aCallback) {
        // write object
        //console.warn('DH.storage.writeObject', aKey, aValue);
        self.writeString(aKey, JSON.stringify(aValue), aCallback);
    };

    self.readArray = function (aKey, aDefault) {
        // read array, undefined as default, everything else is default with warning
        //console.warn('DH.storage.readArray', aKey, aDefault);
        try {
            return JSON.parse(self.readString(aKey, aDefault) || aDefault);
        } catch (e) {
            //console.warn(e);
            return aDefault;
        }
    };

    self.writeArray = function (aKey, aValue, aCallback) {
        // write array
        //console.warn('DH.storage.writeArray', aKey, aValue);
        self.writeString(aKey, JSON.stringify(aValue), aCallback);
    };

    self.asyncOnly = function () {
        // return true if storage is async only (packaged chrome apps)
        //console.warn('DH.storage.asyncOnly');
        return false;
    };

    return self;
}());

