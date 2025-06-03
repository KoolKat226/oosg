// Show progress meter on the top of window, hides automatically after it reach 100%
// require: none
"use strict";

var DH = window.DH || {};

DH.meter = function (aMax, aOnDone) {
    // Create progress meter
    var self = {};
    self.element = document.createElement('meter');
    self.element.style.display = 'block';
    self.element.style.position = 'fixed';
    self.element.style.left = 0;
    self.element.style.top = 0;
    self.element.style.width = '100vw';
    self.element.style.height = '1cm';
    self.element.value = 0;
    self.element.max = aMax || 100;

    self.update = function (aValue) {
        // update meter to new value
        self.element.value = aValue;
        if (self.element.value >= self.element.max) {
            if (aOnDone) {
                aOnDone();
            }
            if (self.element.parentElement) {
                self.element.parentElement.removeChild(self.element);
            }
        }
    };

    self.inc = function () {
        // increment value by 1
        self.update(self.element.value + 1);
    };

    self.element.addEventListener('click', function () {
        // make meter smaller on click
        self.element.style.height = '0.1cm';
    });

    self.work = function (aCallbacks, aContinue) {
        // call multiple heavy callbacks and show progress
        if (!aContinue) {
            self.element.max = aCallbacks.length;
        }
        var cb = aCallbacks.pop();
        self.inc();
        cb();
        if (aCallbacks.length > 0) {
            requestAnimationFrame(function () {
                self.work(aCallbacks, true);
            });
        }
    };

    document.body.appendChild(self.element);
    return self;
};

