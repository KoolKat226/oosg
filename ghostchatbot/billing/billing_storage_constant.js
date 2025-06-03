// BillingStorageInternal with constant size in localStorage
"use strict";
// globals: window, setTimeout, localStorage

/*
Features
- Write will never fail because of constant size
- It is immediately available (unlike java/js interfaces)
*/

var BillingStorageInternal = (function () {
    var self = {},
        size = 30000,
        usage = 0,
        buffer = new Array(size + 1),
        items = {};
    buffer = buffer.join('-');

    function encode(aObject) {
        // convert object to json of fixed size: "{items}------"
        var s = JSON.stringify(aObject);
        if (s.length > usage) {
            usage = s.length;
            localStorage.setItem('BillingStorageInternalUsage', (usage + '          ').substr(0, 10));
        }
        usage = Math.max(usage, s.length);
        if (s.length > size) {
            throw "BillingStorageInternal maximal storage size " + size + " exceeded!";
        }
        return (s + buffer).substr(0, size);
    }

    function decode(aString) {
        // return fixed size json '{"foo":123}----' to object {foo:123}
        if (!aString) {
            return {};
        }
        var s = aString.replace(/[\-]+$/, '');
        return JSON.parse(s);
    }

    // Allocate space on first run
    if (!localStorage.hasOwnProperty('BillingStorageInternal')) {
        localStorage.setItem('BillingStorageInternal', encode(items));
    }
    if (!localStorage.hasOwnProperty('BillingStorageInternalUsage')) {
        localStorage.setItem('BillingStorageInternalUsage', (usage + '          ').substr(0, 10));
    }

    // Load old items
    items = decode(localStorage.getItem('BillingStorageInternal'));
    self.debug = items;
    usage = parseInt(localStorage.getItem('BillingStorageInternalUsage').toString().trim() || '0', 10);
    console.log('BillingStorage ' + Math.round(100 * usage / size) + '% (' + usage + '/' + size + ')');

    self.internalWriteString = function (aKey, aValue) {
        // Write one string
        if (arguments.length !== 2) {
            throw "BillingStorageInternal.internalWriteString(aKey, aValue) - requires exactly 2 arguments";
        }
        if (typeof aKey !== 'string') {
            throw "BillingStorageInternal.internalWriteString(aKey, aValue) - key must be string!";
        }
        if (typeof aValue !== 'string') {
            throw "BillingStorageInternal.internalWriteString(aKey, aValue) - value must be string!";
        }
        items[aKey] = aValue;
        localStorage.setItem('BillingStorageInternal', encode(items));
    };

    self.internalReadString = function (aKey, aDefault) {
        // Read one string
        /*
        if (arguments.length !== 2) {
            throw "BillingStorageInternal.internalReadString(aKey, aDefault) - requires exactly 2 arguments";
        }
        */
        if (typeof aKey !== 'string') {
            throw "BillingStorageInternal.internalReadString(aKey, aDefault) - key must be string!";
        }
        if (!items.hasOwnProperty(aKey)) {
            return aDefault || '';
        }
        return items[aKey];
    };

    self.internalKeyExists = function (aKey) {
        // Return true if key exists
        if (arguments.length !== 1) {
            throw "BillingStorageInternal.internalKeyExists(aKey) - requires exactly 1 argument";
        }
        if (typeof aKey !== 'string') {
            throw "BillingStorageInternal.internalKeyExists(aKey) - key must be string!";
        }
        return items.hasOwnProperty(aKey);
    };

    self.internalKeys = function () {
        // Return EOL separated list of keys
        if (arguments.length !== 0) {
            throw "BillingStorageInternal.internalKeys() requires exactly 0 arguments";
        }
        return Object.keys(items).join('\n');
    };

    self.internalErase = function (aKey) {
        // Erase single key
        if (arguments.length !== 1) {
            throw "BillingStorageInternal.internalErase(aKey) requires exactly 1 argument";
        }
        if (typeof aKey !== 'string') {
            throw "BillingStorageInternal.internalErase(aKey, aValue) - key must be string!";
        }
        delete items[aKey];
        localStorage.setItem('BillingStorageInternal', encode(items));
    };

    self.internalUsage = function () {
        // Return usage
        return usage;
    };

    return self;
}());

