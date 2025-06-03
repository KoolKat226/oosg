// Keyboard touchpad (WASD and arrows on desktop)
"use strict";
// globals: document, window

var GT = GT || {};

GT.keyboard = (function () {
    // Keyboard touchpad
    var self = {};
    self.key = {};
    self.touchpad = true;

    self.onKeyDown = function (event) {
        // Detect key press
        self.key[event.key] = true;
        // touchpad
        if (self.touchpad && GT.touchpad) {
            if (self.key.a || self.key.ArrowLeft) {
                GT.touchpad.x = -1;
                GT.touchpad.angle = Math.atan2(GT.touchpad.y, GT.touchpad.x);
            }
            if (self.key.d || self.key.ArrowRight) {
                GT.touchpad.x = 1;
                GT.touchpad.angle = Math.atan2(GT.touchpad.y, GT.touchpad.x);
            }
            if (self.key.w || self.key.ArrowUp) {
                GT.touchpad.y = -1;
                GT.touchpad.angle = Math.atan2(GT.touchpad.y, GT.touchpad.x);
            }
            if (self.key.s || self.key.ArrowDown) {
                GT.touchpad.y = 1;
                GT.touchpad.angle = Math.atan2(GT.touchpad.y, GT.touchpad.x);
            }
            if (self.key.ArrowLeft || self.key.ArrowRight || self.key.ArrowUp || self.key.ArrowDown) {
                event.preventDefault();
            }
        }
    };

    self.onKeyUp = function (event) {
        // Detect key release
        self.key[event.key] = false;
        // touchpad
        if (self.touchpad && GT.touchpad) {
            if ((event.key === 'a' && !self.key.a) || (event.key === 'ArrowLeft' && !self.key.ArrowLeft)) {
                GT.touchpad.x = 0;
            }
            if ((event.key === 'd' && !self.key.d) || (event.key === 'ArrowRight' && !self.key.ArrowRight)) {
                GT.touchpad.x = 0;
            }
            if ((event.key === 'w' && !self.key.w) || (event.key === 'ArrowUp' && !self.key.ArrowUp)) {
                GT.touchpad.y = 0;
            }
            if ((event.key === 's' && !self.key.s) || (event.key === 'ArrowDown' && !self.key.ArrowDown)) {
                GT.touchpad.y = 0;
            }
            if (GT.touchpad.x !== 0 || GT.touchpad.y !== 0) {
                GT.touchpad.angle = Math.atan2(GT.touchpad.y, GT.touchpad.x);
            }
        }
    };

    window.addEventListener('keydown', self.onKeyDown, true);
    window.addEventListener('keyup', self.onKeyUp, true);

    return self;
}());

