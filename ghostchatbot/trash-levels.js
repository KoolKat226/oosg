// callbacks for testset.html
"use strict";
// globals: document, window, GT, DH

var TE = TE || {};
TE.levels = TE.levels || {};

TE.levels.trash1 = {
    requires: 0,
    objective: "Destroy entire library (including walls) in less than a minute! Use on-screen arrows to move and sword button to trash things.",
    time: 60,
    init: function () {
        // player
        TE.player = GT.character('player', 'library', 5, 3, 'boy');
        // lights
        try {
            GT.canvas.bg.style.transition = 'opacity 1s linear';
            GT.canvas.bg.style.opacity = 1;
        } catch (ignore) {
        }
    },
    init2: function () {
        // close doors
        GT.map.change('library', 5, 7, ["floor4", "bars1"], false);
    },
    hit: function (aTile) {
        if (aTile === 'fireplace7' || aTile === 'torchyellow1' || aTile === 'torchyellow3') {
            GT.canvas.bg.style.opacity -= 0.2;
            if (GT.canvas.bg.style.opacity < 0.2) {
                GT.canvas.bg.style.opacity = 0.2;
            }
        }
        return (TE.levelTiles >= 53) || (GT.maps[GT.background.map].ground.join('').replace(/(void|floor4|\,)/g, '') === '');
    },
    fail: function () {
        return GT.timeElapsed > 60000;
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    },
    cleanup: function () {
        GT.canvas.bg.style.transition = '';
        GT.canvas.bg.style.opacity = 1;
    }
};

TE.levels.trash2 = {
    requires: 0,
    objective: "Destroy 40 crystals in 60s",
    time: 60,
    init: function () {
        GT.tiles.pot1.walkable = false;
        GT.tiles.pot2.walkable = false;
        GT.tiles.pot3.walkable = false;
        GT.tiles.pot4.walkable = false;
        GT.tiles.crystals.walkable = false;
        TE.player = GT.character('player', 'basement_ken_trash', 21, 17, 'boy');
    },
    hit: function (aTile) {
        console.log('hit', aTile);
        if (aTile && aTile.match('torch')) {
            GT.canvas.bg.style.transition = 'opacity 1s linear';
            GT.canvas.bg.style.opacity = 0.2;
        }
        return (TE.levelTiles >= 40) || (!GT.maps[GT.background.map].ground.join('').match(/crystals/g));
    },
    fail: function () {
        return GT.timeElapsed > 60000;
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    },
    cleanup: function () {
        GT.canvas.bg.style.transition = '';
        GT.canvas.bg.style.opacity = 1;
    }
};

TE.levels.trash3 = {
    requires: 0,
    objective: "Break out of prison and destroy it completely in 60s, walls are extra hard!",
    time: 60,
    init: function () {
        TE.player = GT.character('player', 'jail2', 6, 2, 'boy');
    },
    hit: function (aTile, aX, aY) {
        if (aTile.match(/(wall)/) && (Math.random() > 0.5)) {
            GT.maps[TE.player.map].ground[aY][aX].push(aTile);
            GT.map.change(TE.player.map, aX, aY, GT.maps[TE.player.map].ground[aY][aX], true);
        }
        return (!GT.maps[GT.background.map].ground.join('').match(/wall/g));
    },
    fail: function () {
        return GT.timeElapsed > 60000;
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    }
};

TE.levels.trash4 = {
    requires: 0,
    objective: "Cut 60 trees in 60s",
    time: 60,
    init: function () {
        TE.player = GT.character('player', 'forest', 24, 24, 'boy');
        TE.trees = 0;
    },
    hit: function (aTile) {
        if (aTile === 'tree1' || aTile === 'tree2') {
            TE.trees++;
        }
        return TE.trees >= 60;
    },
    fail: function () {
        return GT.timeElapsed > 60000;
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    }
};

TE.nowalk = function (x, y) {
    // make single cell non-walkable
    GT.maps.ghosttown.ground[y][x].push('nowalk');
};

TE.levels.trash5 = {
    requires: 0,
    objective: "Trim all large weeds on cemetery, make sure you don't damage the tomb stones or anything else!",
    time: 60,
    init: function () {
        TE.player = GT.character('player', 'ghosttown', 19, 56, 'boy');
        TE.trees = 0;
        TE.wrongTile = false;
    },
    init2: function () {
        TE.nowalk(4, 54);
        TE.nowalk(4, 56);
        TE.nowalk(4, 57);
        TE.nowalk(5, 58);
        TE.nowalk(7, 59);
        TE.nowalk(8, 59);
        TE.nowalk(9, 59);
        TE.nowalk(14, 60);
        TE.nowalk(15, 60);
        TE.nowalk(16, 60);
        TE.nowalk(17, 60);
    },
    hit: function (aTile) {
        if (aTile !== 'plant') {
            TE.wrongTile = true;
        }
        var x, y, done = true;
        for (x = 5; x <= 17; x++) {
            for (y = 51; y <= 59; y++) {
                if (GT.maps.ghosttown.ground[y][x].indexOf('plant') >= 0) {
                    done = false;
                    break;
                }
            }
        }
        return done;
    },
    fail: function () {
        return (GT.timeElapsed > 60000) || (TE.wrongTile);
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    }
};

TE.levels.trash6 = {
    requires: 0,
    objective: "Trash all books in the library in 20s and nothing else!",
    time: 20,
    init: function () {
        TE.player = GT.character('player', 'library', 5, 3, 'boy');
        TE.books = 0;
        TE.wrongTile = false;
    },
    hit: function (aTile) {
        if (aTile.match('book')) {
            TE.books++;
        } else {
            TE.wrongTile = true;
        }
        return TE.books >= 9;
    },
    fail: function () {
        return (GT.timeElapsed > 20000) || TE.wrongTile;
    },
    stars: function () {
        if (GT.timeElapsed < 10000) {
            return 3;
        }
        if (GT.timeElapsed < 15000) {
            return 2;
        }
        return 1;
    }
};

TE.levels.trash7 = {
    requires: 0,
    objective: "Cut down 30 decidious trees in 60s and nothing else!",
    time: 60,
    init: function () {
        TE.player = GT.character('player', 'forest', 24, 24, 'boy');
        TE.trees = 0;
        TE.wrongTile = false;
    },
    hit: function (aTile) {
        if (aTile === 'tree1') {
            TE.trees++;
        } else {
            TE.wrongTile = true;
        }
        return TE.trees >= 30;
    },
    fail: function () {
        return (GT.timeElapsed > 60000) || TE.wrongTile;
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    }
};

TE.levels.trash8 = {
    requires: 0,
    objective: "Take down every painting and nothing else from the gallery (all 3 floors) in 60s!",
    time: 60,
    init: function () {
        TE.player = GT.character('player', 'ghosttown', 54, 47, 'boy');
        TE.paintings = 0;
        TE.wrongTile = false;
        GT.map.restoreOriginal('gallery2');
        GT.map.restoreOriginal('gallery3');
    },
    init2: function () {
        TE.player.acceptEvents = true;
    },
    hit: function (aTile) {
        if (aTile === 'painting') {
            TE.paintings++;
        } else {
            TE.wrongTile = true;
        }
        return TE.paintings >= 13;
    },
    fail: function () {
        return (GT.timeElapsed > 60000) || TE.wrongTile;
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    }
};

TE.levels.trash9 = {
    requires: 0,
    objective: "Catch 30 fish in 60 seconds, don't cut more that 5 trees and don't cut anything else!",
    time: 60,
    init: function () {
        TE.player = GT.character('player', 'ghosttown', 67, 64, 'boy');
        TE.fish = 0;
        TE.tree = 0;
        TE.wrongTile = 0;
    },
    init2: function () {
        var x, y;
        for (x = 0; x <= 99; x++) {
            for (y = 0; y <= 99; y++) {
                if (GT.maps.ghosttown.ground[y][x].indexOf('water') >= 0
                        && GT.maps.ghosttown.ground[y][x].indexOf('floor2') < 0
                        && GT.maps.ghosttown.ground[y][x].indexOf('rocks') < 0
                        && GT.maps.ghosttown.ground[y][x].indexOf('fish-up') < 0
                        ) {
                    GT.maps.ghosttown.ground[y][x].push('fish-up');
                }
            }
        }
        GT.background.key = '';
    },
    hit: function (aTile) {
        if (aTile === 'fish-up') {
            TE.fish++;
        } else if (aTile.match('tree')) {
            TE.tree++;
        } else {
            TE.wrongTile++;
        }
        return TE.fish >= 30;
    },
    fail: function () {
        return (GT.timeElapsed > 60000) || (TE.wrongTile > 0) || (TE.tree > 5);
    },
    stars: function () {
        if (GT.timeElapsed < 40000) {
            return 3;
        }
        if (GT.timeElapsed < 50000) {
            return 2;
        }
        return 1;
    }
};

TE.levels.trash10 = {
    requires: 0,
    objective: "Destroy every building in town center in less than 300s!",
    time: 300,
    init: function () {
        TE.player = GT.character('player', 'ghosttown', 51, 50, 'boy');
    },
    hit: function () {
        var x, y, done = true, g, i, bad = {wall1: 1, wall2: 1, wall3: 1, wall4: 1, brick1: 1, brick2: 1, brick3: 1, brick4: 1, floor1: 1, floor2: 1, carpet: 1, carpet1: 1, carpet3: 1, carpet7: 1, carpet9: 1};
        // check if town center was cleared of bad tiles
loop1:
        for (x = 37; x <= 60; x++) {
            for (y = 48; y <= 62; y++) {
                g = GT.maps.ghosttown.ground[y][x];
                for (i = 0; i < g.length; i++) {
                    if (bad.hasOwnProperty(g[i])) {
                        done = false;
                        break loop1;
                    }
                }
            }
        }
loop2:
        for (x = 43; x <= 60; x++) {
            for (y = 40; y <= 46; y++) {
                g = GT.maps.ghosttown.ground[y][x];
                for (i = 0; i < g.length; i++) {
                    if (bad.hasOwnProperty(g[i])) {
                        done = false;
                        break loop2;
                    }
                }
            }
        }
        return done;
    },
    fail: function () {
        return (GT.timeElapsed > 300000);
    },
    stars: function () {
        if (GT.timeElapsed < 100000) {
            return 3;
        }
        if (GT.timeElapsed < 200000) {
            return 2;
        }
        return 1;
    }
};

