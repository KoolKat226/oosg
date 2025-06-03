// Function used only during development (therefore no GT prefix, often used from console)
"use strict";
// globals: GT, DH, Android, window

function purge() {
    // Erase storage and reload app
    DH.storage.eraseAll();
    if (!window.hasOwnProperty('orientation')) {
        DH.console.disable();
    }
    Android.reload();
}

function go(aPlace) {
    // Go to a place (used many times during development)
    // first look on current map
    var m, p, xy;
    try {
        p = GT.places.placeOrNpc(GT.characters.player.map, aPlace);
        if (p) {
            GT.characters.player.teleport(p.map, p.x, p.y);
            return;
        }
        // then on all maps
        for (m in GT.maps) {
            if (GT.maps.hasOwnProperty(m)) {
                p = GT.places.placeOrNpc(m, aPlace);
                if (p) {
                    GT.characters.player.teleport(p.map, p.x, p.y);
                    return;
                }
            }
        }
    } catch (e) {
        console.error(e);
        // then just first place on map
        if (GT.maps.hasOwnProperty(aPlace)) {
            xy = Object.keys(GT.maps[aPlace].place)[0].split(' ');
            GT.characters.player.teleport(aPlace, parseInt(xy[0], 10), parseInt(xy[1], 10));
            return;
        }
    }
}

