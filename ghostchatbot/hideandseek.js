// Main window
"use strict";
// globals: document, GT, requestAnimationFrame, window, DH, setInterval, setTimeout, Android

var HS = HS || {};

HS.map = 'forest';

// duplicate tiles for single tile characters
GT.characters.singleTileCharacter('invisible');

HS.landscape = function () {
    if (window.innerWidth > window.innerHeight) {
        document.getElementById('fog').style.backgroundImage = 'url(image/fog-landscape.png)';
        GT.canvas.setZoom(window.innerWidth / 23 / GT.size);
    } else {
        document.getElementById('fog').style.backgroundImage = 'url(image/fog-dir.png)';
        GT.canvas.setZoom(window.innerWidth / 13 / GT.size);
    }
};

HS.placeGhost = function () {
    // Randomly place ghost
    var n = 0, d = 1, x, y, r = Math.hypot(GT.maps[GT.background.map].width / 2, GT.maps[GT.background.map].height / 2), tiles;
    while (d < 0.5 * r) {
        x = 1 + Math.floor((GT.maps[GT.background.map].width - 2) * Math.random());
        y = 1 + Math.floor((GT.maps[GT.background.map].height - 2) * Math.random());
        d = HS.player.distanceTo(x, y);
        console.log('x', x, 'y', y, 'd', d, 'r', r, 'n', n);
        n++;
        if (n > 10) {
            break;
        }
    }
    // x = 7; y = 4;
    HS.ghost.teleport('forest', x, y);
    // do not place ghost on tree
    function center() {
        // move ghost towards center
        if (HS.ghost.x <= GT.maps[HS.map].width / 2) {
            HS.ghost.teleport(HS.map, HS.ghost.x + 1, HS.ghost.y, 'down');
        }
        if (HS.ghost.x > GT.maps[HS.map].width / 2) {
            HS.ghost.teleport(HS.map, HS.ghost.x - 1, HS.ghost.y, 'down');
        }
        if (HS.ghost.y <= GT.maps[HS.map].height / 2) {
            HS.ghost.teleport(HS.map, HS.ghost.x, HS.ghost.y + 1, 'down');
        }
        if (HS.ghost.y > GT.maps[HS.map].height / 2) {
            HS.ghost.teleport(HS.map, HS.ghost.x, HS.ghost.y - 1, 'down');
        }
    }
    tiles = GT.maps[HS.map].ground[HS.ghost.y][HS.ghost.x];
    if (tiles.indexOf('tree1') >= 0 || tiles.indexOf('tree2') >= 0 || tiles.indexOf('well') >= 0 || tiles.indexOf('columnbroken') >= 0 || tiles.indexOf('tombstone') >= 0) {
        console.log('center', tiles);
        center();
    }
    // workaround for fog below ghost
    console.log('xy', HS.ghost.x, HS.ghost.y);
    HS.ghost.base('invisible');
    GT.map.change(HS.map, HS.ghost.x, HS.ghost.y, 'ghost-down', false);
};

HS.startTimer = function () {
    // Start countdown timer
    HS.lip = DH.lip('60s', null, 60);
    HS.lip.close.style.display = 'none';
    HS.lip.color('lime');
    HS.lip.lip.onclick = undefined;
    HS.time = 60;
    setInterval(function () {
        if (HS.win || HS.lost) {
            return;
        }
        HS.time--;
        HS.lip.text.textContent = HS.time + 's';
        if (HS.time >= 15 && HS.time < 30) {
            HS.lip.color('yellow');
        }
        if (HS.time >= 1 && HS.time < 15) {
            HS.lip.color('orange');
        }
        if (HS.time < 1) {
            HS.lip.color('red');
        }
        if (HS.ghost.distanceTo(HS.player.x, HS.player.y) < 3) {
            HS.win = true;
            HS.ghost.base('ghost');
            GT.bubblesCasual('hs_player', ["I found you!"], function () {
                setTimeout(function () {
                    GT.bubblesCasual('hs_ghost', ['Next time I will hide better!'], function () {
                        //HS.ghost.base('invisible');
                        DH.splash('Mission complete!', ['Play again', 'Back to chat'], 'lime', null, function (aButton) {
                            if (aButton === 'Play again') {
                                Android.loadUrl('file:///android_asset/hideandseek.html');
                            } else {
                                Android.loadUrl('file:///android_asset/android.html');
                            }
                        });
                        DH.metrics.log('win', HS.map, 1, 0, HS.time);
                    });
                }, 500);
            });
            return;
        }
        if (HS.time === 0) {
            HS.lost = true;
            DH.splash('Mission failed!', ['Play again', 'Back to chat'], 'orange', null, function (aButton) {
                if (aButton === 'Play again') {
                    Android.loadUrl('file:///android_asset/hideandseek.html');
                } else {
                    Android.loadUrl('file:///android_asset/android.html');
                }
            });
            DH.metrics.log('lost', HS.map, 1, 0, HS.time);
        }
    }, 1000);
};

HS.init = function () {
    // Initialize town
    GT.init(function () {
        // initialize canvas
        GT.canvas.init('background_canvas', 'character_canvas');
        window.addEventListener('resize', HS.landscape);
        GT.canvas.setZoom(document.body.clientWidth / 13 / GT.size);

        // initialize on-screen touchpad
        GT.touchpad = DH.touchpad('icon/arrows130.png', undefined, true);
        GT.touchpad.img.style.zIndex = 10;
        //GT.touchpad.img.style.bottom = '2em';
        GT.touchpad.img.style.opacity = 0.7;
        GT.touchpad.hide();

        // wasd
        GT.keyboard.touchpad = true;

        // hide touchpad on desktop
        if (!Android.isReal()) {
            GT.touchpad.hide();
            GT.touchpad.hide = function () { console.log('GT.touchpad.hide suppressed'); };
            GT.touchpad.show = function () { console.log('GT.touchpad.show suppressed'); };
        }

        // init

        // player
        HS.player = GT.map.npc(HS.map, 'hs_player');
        // HS.player.base(DH.storage.readString('GT.playerBase', 'boy')); !!!!!!!!!!!!
        HS.player.setPlayer();

        // ghost
        GT.touchpad.show();
        HS.ghost = GT.map.npc(HS.map, 'hs_ghost');
        HS.ghost.teleport('forest', HS.player.x - 1, HS.player.y);
        setTimeout(function () {
            GT.bubblesCasual('hs_ghost', ["Find me if you can!"], function () {
                HS.placeGhost();
                setTimeout(function () {
                    GT.bubblesCasual('hs_player', ['I will find you!'], function () {
                        HS.startTimer();
                        GT.touchpad.show();
                    });
                }, 500);
            });
        }, 500);

        // background
        GT.background.load(HS.map);
        GT.background.key = '';

        // directional flashlight
        HS.fog = document.getElementById('fog');
        GT.touchpad.angle = Math.PI;
        setInterval(function () {
            if (Math.abs(GT.touchpad.angle - HS.angle) > 0.05) {
                HS.fog.style.transform = 'rotate(' + (-Math.PI / 2 + GT.touchpad.angle) + 'rad)';
            }
            HS.angle = GT.touchpad.angle;
            HS.dir = HS.player.dir;
        }, 50);

        // rendering loop
        GT.loop();
    });
};

// initialize window
window.addEventListener('DOMContentLoaded', function () {
    Android.isReal = function () {
        return true;
    };

    // load saved player
    HS.init();

    DH.metrics.init('hideandseek', 201);
    DH.metrics.errorLogger(10);
});

