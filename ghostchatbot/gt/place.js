// Places on all maps
"use strict";
// globals: document, window

var GT = GT || {};

GT.places = (function () {
    // Places on all maps
    var self = {}, m;
    self.byCoords = {};
    self.byName = {};

    self.update = function (aMap) {
        // Add map to cache
        var xy, x, y;
        for (xy in aMap.place) {
            if (aMap.place.hasOwnProperty(xy)) {
                x = parseInt(xy.split(' ')[0], 10);
                y = parseInt(xy.split(' ')[1], 10);
                // map x y
                self.byCoords[aMap.name + ' ' + xy] = {
                    map: aMap.name,
                    x: x,
                    y: y,
                    place: aMap.place[xy]
                };
                // map place
                self.byName[aMap.name + ' ' + aMap.place[xy]] = {
                    map: aMap.name,
                    x: x,
                    y: y,
                    place: aMap.place[xy]
                };
            }
        }
    };

    for (m in GT.maps) {
        if (GT.maps.hasOwnProperty(m)) {
            self.update(GT.maps[m]);
        }
    }

    self.placeOrNpc = function (aMap, aPlaceOrNpc) {
        // Return place, if there is no such place try npc by the same name
        var p = self.byName[aMap + ' ' + aPlaceOrNpc];
        if (!p) {
            p = GT.maps[aMap].npc[aPlaceOrNpc];
        }
        return p;
    };

    self.anyPlaceOrNpc = function (aPlaceOrNpc) {
        // Find any place or npc anywhere
        // place on current map
        var k, s, o, p = self.byName[GT.background.map + ' ' + aPlaceOrNpc];
        if (p) {
            return p;
        }
        // npc on current map
        p = GT.maps[GT.background.map].npc && GT.maps[GT.background.map].npc[aPlaceOrNpc];
        if (p) {
            o = JSON.parse(JSON.stringify(p));
            o.map = o.map || GT.background.map;
            return o;
        }
        // place on any map
        for (k in GT.maps) {
            if (GT.maps.hasOwnProperty(k)) {
                p = self.byName[k + ' ' + aPlaceOrNpc];
                if (p) {
                    return p;
                }
            }
        }
        // npc on any map
        for (k in GT.maps) {
            if (GT.maps.hasOwnProperty(k)) {
                if (GT.maps[k].npc) {
                    p = GT.maps[k].npc[aPlaceOrNpc];
                    if (p) {
                        o = JSON.parse(JSON.stringify(p));
                        o.map = o.map || k;
                        return o;
                    }
                }
            }
        }
        // first place on map name
        if (GT.maps.hasOwnProperty(aPlaceOrNpc)) {
            k = GT.maps[aPlaceOrNpc].place;
            p = Object.keys(k);
            s = k[p[0]];
            p = p[0].split(' ');
            return {map: aPlaceOrNpc, x: parseInt(p[0], 10), y: parseInt(p[1], 10), place: s};
        }
    };

    return self;
}());

