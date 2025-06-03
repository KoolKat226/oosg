// Billing simplified interface
"use strict";
// globals: document, window, setInterval, clearInterval, BillingStorage, BillingInternal, DH, setTimeout, Android

if (!BillingStorage) {
    throw 'BillingStorage not available!';
}

var Billing = (function () {
    var self = {},
        billing_init_called = false,
        billing_init_done = false,
        billing_purchase_calling = false,
        billing_consume_calling = false;
    self.version = '6.6.3.0.0.nice';
    self.allowed = []; // list of allowed skus
    self.ready = false; // true when init is finished, to check if available use isAvailable();
    self.errors = 0;
    self.server = '';
    self.errorAsAlert = BillingStorage.readBoolean('Billing.errorAsAlert', self.errorAsAlert);
    self.handled = BillingStorage.readObject('Billing.handled');
    self.toBeAcknowledged = BillingStorage.readObject('Billing.toBeAcknowledged');
    self.cache = BillingStorage.readObject('Billing.cache', {});
    self.exists = BillingStorage.readObject('Billing.exists', {});
    self.serverRequests = 0;
    self.session = 'N' + (9999 * Math.random()).toFixed(0);

    function flattenArguments(aArguments) {
        // Convert array to single string for logging
        var i, a = [], s;
        try {
            for (i = 0; i < aArguments.length; i++) {
                if (aArguments[i] === null) {
                    a.push('null');
                    continue;
                }
                if (aArguments[i] === undefined) {
                    a.push('undefined');
                    continue;
                }
                if (aArguments[i] === 0) {
                    a.push('0');
                    continue;
                }
                if (aArguments[i] === false) {
                    a.push('false');
                    continue;
                }
                s = aArguments[i].toString();
                try {
                    if (Array.isArray(aArguments[i])) {
                        s = '[' + aArguments[i].join('; ') + ']';
                    } else if (typeof aArguments[i] === 'object') {
                        s = JSON.stringify(aArguments[i]);
                    }
                } catch (e) {
                    s += '(' + e + ')';
                }
                a.push(s);
            }
        } catch (e) {
            return aArguments.toString();
        }
        return a.join(', ');
    }

    self.log = function () {
        // Add all arguments to log
        if (!window.hasOwnProperty('BillingInternal') || !window.BillingInternal.hasOwnProperty('internalLog')) {
            throw "Billing.log() called before BillingInternal interface is available, wait for Billing.init(cb) to finish!";
        }
        var s = flattenArguments(arguments);
        if (self.errorAsAlert && s.match(/(error|exception|fail)/i)) {
            alert(s);
        }
        BillingInternal.internalLog(self.session + " " + s);
    };

    self.error = function () {
        // Add all arguments to log
        console.error(arguments);
        self.errors++;
        if (!window.hasOwnProperty('BillingInternal') || !window.BillingInternal.hasOwnProperty('internalError')) {
            throw "Billing.error() called before BillingInternal interface is available, wait for Billing.init(cb) to finish!";
        }
        var s = flattenArguments(arguments);
        if (self.errorAsAlert) {
            alert(s);
        }
        try {
            BillingInternal.internalError(s);
        } catch (ignore) {
        }
        // send error to server directly
        if (self.server) {
            self.serverRequests++;
            DH.json(
                self.server + 'log/',
                {
                    cookie: BillingStorage.cookie(),
                    sku: 'ERROR',
                    data: s + '\n\n' + BillingInternal.internalLogData()
                }
            );
        }
    };

    self.isReal = function () {
        // Return true if this is real phone, not chrome
        if (!self.ready) {
            console.warn("Calling Billing.isReal() before Billing.init() is finished!");
            return;
        }
        if (!window.hasOwnProperty('BillingInternal')) {
            return;
        }
        return BillingInternal.internalIsReal();
    };

    self.isAvailable = function () {
        // Return true if billing is available and fully initialized
        // note: internalIsAvailable is returning java boolean value which will be set to true after first init, but when called from multiple webviews they may not yet been initialized
        // note: maybe internalIsAvailable is not necessary?
        if (!window.hasOwnProperty('BillingInternal')) {
            return false;
        }
        return BillingInternal.internalIsAvailable() && self.ready;
    };

    self.isSuspicious = function () {
        // Return true if has purchases with strange orderId or if suspicious bit was set
        if (BillingStorage.readBoolean('Billing.suspicious', false)) {
            return true;
        }
        var sku, p = self.purchases();
        for (sku in p) {
            if (p.hasOwnProperty(sku)) {
                if (p[sku].orderId.substr(0, 3) !== 'GPA') {
                    return true;
                }
            }
        }
        return false;
    };

    self.isAvailableDialog = function () {
        // Shows dialog about billing not yet ready
        var a = self.isAvailable();
        if (!a) {
            DH.splash('Billing', 'OK', '#ffff77', 'Billing is not yet available, try again later...', null, 'auto', 'auto').bg.style.zIndex = 30;
        }
        return a;
    };

    self.logData = function () {
        // Return billing log as an array of strings
        return BillingInternal.internalLogData().split('\n');
    };

    self.logStore = function (aSku) {
        // Store billing log on server, e.g. after error or even successful purchase
        self.serverRequests++;
        DH.json(
            self.server + 'log/',
            {
                cookie: BillingStorage.cookie(),
                sku: aSku,
                data: self.errors + 'e ' + BillingInternal.internalLogData()
            },
            function (aOk, aResponse) {
                self.errors = 0;
                self.log('log sent', aOk, aResponse);
                BillingInternal.internalLogClear();
            }
        );
    };

    function storeOrderOnServer(aPackageName, aSku, aSkus, aOrderId, aData, aCallbackOkResponse) {
        // Store data on server
        if (!aOrderId) {
            throw "Cannot store, undefined order id";
        }
        self.log('storeOrderOnServer', aSku, aOrderId, aData);
        var place = "a";
        try {
            place = "b";
            if (aOrderId && typeof aOrderId === 'string' && (aOrderId.substr(0, 3) !== 'GPA')) {
                console.warn('Marked order ' + aOrderId + ' as suspicious');
                self.log('Marked order ' + aOrderId + ' as suspicious');
                place = "c";
                BillingStorage.writeBoolean('Billing.suspicious', true);
                place = "d";
            }
            place = "e";
            self.serverRequests++;
            place = "f";
            DH.json(
                self.server + 'store/',
                {
                    version: 1,
                    cookie: BillingStorage.cookie(),
                    order_id: aOrderId,
                    data: JSON.stringify(aData),
                    log: self.logData().join('\n'),
                    package_name: aPackageName,
                    sku: aSku,
                    skus: aSkus.join(',')
                },
                function (aOk, aResponse) {
                    place = "h";
                    BillingInternal.internalLogClear();
                    self.log('storeOrderOnServer finished', aOk, aResponse);
                    if (!aOk) {
                        self.error(aResponse);
                        aCallbackOkResponse(false, aResponse);
                        return;
                    }
                    if (aResponse.code !== 0) {
                        self.log('skus was', aSkus);
                        self.error('storeOrderOnServer response code ' + aResponse.code + ' - ' + aResponse.message);
                        aCallbackOkResponse(false, aResponse);
                        return;
                    }
                    aCallbackOkResponse(true, aResponse);
                }
            );
            place = "g";
        } catch (e) {
            self.error('storeOrderOnServer exception at ' + place + ': ' + e);
        }
    }

    function validateSku(aSku) {
        // Throws exception if aSku is invalid (according to google)
        if (typeof aSku !== 'string') {
            throw "SKU " + aSku + " is not a string but " + typeof aSku;
        }
        if (aSku.trim() === '') {
            throw "Empty SKU!";
        }
        if (aSku.trim() !== aSku) {
            throw "SKU '" + aSku + "' has extra spaces in it!";
        }
        if (!aSku.match(/^[a-z0-9_\.]{1,143}$/)) {
            throw "SKU '" + aSku + "' is invalid (only a-z0-9_. are allowed, max length 143)!";
        }
        if (aSku.match(/^[_\.]+/)) {
            throw "SKU '" + aSku + "' cannot start with _ or .";
        }
        if (self.allowed && self.allowed.length > 0 && self.allowed.indexOf(aSku) < 0) {
            throw "SKU '" + aSku + "' not among allowed purchases: " + self.allowed.join(',');
        }
    }

    self.purchases = function () {
        // Return associative array of purchases
        if (!billing_init_done) {
            throw "Billing init not finished!";
        }
        var t1 = Date.now(),
            json = JSON.parse(BillingInternal.internalPurchases()),
            k,
            changed,
            t2 = Date.now();
        self.log('Listed purchases in ' + (t2 - t1) + 'ms');
        // append cached purchases
        for (k in self.cache) {
            if (self.cache.hasOwnProperty(k)) {
                if (!json.hasOwnProperty(k)) {
                    json[k] = self.cache[k];
                }
            }
        }
        // add missing purchases to exists
        changed = false;
        for (k in json) {
            if (json.hasOwnProperty(k)) {
                if (!self.exists.hasOwnProperty(k)) {
                    self.log('Adding missing sku ' + k + ' to BillingExists');
                    self.exists[k] = 1;
                    changed = true;
                }
            }
        }
        if (changed) {
            BillingStorage.writeObject('Billing.exists', self.exists);
        }
        return json;
    };

    self.forceExists = function (aSku) {
        // Add fake purchase to BillingExists (e.g. as a reward)
        validateSku(aSku);
        self.exists[aSku] = 1;
        BillingStorage.writeObject('Billing.exists', self.exists);
    };

    self.markAsHandled = function (aSku) {
        // Mark SKU as fully handled (i.e. user purchased vb_100_diamonds and you added them to game and shown alert)
        validateSku(aSku);
        var p = self.purchases();
        self.handled[aSku] = p[aSku] || {};
        BillingStorage.writeObject('Billing.handled', self.handled);
        try {
            self.log('Marked ' + aSku + ' as handled, order_id=', p[aSku] && p[aSku].orderId);
        } catch (e) {
            console.error(e);
        }
    };

    function handlePendingAcknowledgements() {
        self.log('handlePendingAcknowledgements', Object.keys(self.toBeAcknowledged).join(', '));
        // acknowledge one by one
        var pending = Object.keys(self.toBeAcknowledged);
        function one() {
            var sku = pending.pop();
            if (!sku) {
                return;
            }
            self.log('Acknowledging pending', sku);
            self.acknowledge(sku, function (aOk, aSku, aCode) {
                self.log('handlePendingAcknowledgements ok', aOk, 'sku', aSku, 'code', aCode);
                if (aOk) {
                    // remove from acknowledged
                    self.log('Removing', aSku, ' from Billing.toBeAcknowledged');
                    delete self.toBeAcknowledged[aSku];
                    BillingStorage.writeObject('Billing.toBeAcknowledged', self.toBeAcknowledged);
                } else {
                    // Could be offline or something
                    self.log('warning: pending purchase acknowledgement aOk=false');
                }
            });
        }
        one();
    }

    function callOnPurchase(aSku) {
        // Call onPurchase and handle result
        if (!self.onPurchase) {
            self.error('Billing.onPurchase undefined in callOnPurchase');
        }
        if (typeof self.onPurchase !== 'function') {
            self.error('Billing.onPurchase is not a function in callOnPurchase');
        }
        try {
            var b = self.onPurchase(aSku);
            // must return true or false
            if (typeof b !== 'boolean') {
                self.error('Billing.onPurchase(' + aSku + ') returned ' + typeof b + ' instead of boolean!');
            }
            // only mark as handled if callback returned true
            if (b === true) {
                self.markAsHandled(aSku);
            }
        } catch (e) {
            self.error('Billing.onPurchase error: ' + e);
        }
    }

    function handlePendingPurchases() {
        // Find unhandled iaps and pass them to onPurchase for final handling
        self.log('handlePendingPurchases');
        if (typeof self.onPurchase !== 'function') {
            throw "self.onPurchase callback must be set before Billing.init()";
        }
        if (!billing_init_done) {
            throw "Billing init not finished!";
        }
        function receiveStoreResponse(aOk, aResponse) {
            self.log('handlePendingPurchases store response ok=' + aOk + ' code=' + (aResponse && aResponse.code) + ' message=' + (aResponse && aResponse.message));
        }
        try {
            var k, iap, iaps, unhandled = {}, r = 0;
            iaps = self.purchases();
            self.log('iaps', iaps);
            self.log('handled', self.handled);
            // go through all iaps and find ones that were non handled yet
            for (k in iaps) {
                if (iaps.hasOwnProperty(k)) {
                    iap = iaps[k];
                    if (self.handled.hasOwnProperty(iap.sku) && self.handled[iap.sku].orderId === iap.orderId) {
                        self.log('already handled iap ' + iap.sku + ' ' + iap.orderId);
                        continue;
                    }
                    self.log('unhandled iap ' + iap.sku + ' ' + iap.orderId, iap);
                    unhandled[k] = JSON.parse(JSON.stringify(iap));
                    r++;
                    // store on server (because order may not been saved, probably wasn't)
                    console.log('calling storeOrderOnServer from hpp!', iap);
                    if (!iap.cached) { // cached have no orderId only sku
                        storeOrderOnServer(iap.packageName, iap.sku, Object.keys(iaps), iap.orderId, self.onStore(), receiveStoreResponse);
                    }
                    // call onPurchase callback
                    callOnPurchase(k);
                }
            }
            self.log('all iaps handled');
            // Call unhandled callback
            handlePendingAcknowledgements();
        } catch (e) {
            self.error('handlePendingPurchases error ' + e);
        }
        return r;
    }
    self.handlePendingPurchases = handlePendingPurchases;

    function store(aSku, aCallbackOkResponse) {
        // Store extra data on server after each purchase (e.g. what clothes, how much currency player have)
        validateSku(aSku);
        if (!self.server) {
            throw "Cannot store data, no server";
        }
        if (typeof self.onStore !== 'function') {
            throw "Billing.onStore is not a function";
        }
        if (aCallbackOkResponse && typeof aCallbackOkResponse !== 'function') {
            throw "Billing store callback is not a function";
        }
        // get data
        var data = self.onStore(), iaps, iap;
        if (typeof data !== 'object') {
            throw "Billing.onStore() did not returned object but " + typeof data;
        }
        if (!data.hasOwnProperty('version')) {
            throw "Cannot store data, no version in data";
        }
        // find iap
        iaps = self.purchases();
        if (!iaps.hasOwnProperty(aSku)) {
            throw "Cannot store data, " + aSku + " not found among purchases " + (typeof iaps);
        }
        self.log('store sku', aSku, 'iaps', iaps);
        iap = iaps[aSku];
        // mark that we are trying to send data
        BillingStorage.writeArray('Billing.store.pendingSkus', Object.keys(iaps));
        BillingStorage.writeString('Billing.store.pendingPackageName', (iap && iap.packageName));
        BillingStorage.writeString('Billing.store.pendingSku', aSku);
        BillingStorage.writeString('Billing.store.pendingOrder', (iap && iap.orderId));
        BillingStorage.writeObject('Billing.store.pendingData', data);
        // send data
        storeOrderOnServer((iap && iap.packageName), aSku, Object.keys(iaps), (iap && iap.orderId), data, function (aOk, aResponse) {
            if (aOk) {
                // mark that order was sent correctly
                BillingStorage.erase('Billing.store.pendingPackageName');
                BillingStorage.erase('Billing.store.pendingSkus');
                BillingStorage.erase('Billing.store.pendingSku');
                BillingStorage.erase('Billing.store.pendingOrder');
                BillingStorage.erase('Billing.store.pendingData');
            }
            if (aCallbackOkResponse) {
                aCallbackOkResponse(aOk, aResponse);
            }
        });
    }

    self.acknowledge = function (aSku, aCallbackOkSkuCode) {
        // Acknowledge purchase (required in 2.2.0 billing client)
        self.log('Billing.acknowledge ' + aSku);
        validateSku(aSku);
        if (!billing_init_done) {
            self.error('Billing.acknowledge() can only be called after Billing.init() is finished!');
            throw "Billing.acknowledge() can only be called after Billing.init() is finished!";
        }
        // set callback
        BillingInternal.internalAcknowledgeCallback = function (aCode) {
            self.log('BillingInternal.internalAcknowledgeCallback code=' + aCode);
            if (aCallbackOkSkuCode) {
                aCallbackOkSkuCode(aCode === 0, aSku, aCode);
            }
        };
        // call
        BillingInternal.internalAcknowledge(aSku);
        return false;
    };

    self.purchase = function (aSku, aExtraCallbackOkSku) {
        // Purchase sku, call onPurchase and aExtraCallbackOkSku with result
        handlePendingPurchases();
        validateSku(aSku);
        if (!billing_init_done) {
            throw "Billing.purchase() can only be called after Billing.init() is finished!";
        }
        if (aExtraCallbackOkSku && (typeof aExtraCallbackOkSku !== 'function')) {
            throw "Billing.purchase(aSku, aExtraCallbackOkSku) - aExtraCallbackOkSku is set but not a function";
        }
        if (billing_purchase_calling) {
            throw "Another Billing.purchase() in progress!";
        }

        // ignore suspicious
        if (self.isSuspicious()) {
            console.warn('purchase(' + aSku + ') ignored because suspicious');
            return;
        }

        // already purchased this sku?
        var p = self.purchases(), spinner;
        if (p.hasOwnProperty(aSku)) {
            self.error('Purchasing SKU that already exists ' + aSku);
            callOnPurchase(aSku);
            if (aExtraCallbackOkSku) {
                aExtraCallbackOkSku(true, aSku);
            }
            return;
        }

        // make purchase
        billing_purchase_calling = false;
        spinner = DH.spinner(10);
        BillingInternal.internalPurchaseCallback = function (aPurchased, aSku2) {
            spinner.hide();
            billing_purchase_calling = false;
            self.log('Billing.internalPurchaseCallback received ' + aPurchased + ' ' + aSku2);
            // this should not happen
            if (aSku !== aSku2) {
                self.error('Purchased ' + aSku + ' but received ' + aPurchased + ' for ' + aSku2);
            }
            // mark as to be acknowledged
            if (aPurchased) {
                self.toBeAcknowledged[aSku2] = true;
                BillingStorage.writeObject('Billing.toBeAcknowledged', self.toBeAcknowledged);
            }
            // onPurchase
            if (aPurchased) {
                callOnPurchase(aSku);
            }
            // store it on server
            if (aPurchased && self.server) {
                store(aSku, function (aOk, aResponse) {
                    self.log('stored ' + aOk + ' ' + JSON.stringify(aResponse));
                });
            } else {
                // store log of canceled purchase
                self.logStore('!' + aSku);
            }
            // add to BillingExists
            if (aPurchased) {
                self.exists[aSku] = 1;
                BillingStorage.writeObject('Billing.exists', self.exists);
            }
            // Auto acknowledge?
            if (aPurchased) {
                self.acknowledge(aSku, function (aOk, aSku3, aCode) {
                    self.log('Auto-acknowledge ok', aOk, 'sku', aSku3, 'code', aCode);
                    if (aOk) {
                        delete self.toBeAcknowledged[aSku3];
                        BillingStorage.writeObject('Billing.toBeAcknowledged', self.toBeAcknowledged);
                        self.log('Auto-acknowledge deleted ' + aSku3);
                    }
                });
            }
            // extra callback (e.g. to disable button)
            if (aExtraCallbackOkSku) {
                aExtraCallbackOkSku(aPurchased, aSku);
            }
        };
        BillingInternal.internalPurchase(aSku);
    };

    function removeSkuFromBuffers(aSku) {
        // Remove sku from various buffers (after consume)
        // cache
        delete self.cache[aSku];
        BillingStorage.writeObject('Billing.cache', self.cache);
        // handled
        delete self.handled[aSku];
        BillingStorage.writeObject('Billing.handled', self.handled);
        // acknowledged
        delete self.toBeAcknowledged[aSku];
        BillingStorage.writeObject('Billing.toBeAcknowledged', self.toBeAcknowledged);
        // exists
        delete self.exists[aSku];
        BillingStorage.writeObject('Billing.exists', self.exists);
    }

    self.consume = function (aSku, aExtraCallbackOkSku, aShowErrorDialog) {
        // Consume sku, call aCallbackOkSku with sku and if it was consumed
        validateSku(aSku);
        if (!billing_init_done) {
            throw "Billing init not finished!";
        }
        if (aExtraCallbackOkSku && (typeof aExtraCallbackOkSku !== 'function')) {
            throw "Billing.consume(aSku, aExtraCallbackOkSku) - aExtraCallbackOkSku is set but not a function";
        }
        if (billing_consume_calling) {
            throw "Another Billing.purchase() in progress!";
        }
        // ignore suspicious (in case detection has false positive, at least paying customer will not consume)
        if (self.isSuspicious()) {
            console.warn('consume(' + aSku + ') ignored because suspicious');
            return;
        }

        // not purchased - consumption will always succeed (with warning)
        var p = self.purchases(), spinner;
        if (!p.hasOwnProperty(aSku)) {
            self.log('warning: Consume will return true on non-owned SKU ' + aSku);
            // callback
            if (self.onConsume) {
                self.onConsume(aSku);
            }
            if (aExtraCallbackOkSku) {
                aExtraCallbackOkSku(true, aSku);
            }
            // remove from buffers
            removeSkuFromBuffers(aSku);
            return;
        }

        // iap was only cached - remove from cache
        if (self.cache.hasOwnProperty(aSku)) {
            self.log('Removing only cached SKU ' + aSku);
            // callback
            if (self.onConsume) {
                self.onConsume(aSku);
            }
            if (aExtraCallbackOkSku) {
                aExtraCallbackOkSku(true, aSku);
            }
            // remove from buffers
            removeSkuFromBuffers(aSku);
            return;
        }

        // real consume
        billing_consume_calling = true;
        spinner = DH.spinner(10);
        BillingInternal.internalConsumeCallback = function (aConsumed, aSku2) {
            spinner.hide();
            billing_consume_calling = false;
            self.log('internalConsumeCallback received ' + aConsumed + ' ' + aSku2);
            // this should not happen
            if (aSku !== aSku2) {
                self.error('Called consume on ' + aSku + ' but received ' + aSku2);
            }
            // error dialog
            if (!aConsumed && aShowErrorDialog) {
                self.log('Consume failed, showing error dialog');
                DH.splash('Billing error', 'OK', 'pink', 'Cannot consume previous purchase, make sure you have Internet connection!', console.log, '80vw', 'auto').bg.style.zIndex = 30;
            }
            // callback
            if (self.onConsume) {
                self.onConsume(aSku);
            }
            if (aExtraCallbackOkSku) {
                aExtraCallbackOkSku(aConsumed, aSku);
            }
            // delete from buffers
            if (aConsumed) {
                removeSkuFromBuffers(aSku);
            }
        };
        BillingInternal.internalConsume(aSku);
    };

    self.consumeAndPurchase = function (aSku, aCallbackOkSku) {
        // Consume sku if needed and purchase another one (e.g. ingame currency)
        // doesn't exist, purchase new
        if (!self.purchaseExists(aSku)) {
            self.purchase(aSku, aCallbackOkSku);
            return;
        }
        // exists, consume it first
        self.consume(aSku, function (aConsumed) {
            if (!aConsumed) {
                //
                self.log('consumeAndPurchase not consumed so not purchasing ' + aSku);
                if (aCallbackOkSku) {
                    aCallbackOkSku(false, aSku);
                }
                return;
            }
            if (!aCallbackOkSku && self.onConsume) {
                self.onConsume(aSku);
            }
            // purchase
            self.purchase(aSku, aCallbackOkSku);
        }, true);
    };

    self.purchaseExists = function (aSku) {
        // Returns true if IAP is purchased
        validateSku(aSku);
        var o, p;

        // first check historic purchases from before 2.2.0
        try {
            if (window.hasOwnProperty('localStorage') && window.localStorage.hasOwnProperty('BillingExists')) {
                o = JSON.parse(window.localStorage.getItem('BillingExists'));
                if (o && (typeof o === 'object') && o.hasOwnProperty(aSku)) {
                    self.log('Using historic BillingExists purchase ' + aSku);
                    return true;
                }
            }
            if (window.hasOwnProperty('localStorage') && window.localStorage.hasOwnProperty('BillingCache')) {
                o = JSON.parse(window.localStorage.getItem('BillingCache'));
                if (o && (typeof o === 'object') && o.hasOwnProperty(aSku)) {
                    self.log('Using historic BillingCache purchase ' + aSku);
                    return true;
                }
            }
        } catch (e) {
            self.error('Billing.purchaseExists historic error ' + e);
        }

        if (!billing_init_done) {
            console.log('Billing.purchaseExists(' + aSku + ') before init, using cache');
            // exists?
            if (self.exists.hasOwnProperty(aSku)) {
                return true;
            }
            // cache?
            if (self.cache.hasOwnProperty(aSku)) {
                return true;
            }
            return false;
        }
        p = self.purchases();
        return p.hasOwnProperty(aSku) || self.cache.hasOwnProperty(aSku) || self.exists.hasOwnProperty(aSku);
    };

    self.purchaseOrderId = function (aSku) {
        // Returns order id of purchase or empty string if it doesn't exists
        validateSku(aSku);
        if (!billing_init_done) {
            throw "BillingInitDone=false when calling purchaseOrderId(" + aSku + ")!";
        }
        var p = self.purchases();
        return p.hasOwnProperty(aSku) ? p[aSku].orderId : '';
    };

    self.restore = function (aOrderId, aCallbackData) {
        // ask server for previously stored data and pass them to callback or onRestore
        self.log('Billing.restore', aOrderId);
        if (!aOrderId) {
            throw "Billing.restore order id undefined";
        }
        if (aCallbackData && typeof aCallbackData !== 'function') {
            throw "Billing.restore callback is not a function";
        }
        self.serverRequests++;
        DH.json(
            self.server + 'restore/',
            {
                cookie: BillingStorage.cookie(),
                order_id: aOrderId
            },
            function (aOk, aResponse) {
                self.log('Billing.restore response', aOk, aResponse);
                var p = self.purchases(), o = {}, i, data, sp;
                if (!aOk || (aResponse.code !== 0)) {
                    console.error(aResponse && aResponse.message);
                    sp = DH.splash('Error', 'Ok', 'pink', (aResponse && aResponse.message) || 'Cannot restore', self.log, '80vw', 'auto');
                    if (sp && sp.bg) {
                        sp.bg.style.zIndex = 30001;
                    }
                    return;
                }
                // clear cache
                BillingStorage.writeObject('Billing.cache', {});
                self.cache = {};
                // find real purchases
                // cache IAPs (only if they are not among real)
                self.log('in restore response purchases are ', Object.keys(p).join(', '));
                self.log('response skus are', aResponse.detail.skus);
                for (i = 0; i < aResponse.detail.skus.length; i++) {
                    // if it is in p (real purchases) no need to cache it
                    if (p.hasOwnProperty(aResponse.detail.skus[i])) {
                        self.log('real purchase will NOT be added to cache', aResponse.detail.skus[i]);
                        continue;
                    }
                    self.log('will be in cache', aResponse.detail.skus[i]);
                    o[aResponse.detail.skus[i]] = {
                        sku: aResponse.detail.skus[i],
                        cached: true
                    };
                }
                BillingStorage.writeObject('Billing.cache', o);
                self.cache = o;
                // parse data
                try {
                    data = JSON.parse(aResponse.detail.data);
                } catch (e) {
                    self.error(e);
                    DH.splash('Cannot restore extra data', 'Ok', 'pink', 'Saved data has invalid format and cannot be restored, try order number from different purchase!', self.log, '80vw', 'auto').bg.style.zIndex = 30;
                    return;
                }
                self.log('data', data);
                // pass data to callback
                try {
                    if (aCallbackData) {
                        aCallbackData(data);
                    } else {
                        self.onRestore(data);
                    }
                } catch (e) {
                    self.error('Restore callback exception: ' + e);
                }
                // reset handled so that they are reapplied again
                BillingStorage.writeObject('Billing.handled', {});
                self.handled = {};
                // handle cached iaps now
                // no longer true comment: no need to call markAsHandled(iap) for non-cached because it was already called at the begining
                //if (aResponse.detail.skus.length > 0) {
                handlePendingPurchases();
                //}
                // store log
                self.logStore('RESTORE ' + aOrderId);
            }
        );
    };

    self.restorePrompt = function (aWhatIsBeingRestored, aCallbackData) {
        // Restore consumables from server using order id (user will receive in email)
        var s, input = document.createElement('input');
        // Ask for order ID
        s = DH.splash('Restore previous purchases', ['Restore', 'Cancel'], 'pink', function (aElement) {
            var p = document.createElement('p');
            // note
            p.innerHTML = 'If you reinstalled your phone (or you have a new phone) and you want to restore <b class="what"></b>, please type in <b>Order number</b> from <b>most recent</b> purchase. It should be in your email.';
            p.getElementsByClassName('what')[0].textContent = aWhatIsBeingRestored;
            aElement.appendChild(p);
            // input
            input.placeholder = 'GPA.XXXX-XXXX-XXXX-XXXXX';
            input.style.display = 'block';
            input.style.width = '100%';
            input.style.boxSizing = 'border-box';
            aElement.appendChild(input);
        }, function (aButton) {
            var dlg, spinner;
            if (aButton === 'Restore') {
                if (!input.value) {
                    return;
                }
                if (input.value.length < 5) {
                    dlg = DH.splash('Invalid order id', 'OK', 'pink', 'Value "' + input.value + '" doesn\'t look like valid order id. It should start with GPA and have a bunch of numbers. Please type it exactly as it was in the email.');
                    dlg.bg.style.zIndex = 30001;
                    return;
                }
                spinner = DH.spinner(10);
                try {
                    self.restore(input.value, aCallbackData);
                } finally {
                    spinner.hide();
                }
            }
        }, '80vw', 'auto');
        s.bg.style.zIndex = 30000;
        s.bgClickDisable();
    };

    self.init = function (aCallbackOk) {
        // Wait for interface to be ready, then run aCallbackOk with true/false param
        console.log('Billing.init ' + self.server);
        var t0 = Date.now(), t = 0, ival, i, s = '';
        // check missing dependencies
        if (!BillingStorage) {
            throw "Billing is missing BillingStorage dependency";
        }
        if (!DH) {
            throw "Billing is missing DH dependency";
        }
        if (!DH.json) {
            throw "Billing is missing DH.json dependency";
        }
        if (typeof BillingStorage.cookie !== 'function') {
            throw "BillingStorage.cookie() is not a function";
        }
        if (!DH.spinner) {
            s = typeof window.DH;
            if (s === 'object') {
                s = s + ' ' + Object.keys(window.DH).join(',');
            }
            throw "Billing is missing DH.spinner dependency - " + DH.spinnerError + ' (' + s + ')';
        }
        if (!DH.splash) {
            throw "Billing is missing DH.splash dependency";
        }
        if (!DH.options2) {
            console.warn("Billing is missing DH.options2 dependency");
        }
        if (!DH.console) {
            console.warn("Billing is missing DH.console dependency");
        }
        // check allowed skus
        if (!Array.isArray(self.allowed)) {
            throw "Billing.allowed must be array of allowed products";
        }
        if (self.allowed.length === 0) {
            throw "Billing.allowed must be array of allowed products";
        }
        for (i = 0; i < self.allowed.length; i++) {
            validateSku(self.allowed[i]);
        }
        // check server url
        if (self.server !== undefined) {
            if (!self.server.match(/^http/)) {
                console.warn("Temporarily allowing http billing server");
                //throw "Billing server should start with http or be undefined!";
            }
            if (self.server.substr(-1) !== '/') {
                throw "Billing server should end with /";
            }
        }
        // check pre-init setup
        if (typeof self.onPurchase !== 'function') {
            throw "Billing.onPurchase callback must be set before Billing.init()";
        }
        if (self.server && (typeof self.onStore !== 'function')) {
            throw "Billing.onStore callback must be function and defined before Billing.init()";
        }
        if (self.server && (typeof self.onRestore !== 'function')) {
            throw "Billing.onRestore callback must be function and defined before Billing.init()";
        }
        if (aCallbackOk && (typeof aCallbackOk !== 'function')) {
            throw "Billing.init(aServer, aCallbackOk) - aCallbackOk is not a function";
        }

        // Make sure init is called only once
        if (billing_init_called) {
            throw "Billing.init can only be called once!";
        }
        billing_init_called = true;

        // Wait for BillingInternal java interface
        console.log('Waiting for BillingInternal interface...');
        ival = setInterval(function () {
            if (window.hasOwnProperty('BillingInternal') && window.BillingInternal.hasOwnProperty('internalLog')) {
                self.log('Billing ' + self.version + ' storage ' + BillingStorage.usage());
                self.log('BillingInternal interface available in ' + (Date.now() - t0) + 'ms');
                clearInterval(ival);
                // Set internal init callback
                BillingInternal.internalInitCallback = function (aPlace) {
                    self.ready = BillingInternal.internalIsAvailable();
                    self.log('BillingInternal.internalInitCallback(place=' + aPlace + ') called, internalIsAvailable=', self.ready);
                    billing_init_called = false;
                    billing_init_done = true;
                    handlePendingPurchases();
                    if (aCallbackOk) {
                        aCallbackOk(self.ready);
                    }
                };
                // Call internal init
                try {
                    self.log('Calling BillingInternal.internalInit()');
                    self.log('typeof BillingInternal = ', typeof BillingInternal);
                    self.log('typeof BillingInternal.internalInitCallback = ', BillingInternal && (typeof BillingInternal.internalInitCallback));
                    BillingInternal.internalInit();
                } catch (e) {
                    self.error('BillingInternal.internalInit() exception ' + e);
                }
                // if previous store failed, send it now
                if (BillingStorage.keyExists('Billing.store.pendingOrder')) {
                    var package_name = BillingStorage.readString('Billing.store.pendingPackageName', ''),
                        skus = BillingStorage.readArray('Billing.store.pendingSkus', []),
                        sku = BillingStorage.readString('Billing.store.pendingSku', ''),
                        order = BillingStorage.readString('Billing.store.pendingOrder', ''),
                        data = BillingStorage.readObject('Billing.store.pendingData', {});
                    // send it again
                    self.log('init resends store sku', sku, 'skus', skus, 'order', order, 'data', data, 'package_name', package_name);
                    storeOrderOnServer(package_name, sku, skus, order, data, function (aOk) {
                        if (aOk) {
                            BillingStorage.erase('Billing.store.pendingPackageName');
                            BillingStorage.erase('Billing.store.pendingSkus');
                            BillingStorage.erase('Billing.store.pendingSku');
                            BillingStorage.erase('Billing.store.pendingOrder');
                            BillingStorage.erase('Billing.store.pendingData');
                        }
                    });
                }
                return;
            }
            // still not ready
            t += 50;
            if (t > 5000) {
                console.error('BillingInternal interface not available within 5s');
                clearInterval(ival);
                self.ready = true;
                aCallbackOk(false);
                return;
            }
        }, 50);
    };

    self.test = function () {
        // Show dialog where you can test all purchases and all API calls
        var i;
        for (i = 0; i < self.allowed.length; i++) {
            validateSku(self.allowed[i]);
        }
        function alert(aMessage) {
            // Non-blocking alert so that I can test fast click on purchase
            setTimeout(function () {
                var s = DH.splash('Result', ['Ok', 'Ok'], 'white', flattenArguments([aMessage]), null, '95vw', 'auto');
                s.bg.style.zIndex = 1000;
                s.buttonsArray[1].hidden = true; // splash with 2 buttons will not hide on click so that it can be copied
                s.content.style.whiteSpace = 'pre';
                s.content.style.maxHeight = '80vh';
                s.content.style.overflowY = 'scroll';
            }, 500);
        }
        DH.options2(function (aOptions, aBg) {
            aBg.style.zIndex = 999;
            aBg.style.lineHeight = '100%';
            aBg.style.backgroundColor = '#9ef5b6';
            aBg.style.fontFamily = 'sans-serif';
            aOptions.h1('Billing test');
            var log, data, order, sku = '';
            aOptions.buttons('Action', ['isAvailable', 'isReal', 'purchases', 'handlePendingPurchases'], function (event) {
                try {
                    var p;
                    self.log(event.target.textContent, sku);
                    switch (event.target.textContent) {
                    case "isAvailable":
                        alert(self.isAvailable());
                        break;
                    case "isReal":
                        alert(self.isReal());
                        break;
                    case "purchases":
                        p = self.purchases();
                        alert(Object.keys(p).join(', ') + '\n\n' + JSON.stringify(p, undefined, 4));
                        break;
                    case "handlePendingPurchases":
                        alert(handlePendingPurchases());
                        break;
                    }
                } catch (e) {
                    alert('Exception: ' + e);
                }
            });
            aOptions.h2('Purchase and consume');
            aOptions.select('SKU', '', self.allowed, function (aValue) {
                sku = aValue;
            });
            aOptions.buttons('Action', ['purchase(p,alert)', 'purchase(p,-)', 'consume', 'purchaseExists', 'consumeAndPurchase', 'markAsHandled', 'purchaseOrderId(p)', 'acknowledge(p,alert)'], function (event) {
                try {
                    self.log(event.target.textContent, sku);
                    switch (event.target.textContent) {
                    case "purchase(p,alert)":
                        self.purchase(sku, function (aOk, aName) {
                            alert(aOk + ' ' + aName);
                        });
                        break;
                    case "purchase(p,-)":
                        self.purchase(sku);
                        break;
                    case "acknowledge(p,alert)":
                        self.acknowledge(sku, function (aOk, aSku, aCode) {
                            alert('ok=' + aOk + ' sku=' + aSku + ' code=' + aCode);
                        });
                        break;
                    case "consume":
                        self.consume(sku, function (aOk, aName) {
                            alert(aOk + ' ' + aName);
                        });
                        break;
                    case "consumeAndPurchase":
                        self.consumeAndPurchase(sku, function (aOk, aName) {
                            alert(aOk + ' ' + aName);
                        });
                        break;
                    case "purchaseExists":
                        alert(sku + ' ' + self.purchaseExists(sku));
                        break;
                    case "markAsHandled":
                        alert(self.markAsHandled(sku));
                        break;
                    case "purchaseOrderId(p)":
                        alert(self.purchaseOrderId(sku));
                        break;
                    }
                } catch (e) {
                    alert('Exception: ' + e);
                }
            });
            aOptions.h2('Store and restore');
            order = aOptions.text('OrderId', '');
            order.placeholder = 'GPA.XXXX-XXXX-XXXX-XXXXX';
            data = aOptions.text('Data', '');
            aOptions.buttons('Action', ['store', 'restore', 'restorePrompt', 'onStore', 'get orderId from sku'], function (event) {
                try {
                    var p;
                    switch (event.target.textContent) {
                    case "store":
                        store(sku, function (aOk, aResponse) {
                            alert(aOk + ' ' + JSON.stringify(aResponse, undefined, 4));
                        });
                        break;
                    case "restore":
                        self.restore(order.value, function (aData) {
                            alert(JSON.stringify(aData, undefined, 4));
                        });
                        break;
                    case "restorePrompt":
                        self.restorePrompt('diamonds and stuff', function (aData) {
                            alert(JSON.stringify(aData, undefined, 4));
                        });
                        break;
                    case "onStore":
                        data.value = JSON.stringify(self.onStore());
                        break;
                    case "get orderId from sku":
                        p = self.purchases();
                        order.value = p[sku].orderId;
                        break;
                    }
                } catch (e) {
                    alert('Exception: ' + e);
                }
            });
            aOptions.h2('Debugging');
            log = aOptions.text('Log', '');
            aOptions.buttons('', ['log', 'logData', 'logStore', "console", "purge", "storage", "errorAsAlert=1", "errorAsAlert=0", "internalLogClear", "usage"], function (event) {
                try {
                    switch (event.target.textContent) {
                    case "log":
                        self.log(log.value);
                        log.value = '';
                        break;
                    case "usage":
                        alert(BillingStorage.usage());
                        break;
                    case "logData":
                        alert(self.logData().join('\n'));
                        break;
                    case "logStore":
                        alert(self.logStore('test'));
                        break;
                    case "console":
                        DH.console.show(true).style.zIndex = 1002;
                        break;
                    case "purge":
                        if (confirm('Erase BillingStorage and restart?')) {
                            var b = BillingStorage.readBoolean('Billing.errorAsAlert');
                            BillingStorage.eraseAll();
                            BillingStorage.writeBoolean('Billing.errorAsAlert', b);
                            document.location.reload();
                            if (window.Android && !Android.isReal()) {
                                DH.console.disable();
                            }
                        }
                        break;
                    case "storage":
                        alert(BillingStorage.debug());
                        break;
                    case "errorAsAlert=1":
                        BillingStorage.writeBoolean('Billing.errorAsAlert', true);
                        self.errorAsAlert = true;
                        break;
                    case "errorAsAlert=0":
                        BillingStorage.writeBoolean('Billing.errorAsAlert', false);
                        self.errorAsAlert = false;
                        break;
                    case "internalLogClear":
                        BillingInternal.internalLogClear();
                        break;
                    }
                } catch (e) {
                    alert('Exception: ' + e);
                }
            });
            aOptions.saveCancel(console.log, console.log);
            window.a = aOptions;
            window.bg = aBg;
        });
    };
    return self;
}());



