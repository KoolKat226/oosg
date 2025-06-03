// Sprites for BM.explode animations
"use strict";
// globals: document, window, GT

var BM = BM || {};

BM.sprites = (function () {
    var self = {};
    self.sprites = {};

    self.add = function (aTile) {
        if (self.sprites.hasOwnProperty(aTile)) {
            return;
        }
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d'),
            t = GT.tiles[aTile];
        canvas.width = 16;
        canvas.height = 16;
        context.imageSmoothingEnabled = false;
        context.drawImage(t.image,
                t.x, t.y, GT.size, GT.size,
                0,
                0,
                GT.size,
                GT.size
                );
        self.sprites[aTile] = canvas;
    };

    return self;
}());
