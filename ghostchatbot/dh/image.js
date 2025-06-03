// Dynamically loading multiple images (e.g. for canvas rendering) + caching
"use strict";
// globals: Image

var DH = window.DH || {};

DH.imageCache = {};

DH.image = function (aUrl, aCallback) {
    // Load single image, call callaback when image is ready to use
    var img;
    // use cached image
    if (DH.imageCache.hasOwnProperty(aUrl)) {
        img = DH.imageCache[aUrl];
        // image may been requested before but is not yet loaded
        if (aCallback) {
            if (!img.dataLoadedDH) {
                img.addEventListener('load', function () {
                    img.dataLoadedDH = true;
                    aCallback(img);
                });
            } else {
                aCallback(img);
            }
        }
        return img;
    }
    // load new image
    img = new Image();
    img.dataUrlDH = aUrl;
    img.addEventListener('load', function () {
        img.dataLoadedDH = true;
        if (aCallback) {
            aCallback(img);
        }
    });
    img.src = aUrl;
    DH.imageCache[aUrl] = img;
    return img;
};

DH.images = function (aUrls, aCallback) {
    // Load multiple images, call callback once all are ready to use
    var i, img = {}, remaining = aUrls.length;
    function cb(aImage) {
        img[aImage.dataUrlDH] = aImage;
        remaining--;
        if (remaining <= 0) {
            aCallback(img);
        }
    }
    for (i = 0; i < aUrls.length; i++) {
        DH.image(aUrls[i], cb);
    }
};

