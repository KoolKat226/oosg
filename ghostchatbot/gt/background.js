// Background rendering
"use strict";
// globals: document, window, setTimeout, DH

var GT = GT || {};

GT.size = 16;

GT.background = (function () {
    // Background rendering
    var self = {},
        specialTiles = {"drop": 1, "nowalk": 1},   // special tiles are only displayed in debug mode
        canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        lazyRow = 0,
        lazyHeight = 0;

    self.debug = false;
    self.map = "";
    self.frames = 0;
    self.key = '';
    self.autoclear = false;

    function cellDebug(aMap, aX, aY) {
        // Render debug info above cell (event, place, edge tile)
        var s = '', xy = aX + ' ' + aY, e, t, n;
        // event/place indicators
        s += aMap.event.hasOwnProperty(xy) ? 'E' : '';
        s += aMap.place.hasOwnProperty(xy) ? 'P' : '';
        // from edge (e.g. 5=4+1) return name of tile (nw__l_u_)
        e = aMap.edge[aY][aX];
        if (e > 0) {
            n =  "nw_" + (e & 1 ? 'l' : '_') + (e & 2 ? 'r' : '_') + (e & 4 ? 'u' : '_') + (e & 8 ? 'd' : '_');
            t = GT.tiles[n];
            context.drawImage(t.image, t.x, t.y, GT.size, GT.size, aX * GT.size, aY * GT.size, GT.size, GT.size);
        }
        // draw text
        context.fillStyle = 'yellow';
        context.textBaseline = 'top';
        context.fillText(s, aX * GT.size, aY * GT.size);
    }

    self.cell = function (aMap, aX, aY) {
        // Render single cell
        var i, names = aMap.ground[aY][aX], t;
        for (i = 0; i < names.length; i++) {
            if (!self.debug && (specialTiles.hasOwnProperty(names[i]))) {
                continue;
            }
            t = GT.tiles[names[i]];
            if (!t) {
                throw "Unknown tile name " + names[i] + ' at ' + aX + ', ' + aY + ' in ' + aMap.name;
            }
            if (t.image) {
                context.drawImage(t.image, t.x, t.y, GT.size, GT.size, aX * GT.size, aY * GT.size, GT.size, GT.size);
            }
        }
        if (self.debug) {
            cellDebug(aMap, aX, aY);
        }
    };

    self.lazy = function () {
        // Load one row of map outside of the viewport (faster start on mobile)
        if (lazyRow < lazyHeight) {
            var x, map = GT.maps[GT.background.map];
            for (x = 0; x < map.ground[lazyRow].length; x++) {
                self.cell(map, x, lazyRow);
            }
            lazyRow++;
            if (lazyRow === lazyHeight) {
                self.key = '';
            }
        }
    };

    self.load = function (aMap, aViewport) {
        // Render map to canvas (first the viewport, then lazy load the rest of the map)
        var map = typeof aMap === 'string' ? GT.maps[aMap] : aMap,
            x,
            y,
            minx = 0,
            miny = 0,
            maxx = map.width,
            maxy = map.height,
            margin = 5;
        self.map = map.name;
        canvas.width = map.width * GT.size;
        canvas.height = map.height * GT.size;
        context.imageSmoothingEnabled = false;
        GT.canvas.clear();
        // if viewport is not set use viewport from player
        if (!aViewport) {
            aViewport = GT.canvas.customViewport(GT.characters.player.x, GT.characters.player.y);
        }
        // slightly enlarge viewport in case player is moving when map is being loaded
        minx = Math.max(aViewport.x - margin, 0);
        maxx = Math.min(aViewport.x + aViewport.w + margin, map.width);
        miny = Math.max(aViewport.y - margin, 0);
        maxy = Math.min(aViewport.y + aViewport.h + margin, map.height);
        //console.error('viewport', aViewport);
        //console.error('range', {minx: minx, maxx: maxx, miny: miny, maxy: maxy});
        // render viewport
        for (y = miny; y < maxy; y++) {
            for (x = minx; x < maxx; x++) {
                self.cell(map, x, y);
            }
        }
        self.key = '';
        // lazy load rest of the map
        lazyRow = 0;
        lazyHeight = map.height;
        // when new background is loaded create empty edge2 (for character collisions)
        if (GT.characters && GT.characters.occupied) {
            GT.characters.edge2update();
        }
    };

    self.render = function (aCharacter, aCx, aCy) {
        // Render background near character
        GT.canvas.viewport.x = aCharacter.x - aCx;
        GT.canvas.viewport.y = aCharacter.y - aCy;
        var key = self.map + ',' + aCharacter.rx + ',' + aCharacter.ry,
            ix,
            iy;
        // only if needed
        if (self.key !== key) {
            if (self.autoclear) {
                GT.canvas.bgContext.clearRect(0, 0, GT.canvas.w, GT.canvas.h);
            }
            ix = Math.floor(aCharacter.rx * GT.size - aCx * GT.size);
            iy = Math.floor(aCharacter.ry * GT.size - aCy * GT.size);
            GT.canvas.bgContext.drawImage(canvas, ix, iy, GT.canvas.w / GT.canvas.zoom, GT.canvas.h / GT.canvas.zoom, 0, 0, GT.canvas.w, GT.canvas.h);
            self.frames++;
            self.key = key;
        }
    };

    return self;
}());

