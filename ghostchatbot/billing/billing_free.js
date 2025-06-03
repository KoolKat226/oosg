// Billing free (until they fix Android billing library 5.0)
"use strict";
// globals: document, window

var Billing = (function () {
    var self = {};
    self.exists = {}; // use Billing.exists['vb_options'] = 1;
    self.version = '5.0.0.free';
    self.ready = true;

    self.log = function () {
        return;
    };

    self.error = function () {
        return;
    };

    self.isReal = function () {
        return false;
    };

    self.isAvailable = function () {
        return true;
    };

    self.isSuspicious = function () {
        return false;
    };

    self.isAvailableDialog = function () {
        // Shows dialog about billing not yet ready
        return self.isAvailable();
    };

    self.logData = function () {
        return;
    };

    self.logStore = function () {
        return;
    };

    self.purchases = function (aCallback) {
        if (aCallback) {
            aCallback({});
        }
    };

    self.forceExists = function (aSku) {
        // Add fake purchase to BillingExists (e.g. as a reward)
        self.exists[aSku] = 1;
    };

    self.markAsHandled = function () {
        return;
    };

    self.handlePendingPurchases = function () {
        return;
    };

    self.acknowledge = function (aSku, aCallbackOkSkuCode) {
        aCallbackOkSkuCode(true, aSku, 0); // aCode
        return true;
    };

    self.purchase = function (aSku, aExtraCallbackOkSku) {
        alert('As a special promotional offer, all products are FREE this month. Don\'t forget to tell your friends!');
        if (aExtraCallbackOkSku) {
            aExtraCallbackOkSku(true, aSku);
        } else {
            self.onPurchase(aSku);
        }
    };

    self.consume = function (aSku, aExtraCallbackOkSku) {
        // Consume sku, call aCallbackOkSku with sku and if it was consumed
        if (self.onConsume) {
            self.onConsume(aSku);
        }
        if (aExtraCallbackOkSku) {
            aExtraCallbackOkSku(true, aSku);
        }
    };

    self.consumeAndPurchase = function (aSku, aCallbackOkSku) {
        // Consume sku if needed and purchase another one (e.g. ingame currency)
        // exists, consume it first
        self.consume(aSku, function () {
            if (aCallbackOkSku) {
                aCallbackOkSku(false, aSku);
            }
            if (!aCallbackOkSku && self.onConsume) {
                self.onConsume(aSku);
            }
            // purchase
            self.purchase(aSku, aCallbackOkSku);
        }, true);
    };

    self.purchaseExists = function () {
        // Returns true if IAP is purchased
        return true;
    };

    self.purchaseOrderId = function () {
        // Returns order id of purchase or empty string if it doesn't exists
        return 'GPA-123456789';
    };

    self.restore = function (aOrderId, aCallbackData) {
        aCallbackData(aOrderId);
        return;
    };

    self.restorePrompt = function () {
        // Restore consumables from server using order id (user will receive in email)
        alert('As a special promotional offer, all products are FREE this month. Don\'t forget to tell your friends!');
    };

    self.init = function (aCallbackOk) {
        // Wait for interface to be ready, then run aCallbackOk with true/false param
        aCallbackOk(true);
    };

    self.test = function () {
        return;
    };

    return self;
}());




