// Rendering individual tiles from tileset
"use strict";
// globals: document

var GT = GT || {};

GT.tiles = GT.tiles || {};

GT.tile = function (aContext, aNames, aLeft, aTop, aDebug) {
    // Render multiple tiles into single cell
    //console.log('GT.tile', aNames, aLeft, aTop, aDebug);
    var t, i, clip;
    clip = {
        x: aLeft * 16 * GT.canvas.zoom,
        y: aTop * 16 * GT.canvas.zoom,
        w: 16 * GT.canvas.zoom,
        h: 16 * GT.canvas.zoom
    };
    for (i = 0; i < aNames.length; i++) {
        if (!aDebug && (aNames[i] === 'drop')) {
            continue;
        }
        t = GT.tiles[aNames[i]];
        aContext.drawImage(t.image,
            t.x, t.y, 16, 16,
            clip.x, clip.y,
            clip.w, clip.h
            );
    }
    // debug label
    if (aDebug) {
        aContext.fillStyle = 'yellow';
        aContext.textBaseline = 'top';
        aContext.fillText(aDebug, clip.x, clip.y - 10);
    }
    return clip;
};

GT.tileCanvas = function (aParent, aTiles) {
    // Create canvas with stand alone tile, used e.g. in shop
    var canvas, context, oldzoom = GT.canvas.zoom;
    try {
        GT.canvas.zoom = 3;
        canvas = document.createElement('canvas');
        canvas.width = GT.canvas.zoom * 16;
        canvas.height = GT.canvas.zoom * 16;
        canvas.style.width = GT.canvas.zoom * 16 + 'px';
        canvas.style.height = GT.canvas.zoom * 16 + 'px';
        context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        GT.tile(context, aTiles, 0, 0);
        aParent.appendChild(canvas);
        return canvas;
    } finally {
        GT.canvas.zoom = oldzoom;
    }
};

