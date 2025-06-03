// Client side random cookie generation and storage
// require: storage3, storage2, type, storage
"use strict";

var DH = window.DH || {};

DH.cookie = function (aCallback) {
    // load cookie from storage or generate new one
    var i, s, r, n;

    if (DH.storage3) {
        DH.type.isFunction(aCallback, 'aCallback');
        DH.storage3.readString('DH_COOKIE', '', function (aValue) {
            if (aValue) {
                // use stored cookie
                aCallback(aValue);
            } else {
                // generate new random cookie
                s = '';
                r = new Uint8Array(32);
                window.crypto.getRandomValues(r);
                for (i = 0; i < r.length; i++) {
                    s += String.fromCharCode(r[i] % 256);
                }
                n = btoa(s);
                // store it
                DH.storage3.writeString('DH_COOKIE', n, aCallback);
            }
        });
        return;
    }

    if (DH.storage2) {
        DH.type.isFunction(aCallback, 'aCallback');
        DH.storage2.read('DH_COOKIE', function (aValue) {
            if (aValue) {
                // use stored cookie
                aCallback(aValue);
            } else {
                // generate new random cookie
                s = '';
                r = new Uint8Array(32);
                window.crypto.getRandomValues(r);
                for (i = 0; i < r.length; i++) {
                    s += String.fromCharCode(r[i] % 256);
                }
                n = btoa(s);
                // store it
                DH.storage2.write('DH_COOKIE', n, aCallback);
            }
        });
        return;
    }

    if (DH.storage) {
        if (DH.storage.keyExists('DH_COOKIE')) {
            n = DH.storage.readString('DH_COOKIE');
        } else {
            // generate new random cookie
            s = '';
            r = new Uint8Array(32);
            window.crypto.getRandomValues(r);
            for (i = 0; i < r.length; i++) {
                s += String.fromCharCode(r[i] % 256);
            }
            n = btoa(s);
            // store it
            DH.storage.writeString('DH_COOKIE', n, aCallback);
        }
        return n;
    }

    if (window.hasOwnProperty('BillingStorage')) {
        if (window.BillingStorage.keyExists('DH_COOKIE')) {
            n = window.BillingStorage.readString('DH_COOKIE');
        } else {
            // generate new random cookie
            s = '';
            r = new Uint8Array(32);
            window.crypto.getRandomValues(r);
            for (i = 0; i < r.length; i++) {
                s += String.fromCharCode(r[i] % 256);
            }
            n = btoa(s);
            // store it
            window.BillingStorage.writeString('DH_COOKIE', n, aCallback);
        }
        return n;
    }
};

