// Player's inventory
// linter: lint-js2
/*global document, window, DH */

var GT = window.GT || {};

GT.Inventory = function (aInventoryName, aInitialData) {
    // Inventory
    "use strict";
    var self = this;
    aInventoryName = aInventoryName || "Inventory";
    this.items = {};

    this.load = function () {
        // Load items from storage
        if (DH.storage.keyExists("GT.inventory." + aInventoryName)) {
            self.items = DH.storage.readObject("GT.inventory." + aInventoryName, {});
        } else {
            self.items = JSON.parse(JSON.stringify(aInitialData || {}));
        }
        self.items.gold = self.items.gold || 0;
    };
    this.load();

    this.save = function () {
        // Save items to storage
        DH.storage.writeObject("GT.inventory." + aInventoryName, self.items);
    };

    this.add = function (aName, aAmount) {
        // Add to inventory
        if (aAmount === undefined) {
            aAmount = 1;
        }
        DH.type.isString(aName, "aName");
        DH.type.isNumber(aAmount, "aAmount");
        if (!self.items.hasOwnProperty(aName)) {
            self.items[aName] = 0;
        }
        var a = self.items[aName];
        var b;
        self.items[aName] += aAmount;
        b = self.items[aName];
        if (self.items[aName] <= 0) {
            delete self.items[aName];
            b = 0;
        }
        self.save();
        return Math.abs(b - a);
    };

    this.remove = function (aName, aAmount) {
        // Remove from inventory, return amount of items that was successfully removed
        if (aAmount === undefined) {
            aAmount = 1;
        }
        return self.add(aName, -aAmount);
    };

    self.has = function (aName, aAmount) {
        // Return true if inventory has at least amount of item
        if (aAmount === undefined) {
            aAmount = 1;
        }
        DH.type.isString(aName, "aName");
        DH.type.isNumber(aAmount, "aAmount");
        DH.assert(aAmount > 0, "GT.inventory.has(): aAmount must be larger than zero");
        return self.items.hasOwnProperty(aName) && self.items[aName] >= aAmount;
    };

    self.amount = function (aName) {
        // Return amount of items
        DH.type.isString(aName, "aName");
        return self.items.hasOwnProperty(aName)
            ? self.items[aName]
            : 0;
    };

    self.keys = function () {
        // Return names of items in inventory
        return Object.keys(self.items);
    };

    self.debug = function () {
        // return immutable copy
        return {name: aInventoryName, items: JSON.parse(JSON.stringify(self.items))};
    };
};

