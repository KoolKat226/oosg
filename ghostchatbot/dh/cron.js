// Executing piece of code once in a defined interval (callback must return true to be considered complete)
// require: storage, date
"use strict";

var DH = window.DH || {};

DH.cron = (function () {
    // Executing piece of code once in a defined interval
    var self = {};

    function run(aCallback, aKey, aCurrentValue) {
        // if stored value changed run callback and save new value
        var old = DH.storage.readString(aKey, ''), r;
        if (old.toString() !== aCurrentValue.toString()) {
            try {
                r = aCallback(old);
            } catch (e) {
                console.error('cron job', aKey, 'failed', e);
                return false;
            }
            if (typeof r !== 'boolean') {
                console.warn('Cron job should return boolean, but returned', typeof r, r);
            }
            if (r) {
                DH.storage.writeString(aKey, aCurrentValue.toString());
            }
            return r;
        }
    }

    self.once = function (aCallback) {
        // execute callback only once
        return run(aCallback, 'DH.cron.once', '1');
    };

    self.hourly = function (aCallback) {
        // execute callback only once an hour
        var d = new Date();
        return run(aCallback, 'DH.cron.hourly', DH.date.yyyymmdd(d) + '--' + d.getHours());
    };

    self.daily = function (aCallback) {
        // execute callback only once a day
        return run(aCallback, 'DH.cron.daily', DH.date.yyyymmdd());
    };

    self.monthly = function (aCallback) {
        // execute callback only once a month
        return run(aCallback, 'DH.cron.monthly', DH.date.yyyymm());
    };

    self.yearly = function (aCallback) {
        // execute callback only once a year
        return run(aCallback, 'DH.cron.yearly', DH.date.yyyy());
    };

    // set options defaults
    return self;
}());
