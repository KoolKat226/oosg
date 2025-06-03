// Make all maps transient before they are loaded
"use strict";
// globals: document, window, GT

(function () {
    var m;
    for (m in GT.maps) {
        if (GT.maps.hasOwnProperty(m)) {
            GT.maps[m].transient = true;
        }
    }
}());
