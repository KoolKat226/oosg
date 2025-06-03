// Main window
"use strict";
// globals: document, GT, requestAnimationFrame, window, DH, setInterval, setTimeout, Android, espeak

var TE = TE || {};
var BM = BM || {};

TE.stars = DH.storage.readObject('TE.stars', {});

// duplicate tiles for single tile characters
GT.characters.singleTileCharacter('invisible');

TE.onResize = function () {
    // Adjust explosions canvas size
    TE.w = window.innerWidth;
    TE.h = window.innerHeight;
    TE.explosionCanvas.width = window.innerWidth;
    TE.explosionCanvas.height = window.innerHeight;
    TE.explosionCanvas.getContext('2d').imageSmoothingEnabled = false;
};

TE.customLoop = function () {
    // Rendering loop
    TE.customLoopRunning = true;
    GT.render();
    BM.context.clearRect(0, 0, TE.w, TE.h);
    BM.explosions.render();
    requestAnimationFrame(TE.customLoop);
};

TE.undestructable = {
    "grass1": 1,
    "downstairs": 1,
    "upstairs": 1,
    "water": 1,
    "water1": 1,
    "mine": 1,
    "void": 1,
    "mud": 1,
    "shore1": 1,
    "shore2": 1,
    "shore3": 1,
    "shore4": 1,
    "shore5": 1,
    "shore6": 1,
    "shore7": 1,
    "shore8": 1,
    "shore9": 1,
    "cavewall": 1,
    "cavewalldark": 1,
    "shadow1": 1,
    "shadow2": 1,
    "shadow3": 1,
    "shadow3c": 1,
    "shadow4": 1,
    "shadow5": 1,
    "shadown9": 1,
    "road1": 1,
    "road2": 1,
    "road3": 1,
    "road4": 1,
    "road5": 1,
    "road6": 1,
    "road7": 1,
    "road8": 1,
    "road9": 1,
    "road0": 1,
    "road1c": 1,
    "road3c": 1,
    "road7c": 1,
    "road9c": 1,
    "stair1": 1,
    "waterfall": 1,
    "floor3": 1,
    "floor4": 1,
    "nowalk": 1,
    "water2": 1
};

TE.progressive = {
    "grass4": "grass3",
    "grass3": "grass2",
    "grass2": "grass1",
    "pot1": "pot2",
    "pot2": "pot3",
    "pot3": "pot4",
    "chest1": "chest2",
    "chest2": "chest3",
    "chest3": "chest4"
};

TE.base = {
    "basement_ken": "mud",
    "basement_town_hall": "mud",
    "gallery2": "grass1",
    "gallery3": "grass1",
    "ghosttown": "grass1",
    "jail2": "floor3",
    "library": "floor4",
    "quarry": "mud",
    "tomb": "mud"
};

TE.onTouchStartAttack = function (event) {
    TE.attacking = true;
    //event.preventDefault();
    event.cancelBubble = true;
    TE.onAttack();
};

TE.onTouchEndAttack = function (event) {
    TE.attacking = false;
    //event.preventDefault();
    event.cancelBubble = true;
};

TE.onAttack = function () {
    // attack tile in front or under
    if (GT.pause) {
        return;
    }
    if (!GT.editor) {
        return;
    }
    if (Date.now() - TE.attackTime < 200) {
        return;
    }
    if (!TE.player || !TE.player.clip) {
        return;
    }
    TE.attackTime = Date.now();
    GT.effects.attack(TE.player);
    DH.sound.playGroup('knife');
    // detect forward cell coordinates
    //console.log('xy', TE.player.x, TE.player.y, 'r', TE.player.rx, TE.player.ry, 'f', Math.round(TE.player.rx), Math.round(TE.player.ry));
    var i, di, dt, fx = Math.round(TE.player.rx), fy = Math.round(TE.player.ry), g, cx = TE.player.clip.x + 4, cy = TE.player.clip.y + 4, buttons, stars;
    switch (TE.player.dir) {
    case "left":
        fx--;
        cx -= 16 * GT.canvas.zoom;
        break;
    case "right":
        fx++;
        cx += 16 * GT.canvas.zoom;
        break;
    case "up":
        fy--;
        cy -= 16 * GT.canvas.zoom;
        break;
    case "down":
        fy++;
        cy += 16 * GT.canvas.zoom;
        break;
    }
    // not edge
    if (fx < 1 || fy < 1 || fx >= GT.maps[TE.player.map].width - 1 || fy >= GT.maps[TE.player.map].height - 1) {
        return;
    }
    // find topmost destructable
    dt = '';
    di = -1;
    g = GT.maps[TE.player.map].ground[fy][fx];
    for (i = g.length - 1; i >= 0; i--) {
        if (!TE.undestructable.hasOwnProperty(g[i])) {
            di = i;
            dt = g[i];
            break;
        }
    }
    // if nothing in front use current tile
    if (di < 0) {
        fx = Math.round(TE.player.rx);
        fy = Math.round(TE.player.ry);
        cx = TE.player.clip.x + 4;
        cy = TE.player.clip.y + 4;
        g = GT.maps[TE.player.map].ground[fy][fx];
        for (i = g.length - 1; i >= 0; i--) {
            if (!TE.undestructable.hasOwnProperty(g[i])) {
                di = i;
                dt = g[i];
                break;
            }
        }
    }

    //console.log('topmost', g, di, dt);
    // destructable tile found
    if (di >= 0) {
        if (TE.progressive.hasOwnProperty(dt)) {
            // replace progressive
            g[di] = TE.progressive[dt];
        } else {
            // remove it
            // console.log('hit', dt);
            g.splice(di, 1);
            TE.levelTiles++;
            TE.lastTile = dt;
            // check objective
            if (TE.level.hit && TE.level.hit(dt, fx, fy)) {
                GT.background.key = '';
                GT.render();
                GT.pause = true;
                buttons = TE.unlocked ? ['Menu', 'Replay', 'Back to chat'] : ['Back to chat'];
                stars = TE.level.stars();
                GT.stars.add(TE.levelName, stars);
                DH.splash('Level #' + TE.levelIndex + ' completed!', buttons, 'lime', 'You trashed ' + TE.levelTiles + ' items in ' + (GT.timeElapsed / 1000).toFixed(1) + 's. You got ' + '⭐⭐⭐'.substr(0, stars) + ' for your effort.', TE.onSplashButtons, '80vw').bgClickDisable();
                TE.lip.hide();
                DH.metrics.log('win', JSON.stringify({name: TE.levelName, tiles: TE.levelTiles, last: TE.lastTile}), TE.levelIndex, stars, GT.timeElapsed);
                DH.storage.writeNumber('TE.singleLevel', TE.levelIndex + 1);
                if (TE.level.cleanup) {
                    TE.level.cleanup();
                }
            }
        }
        if (g.length === 0) {
            g = [TE.base.hasOwnProperty(TE.player.map) ? TE.base[TE.player.map] : 'grass1'];
        }
        if (DH.sound.sound.hasOwnProperty(dt)) {
            DH.sound.play(dt);
        } else {
            console.log('nosound', dt);
        }
        BM.sprites.add(dt);
        if (!TE.progressive.hasOwnProperty(dt)) {
            BM.explosions.add(dt, cx, cy);
        }
        GT.editor.guessEdge(TE.player.map, fx, fy, true);
        GT.map.change(TE.player.map, fx, fy, g, true);
        GT.background.key = '';
    }
};

TE.onKeyDown = function (event) {
    if (!GT.pause && event.key === 'q') {
        TE.onAttack();
        TE.attacking = true;
    }
};

TE.onKeyUp = function (event) {
    if (!GT.pause && event.key === 'q') {
        TE.attacking = false;
    }
};

TE.init = function (aCallback) {
    // Initialize town
    GT.init(function () {
        // initialize canvas
        GT.canvas.init('background_canvas', 'character_canvas');
        window.addEventListener('resize', TE.landscape);
        GT.canvas.setZoom(2);
        GT.background.autoclear = true;

        // initialize on-screen touchpad
        GT.touchpad = DH.touchpad('icon/arrows160.png', undefined, true);
        GT.touchpad.img.style.zIndex = 10;
        GT.touchpad.img.style.left = '1.5em';
        GT.touchpad.img.style.bottom = '1.5em';
        GT.touchpad.img.style.opacity = 0.7;
        //GT.touchpad.hide();

        // wasd
        GT.keyboard.touchpad = true;

        // hide touchpad on desktop
        if (!Android.isReal()) {
            GT.touchpad.hide();
            GT.touchpad.hide = function () { console.log('GT.touchpad.hide suppressed'); };
            GT.touchpad.show = function () { console.log('GT.touchpad.show suppressed'); };
        }

        if (aCallback) {
            aCallback();
        }
    });
};

TE.startLevel = function (aLevel) {
    // Start specific level
    GT.pause = true;

    TE.levelIndex = parseInt(aLevel.match(/[0-9]+/)[0], 10);
    TE.levelName = aLevel;

    TE.attacking = false;
    TE.levelTiles = 0;
    GT.characters.clear();
    TE.level = TE.levels[aLevel];
    TE.level.init();
    GT.map.restoreOriginal(TE.player.map);
    TE.player.setPlayer();
    TE.player.acceptEvents = false;
    // background
    GT.background.load(TE.player.map);
    GT.background.key = '';
    // rendering loop
    if (!TE.customLoopRunning) {
        TE.customLoop();
    }
    if (TE.level.init2) {
        TE.level.init2();
    }
    DH.splash('Level ' + TE.levelIndex, ['Play'], 'skyblue', TE.level.objective, function () {
        TE.lip = DH.lip(TE.level.time + 's', undefined, TE.level.time);
        TE.lip.close.style.display = 'none';
        GT.timeElapsed = 0;
        GT.timeOld = 0;
        GT.pause = false;
    }, '80vw').bgClickDisable();
};

TE.menu = function () {
    // Show menu with all levels
    GT.levels('Trash everything', 'icon/boy.png', 'icon/girl.png', 'mountains/image/krivan.jpg',
        TE.levels,
        GT.stars.stars,
        TE.startLevel);
};

TE.onSplashButtons = function (aButton) {
    // splash buttons handler
    console.log('TE.onSplashButtons', aButton);
    switch (aButton) {
    case "Back to chat":
        Android.loadUrl('file:///android_asset/android.html');
        return;
    case "Replay":
        TE.startLevel(TE.levelName);
        return;
    case "Menu":
        TE.menu();
        return;
    }
};

// initialize window
window.addEventListener('DOMContentLoaded', function () {
    Android.isReal = function () {
        return true;
    };

    TE.explosionCanvas = document.getElementById('explosion_canvas');
    BM.context = TE.explosionCanvas.getContext('2d');

    window.addEventListener('resize', TE.onResize);
    TE.onResize();

    // sounds
    DH.sound.addGroup('knife', 4, 2);
    //DH.sound.volume(0.3);
    // placeholder sounds
    espeak();

    // attack button
    document.getElementById('attack').ontouchstart = TE.onTouchStartAttack;
    document.getElementById('attack').ontouchend = TE.onTouchEndAttack;
    document.getElementById('attack').onmousedown = TE.onTouchStartAttack;
    document.getElementById('attack').onmouseup = TE.onTouchEndAttack;
    window.addEventListener('keydown', TE.onKeyDown, true);
    window.addEventListener('keyup', TE.onKeyUp, true);

    // single level?
    TE.unlocked = DH.storage.readBoolean('TE.unlocked', false);
    if (TE.unlocked) {
        // menu
        TE.menu();
        TE.init();
    } else {
        // single level
        TE.init(function () {
            TE.singleLevel = DH.storage.readNumber('TE.singleLevel', 1);
            if (!TE.levels.hasOwnProperty('trash' + TE.singleLevel)) {
                TE.singleLevel = 1;
            }
            TE.startLevel('trash' + TE.singleLevel);
        });
    }

    // check level fail
    setInterval(function () {
        if (GT.pause) {
            return;
        }
        if (TE.lip) {
            TE.lip.lip.textContent = Math.ceil(TE.level.time - GT.timeElapsed / 1000) + 's';
        }
        if (TE.level && TE.level.fail && TE.level.fail()) {
            var s, buttons;
            GT.pause = true;
            buttons = TE.unlocked ? ['Menu', 'Replay', 'Back to chat'] : ['Back to chat'];
            s = DH.splash('Mission failed!', buttons, 'pink', null, TE.onSplashButtons, '80vw');
            s.bgClickDisable();
            TE.lip.hide();
            if (TE.level.cleanup) {
                TE.level.cleanup();
            }
            DH.metrics.log('fail', JSON.stringify({name: TE.levelName, tiles: TE.levelTiles, last: TE.lastTile}), TE.levelIndex, 0, GT.timeElapsed);
        }
    }, 500);

    // auto attack
    setInterval(function () {
        if (TE.attacking) {
            TE.onAttack();
        }
    }, 300);

    DH.metrics.init('trash', 201);
    DH.metrics.errorLogger(10);
});

