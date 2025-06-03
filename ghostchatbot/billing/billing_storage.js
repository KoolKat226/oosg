// BillingStorage is simplified interface to BillingStorageInternal
"use strict";
// globals: window, setInterval, clearInterval, BillingStorageInternal

var BillingStorage = (function () {
    var self = {};
    self.ready = true;

    self.writeString = function (aKey, aValue) {
        // Write string value to storage
        return BillingStorageInternal.internalWriteString(aKey || "", aValue || "");
    };

    self.readString = function (aKey, aValue) {
        // Read string value from storage
        // Following 3 lines allow returning undefined (typeof = undefined)
        if (!self.keyExists(aKey)) {
            return aValue || '';
        }
        return BillingStorageInternal.internalReadString(aKey || "", aValue);
    };

    self.keyExists = function (aKey) {
        // Return true if key exists in storage
        return BillingStorageInternal.internalKeyExists(aKey || "");
    };

    self.keys = function () {
        // Return array of keys
        var s = BillingStorageInternal.internalKeys();
        if (s === '') {
            return [];
        }
        return s.split("\n");
    };

    self.erase = function (aKey) {
        // erase single key
        return BillingStorageInternal.internalErase(aKey || "");
    };

    // Extended API

    self.size = function (aKey) {
        // return size of a key's value in bytes
        var s = self.readString(aKey);
        if (!s) {
            return 0;
        }
        return s.length;
    };

    self.sizeAll = function () {
        // return size used by entire storage
        var size = 0, i, keys = self.keys();
        for (i = 0; i < keys.length; i++) {
            size += self.size(keys[i]);
        }
        return size;
    };

    self.eraseAll = function () {
        // erase entire storage
        var i, keys = self.keys();
        for (i = 0; i < keys.length; i++) {
            self.erase(keys[i]);
        }
    };

    self.debug = function () {
        // return size occupied by each keys and first few bytes of data
        var all = {}, i, keys = self.keys();
        for (i = 0; i < keys.length; i++) {
            all[keys[i]] = self.size(keys[i]) + 'B (' + self.readString(keys[i], '').substr(0, 20) + '...)';
        }
        return JSON.stringify(all, undefined, 4);
    };

    self.readBoolean = function (aKey, aDefault) {
        // read true/false, undefined as default, everything else is default with warning
        //console.warn('BillingStorage.readBoolean', aKey, aDefault);
        var s = self.readString(aKey, aDefault || 'false').toString().toLowerCase();
        if (['1', 'true', 'on', 'enabled'].indexOf(s) >= 0) {
            return true;
        }
        return aDefault || false;
    };

    self.writeBoolean = function (aKey, aValue) {
        // write true/false
        //console.warn('BillingStorage.writeBoolean', aKey, aValue);
        return self.writeString(aKey, aValue ? 'true' : 'false');
    };

    self.readNumber = function (aKey, aDefault) {
        // read number, undefined as default, everything else is default with warning
        //console.warn('BillingStorage.readNumber', aKey, aDefault);
        return parseFloat(self.readString(aKey, aDefault || '0'));
    };

    self.writeNumber = function (aKey, aValue) {
        // write number
        //console.warn('BillingStorage.writeNumber', aKey, aValue);
        return self.writeString(aKey, aValue.toString());
    };

    self.inc = function (aKey, aDefault) {
        // read number, increment it, write it back
        //console.warn('BillingStorage.inc', aKey, aDefault);
        var i = self.readNumber(aKey, aDefault);
        self.writeNumber(aKey, i + 1);
        return i + 1;
    };

    self.readObject = function (aKey, aDefault) {
        // read object, undefined as default, everything else is default with warning
        //console.warn('BillingStorage.readObject', aKey, aDefault);
        aDefault = aDefault || {};
        if (Array.isArray(aDefault)) {
            console.warn('BillingStorage.readObject - default should be object not array');
        }
        if (typeof aDefault !== 'object') {
            console.error('BillingStorage.readObject - default should be object not ' + typeof aDefault);
        }
        try {
            return JSON.parse(self.readString(aKey, JSON.stringify(aDefault)) || aDefault || {});
        } catch (e) {
            //console.warn(e);
            return aDefault || {};
        }
    };

    self.writeObject = function (aKey, aValue) {
        // write object
        //console.warn('BillingStorage.writeObject', aKey, aValue);
        self.writeString(aKey, JSON.stringify(aValue));
    };

    self.readArray = function (aKey, aDefault) {
        // read array, undefined as default, everything else is default with warning
        //console.warn('BillingStorage.readArray', aKey, aDefault);
        aDefault = aDefault || [];
        if (!Array.isArray(aDefault)) {
            console.error('BillingStorage.readArray - default must be array, got ' + aDefault);
            aDefault = [];
        }
        try {
            return JSON.parse(self.readString(aKey, JSON.stringify(aDefault || [])) || aDefault || []);
        } catch (e) {
            //console.warn(e);
            return aDefault || [];
        }
    };

    self.writeArray = function (aKey, aValue) {
        // write array
        //console.warn('BillingStorage.writeArray', aKey, aValue);
        self.writeString(aKey, JSON.stringify(aValue));
    };

    self.asyncOnly = function () {
        // return true if storage is async only (packaged chrome apps)
        return false;
    };

    self.usage = function () {
        // return usage of storage
        return BillingStorageInternal.internalUsage();
    };

    self.cookie = function () {
        // Return random but permanent cookie
        if (self.keyExists('BillingCookie')) {
            return self.readString('BillingCookie', '');
        }
        var s = Math.random().toString() + Math.random().toString() + Math.random().toString() + Math.random().toString();
        s = s.substr(0, 44);
        self.writeString('BillingCookie', s);
        return s;
    };
    self.cookie();

    return self;
}());

