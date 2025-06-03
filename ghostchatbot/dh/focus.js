// Focus manager
"use strict";
// require: none

var DH = window.DH || {};

DH.focus = (function () {
    // Manager to keep focus on specified element
    var self = {}, last, stack = [], bound = [], preferred = null;

    function blur(event) {
        if (last && (event.target === last)) {
            last.focus();
        }
    }

    self.pop = function () {
        // Stop focusing element
        if (last) {
            last.removeEventListener('blur', blur);
        }
        last = stack.pop();
    };

    self.push = function (aElementOrId) {
        // Start focusing element
        last = typeof aElementOrId === 'string' ? document.getElementById(aElementOrId) : aElementOrId;
        last.addEventListener('blur', blur);
        last.focus();
        stack.push(last);
    };

    function preventBlurToNoKBElement(event) {
        // if focus is to be lost to element that does not show keyboard, keep focus on blured element
        var r = event.relatedTarget, i;
        // this handle elements that were just disconnected from document
        if (!event.sourceCapabilities) {
            // remove element from bound elements
            for (i = bound.length - 1; i >= 0; i--) {
                if (bound[i] === event.target) {
                    bound.splice(i, 1);
                    continue;
                }
            }
            if (preferred) {
                preferred.focus();
            }
        }
        if (!r) {
            event.target.focus();
            return;
        }
        if (['INPUT', 'TEXTAREA'].indexOf(r.nodeName) >= 0) {
            return;
        }
        event.target.focus();
    }

    self.bind = function (aElementOrId, aPreferred) {
        // bind element to use special blur function which would prevent it from loosing focus to non-keyboard element
        bound.push(aElementOrId);
        var e = typeof aElementOrId === 'string' ? document.getElementById(aElementOrId) : aElementOrId;
        e.addEventListener('blur', preventBlurToNoKBElement);
        if (aPreferred) {
            preferred = e;
        }
    };

    return self;
}());
