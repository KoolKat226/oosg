// main window
"use strict";
// globals: document, window, DH, setInterval, setTimeout, requestAnimationFrame, Image, GT, Android

var BM = BM || {};

BM.frame = 0;
BM.time = 0;
BM.oldTime = 0;
BM.now = Date.now();
BM.pause = true;
BM.music = false; //DH.storage.readBoolean('BM.music', true);

Android.internalSpeechInitCallback = function () {
    console.log('ignored');
};

function purge() {
    DH.storage.eraseAll();
    if (window.hasOwnProperty('chrome')) {
        DH.console.disable();
    }
    document.location.reload();
}

function perf() {
    return "dt=" + BM.dt + ' fps=' + (BM.frame / BM.time).toFixed(1) + ' jitter=' + BM.jitterness + ' frag=' + BM.fragments + '/' + BM.fragmentFrames;
}

BM.onPause = function () {
    // Pause/unpause game
    BM.pause = !BM.pause;
    var buttons = BM.singleLevel > 0 ? ['Resume', 'Back to chat'] : ['Resume', 'Menu'];
    if (BM.pause) {
        BM.popup(
            'Game paused',
            'Take a short break and then come back!',
            'image/player_front_100.png',
            function (aButton) {
                BM.pause = false;
                BM.onMenuReplayNext(aButton || 'Resume');
            },
            buttons,
            false
        );
    }
};

BM.keyboardSpeed = 0.005;

BM.render = function () {
    // Render everything

    // keyboard controls
    if (GT.keyboard.key.a || GT.keyboard.key.ArrowLeft) {
        BM.player.swipe(BM.keyboardSpeed);
    }
    if (GT.keyboard.key.d || GT.keyboard.key.ArrowRight) {
        BM.player.swipe(-BM.keyboardSpeed);
    }

    // measure time
    BM.frame++;
    BM.now = Date.now();
    BM.dt = (BM.now - BM.oldTime) / 1000;
    if (BM.dt < 0) {
        BM.dt = 1 / 60;
    }
    if (BM.dt > 1 / 10) {
        BM.dt = 1 / 10;
    }
    BM.time += BM.dt;
    BM.oldTime = BM.now;

    // buffs
    if (BM.buffs) {
        BM.buffs.update(BM.dt);
    }

    // performance
    if (BM.frame % 60 === 0) {
        // defaults
        BM.perf = 1;
        BM.jitterness = 6;
        BM.fragments = 9;
        BM.fragmentFrames = 200;
        // various speeds
        if (BM.dt > 1 / 50) {
            BM.perf = 2;
            BM.jitterness = 5;
        }
        if (BM.dt > 1 / 40) {
            BM.perf = 3;
            BM.jitterness = 4;
            BM.fragments = 5;
            BM.fragmentFrames = 100;
        }
        if (BM.dt > 1 / 30) {
            BM.perf = 4;
            BM.jitterness = 3;
            BM.fragments = 3;
            BM.fragmentFrames = 50;
        }
        if (BM.dt > 1 / 20) {
            BM.perf = 5;
            BM.jitterness = 2;
            BM.fragments = 3;
            BM.fragmentFrames = 50;
        }
        if (BM.perf > BM.perfMax) {
            BM.perfMax = BM.perf;
        }
    }

    // clear canvas
    BM.context.clearRect(0, 0, BM.w, BM.h);

    var i, sort = false;
    for (i = 0; i < BM.ridges.length; i++) {

        BM.ridges[i].d -= BM.player.speed * (BM.dt / 0.01666);

        if (BM.ridges[i].d > -0.3) {
            // ridge, balloons, hits, explosions
            if (BM.ridges[i].d > 0) {
                BM.ridges[i].render(BM.x);
            }
            BM.balloonsRender(BM.ridges[i].balloons, BM.ridges[i].d, BM.ridges[i].line);
            BM.balloonsHit(BM.ridges[i].balloons, BM.ridges[i].d);
            BM.explosions.render();
        } else {
            // cross mountain, add new one
            BM.player.distance++;
            if (BM.level.hasOwnProperty('mountain')) {
                if (BM.level.mountain(BM.player.distance)) {
                    BM.onWin();
                }
            }

            // level event when ridge is discarded can check for unpopped balloons
            if (BM.level.discard) {
                BM.level.discard(BM.ridges[i]);
            }

            if (BM.level.balloons) {
                BM.ridges[i] = new BM.ridge(1, false);
                BM.ridges[i].balloons = BM.level.balloons(BM.ridges[i].line);
            } else {
                BM.ridges[i] = new BM.ridge(1, true);
            }
            BM.ridgesCreated++;
            sort = true;
        }
    }
    if (sort) {
        BM.ridges.sort(function (a, b) {
            return b.d - a.d;
        });
    }

    // render player
    BM.player.inertia();
    BM.player.render();
};

BM.resize = function () {
    // Resize canvas
    BM.w = BM.canvas.clientWidth;
    BM.h = BM.canvas.clientHeight;
    BM.canvas.width = BM.w;
    BM.canvas.height = BM.h;
    if (!BM.pause) {
        BM.render();
    }
};

BM.loop = function () {
    // Main rendering loop
    if (!BM.pause) {
        BM.render();
    }
    requestAnimationFrame(BM.loop);
};

BM.onTouchStart = function (event) {
    // Move player by swiping
    BM.touchX = event.targetTouches[0].clientX;
    //console.log('BM.onTouchStart', event.targetTouches[0].clientX);
};
BM.onTouchMove = function (event) {
    // Move player by swiping
    var dx = -(event.targetTouches[0].clientX - BM.touchX);
    BM.touchX = event.targetTouches[0].clientX;
    //console.log('BM.onTouchMove', event.targetTouches[0].clientX, dx);
    BM.player.swipe(dx / BM.w);
    if (event.target === BM.canvas) {
        event.preventDefault();
    }
};

BM.onMouseDown = function (event) {
    // Move player by mouse
    if (event.which === 1) {
        BM.mouseLeft = true;
        BM.touchX = event.clientX;
    }
};
BM.onMouseMove = function (event) {
    // Move player by swiping
    if (BM.mouseLeft) {
        var dx = -(event.clientX - BM.touchX);
        BM.touchX = event.clientX;
        BM.player.swipe(dx / BM.w);
    }
};
BM.onMouseUp = function (event) {
    // Move player by mouse
    if (event.which === 1) {
        BM.mouseLeft = false;
    }
};

BM.onStart = function (aLevelKey) {
    // Start given level
    console.log('onStart', aLevelKey);
    var old = BM.levelKey, obj;
    BM.levelKey = aLevelKey;

    // reset variables
    BM.onFailCalled = false;
    BM.onWinCalled = false;
    BM.frame = 0;
    BM.time = 0;
    BM.oldTime = BM.now;
    BM.monochrome = false;
    BM.monochromeCount = 0;
    document.body.style.backgroundColor = '#bceabc';
    BM.explosions.reset();
    BM.player.reset();
    BM.buffs.reset();
    BM.ridgesCreated = 0;
    BM.perfMax = 0;

    // load level
    BM.level = BM.levels[aLevelKey];
    BM.level.init();

    // first few ridges
    BM.ridges = [
        new BM.ridge(1, true),
        new BM.ridge(0.8, true),
        new BM.ridge(0.6),
        new BM.ridge(0.4),
        new BM.ridge(0.2)
    ];
    BM.ridgeFade = new BM.ridge(0);
    BM.ridgeY = 0;

    BM.render();
    obj = BM.level.objective.slice();
    BM.popup('Level ' + (Object.keys(BM.levels).indexOf(aLevelKey) + 1), obj, 'image/balloons.png', function () {
        BM.pause = false;
    }, undefined);

    if (DH.music) {
        if (BM.music && (old !== BM.levelKey)) {
            DH.music.next();
        }
    }

    DH.metrics.log('level-start', BM.levelKey, Object.keys(BM.levels).indexOf(BM.levelKey) + 1, 0, 0);
};

BM.onMenuReplayNext = function (aButton) {
    // Common popup callback
    console.log('button', aButton);
    // Back will return to parent app
    if (aButton === 'Back to chat') {
        Android.loadUrl('file:///android_asset/android.html');
        return;
    }
    // Resume game
    if (aButton === 'Resume') {
        BM.pause = false;
        return;
    }
    // Show main menu
    if (aButton === 'Menu') {
        BM.menu();
        return;
    }
    // Next level (if possible)
    if (aButton === 'Next') {
        var k = Object.keys(BM.levels),
            i = k.indexOf(BM.levelKey),
            ts;
        if (k[i + 1]) {
            // enough stars?
            ts = GT.stars.sum() + GT.achievements.stars();
            if (ts >= BM.levels[k[i + 1]].requires) {
                BM.onStart(k[i + 1]);
            } else {
                BM.popup('Not enough stars!', 'You need ' + BM.levels[k[i + 1]].requires + ' stars for next level but you only have ' + ts + '. Improve previous levels or complete achievements to get more stars.', '⭐', BM.onMenuReplayNext, ['Menu', 'Replay'], false, 0, null);
            }
            return;
        }
        // last level
        BM.popup('Congratulation', 'All levels completed!', 'image/achievement/achievement3.png', BM.onMenuReplayNext, ['Menu', 'Replay'], true, 0, {});
        return;
    }
    // replay
    BM.onStart(BM.levelKey);
};

BM.metricsData = function (aStats) {
    // Short achievements summary for metrics
    var i, n = [], s;
    for (i = 0; i < BM.levelAchievements.length; i++) {
        console.log(BM.levelAchievements[i]);
        s = BM.levelAchievements[i].key.substr(0, 3);
        n.push(s + '=' + BM.levelAchievements[i].limit);
    }
    for (i in aStats) {
        if (aStats.hasOwnProperty(i)) {
            s = i.substr(0, 3);
            if (s !== 'EOL') {
                n.push(s + "=" + aStats[i]);
            }
        }
    }
    n.push('prf=' + BM.perf + '/' + BM.perfMax);
    return n.join(' ');
};

BM.onWin = function () {
    // Player win
    if (BM.onWinCalled) {
        return;
    }
    BM.onWinCalled = true;
    BM.pause = true;
    var stars = BM.levels[BM.levelKey].stars(),
        bas = BM.player.balloonsAndStats(),
        buttons = BM.singleLevel > 0 ? ['Back to chat'] : ['Next', 'Replay', 'Menu'];
    GT.achievements.add('mountains', BM.player.distance);
    GT.achievements.add('time', BM.time);
    GT.achievements.add('win', 1);
    BM.showAllAchievements(function () {
        GT.stars.add(BM.levelKey, stars);
        DH.sound.play('win');
        BM.popup('Level complete!', null, '', function (aButton) {
            BM.onMenuReplayNext(aButton || 'Next');
        }, buttons, false, stars, bas);
    });
    DH.metrics.log('level-win', BM.metricsData(bas), Object.keys(BM.levels).indexOf(BM.levelKey) + 1, stars, BM.time);
    // mark level completed for parent app
    DH.storage.writeNumber('BM.singleLevel', BM.singleLevel + 1);
};

BM.onFail = function () {
    // Player failed
    if (BM.onFailCalled) {
        return;
    }
    BM.onFailCalled = true;
    var bas = BM.player.balloonsAndStats(),
        buttons = BM.singleLevel > 0 ? ['Back to chat'] : ['Replay', 'Menu'];
    BM.pause = true;
    GT.achievements.add('mountains', BM.player.distance);
    GT.achievements.add('time', BM.time);
    GT.achievements.add('fail', 1);
    BM.showAllAchievements(function () {
        DH.sound.play('gameover');
        BM.popup('Game over!', '', '', BM.onMenuReplayNext, buttons, false, 0, bas);
    });
    DH.metrics.log('level-fail', BM.metricsData(bas), Object.keys(BM.levels).indexOf(BM.levelKey) + 1, 0, BM.time);
};

BM.onMusic = function () {
    // Play/pause music
    BM.music = !BM.music;
    DH.storage.writeBoolean('BM.music', BM.music);
    if (DH.music) {
        if (BM.music) {
            DH.music.next();
        } else {
            DH.music.stop();
        }
    }
};

BM.onLocked = function (aMessage) {
    // Show message when level is locked
    DH.splash('Locked!', [], 'pink', function (aContent) {
        aContent.innerText = aMessage;
    }, null, '50vw', 'auto');
};

BM.menu = function () {
    // Show main menu
    var a, ac, div, stars_and_achievements = JSON.parse(JSON.stringify(GT.stars.stars));
    stars_and_achievements.achievements = GT.achievements.stars();

    BM.pause = true;
    div = GT.levels(
        'Ghost Mountains',
        'image/player_front_100.png',
        'image/balloons.png',
        'image/krivan.jpg',
        BM.levels,
        stars_and_achievements,
        BM.onStart,
        GT.achievements.show,
        BM.onLocked
    );

    a = div.getElementsByClassName('levels_extra')[0];
    ac = document.createElement('button');
    ac.textContent = '?';
    ac.onclick = BM.buffs.help;
    a.appendChild(ac);

    if (DH.music) {
        a = div.getElementsByClassName('levels_extra')[0];
        ac = document.createElement('button');
        ac.textContent = '🎵';
        ac.onclick = BM.onMusic;
        a.appendChild(ac);
    }
};

BM.levelAchievements = [];

BM.onAchievement = function (aKey, aLimit, aValue, aLevel) {
    // Track achievements for current level
    console.log('BM.onAchievement', aKey, aLimit, aValue);
    BM.levelAchievements.push({key: aKey, limit: aLimit, value: aValue, level: aLevel});
};

BM.showAllAchievements = function (aCallback) {
    // Show achievements all at once at the end of the level
    if (BM.levelAchievements.length <= 0) {
        aCallback();
        return;
    }
    var o = BM.pause, cur = BM.levelAchievements.shift(), suffix;
    BM.pause = true;
    DH.sound.play('achievement');

    suffix = cur.key + ' ' + BM.nouns + ' ' + BM.verbed;
    if (cur.key === 'balloons') {
        suffix = BM.nouns + ' ' + BM.verbed;
    }
    if (cur.key === 'mountains') {
        suffix = 'mountains crossed';
    }
    if (cur.key === 'time') {
        suffix = 'seconds flying';
    }

    BM.popup('New achievement!', cur.limit + ' ' + suffix, 'image/achievement/' + cur.key + '_' + cur.level + '.png', function () {
        BM.pause = o;
        if (BM.levelAchievements.length > 0) {
            BM.showAllAchievements(aCallback);
        } else {
            GT.achievements.save();
            aCallback();
        }
    }, [], true, cur.level);
};

window.addEventListener('DOMContentLoaded', function () {
    // initialize window
    try {
        BM.canvas = document.getElementById('canvas');
        BM.context = BM.canvas.getContext('2d');
        window.addEventListener('resize', BM.resize);
        BM.resize();
        BM.loop();

        DH.sound.add('pop', 5);
        DH.sound.add('argh', 1);
        DH.sound.add('win', 3);
        DH.sound.add('gameover', 3);
        DH.sound.add('achievement', 3);
        DH.sound.add('count', 8);
        DH.sound.add('beep', 5);
        DH.sound.add('click', 3);
        DH.sound.add('ooh', 2);
        DH.sound.add('star_yes', 3);
        DH.sound.add('star_no', 3);

        if (DH.music) {
            DH.music.add('Gravity Sound - Summers End');
            DH.music.add('Gravity Sound - Afternoon');
            DH.music.add('Gravity Sound - Chill Instrumental');
            DH.music.add('Gravity Sound - Soundscape');
            DH.music.add('Gravity Sound - Trail');
        }

        /*
        DH.sound.play = function () { window.i = 0; };
        DH.music.play = function () { window.i = 0; };
        */

        window.addEventListener('touchstart', BM.onTouchStart);
        window.addEventListener('touchmove', BM.onTouchMove, {passive: false});
        window.addEventListener('mousedown', BM.onMouseDown);
        window.addEventListener('mousemove', BM.onMouseMove);
        window.addEventListener('mouseup', BM.onMouseUp);
        document.getElementById('pause').addEventListener('click', BM.onPause);

        // different levels for different achievements
        GT.achievements.levels = [100, 500, 1000];
        GT.achievements.keyLevels.mountains = [1000, 2000, 3000];
        GT.achievements.keyLevels.black = [10, 50, 100];
        GT.achievements.callback = BM.onAchievement;
        GT.achievements.visible = {
            'mountains': 'Mountains crossed',
            'time': 'Fly time',
            'balloons': 'Total ghosts caught',
            'black': 'Black ghosts caught',
            'blue': 'Blue ghosts caught',
            'brown': 'Brown ghosts caught',
            'cyan': 'Cyan ghosts caught',
            'gray': 'Gray ghosts caught',
            'green': 'Green ghosts caught',
            'lime': 'Lime ghosts caught',
            'orange': 'Orange ghosts caught',
            'pink': 'Pink ghosts caught',
            'purple': 'Purple ghosts caught',
            'red': 'Red ghosts caught',
            'white': 'White ghosts caught',
            'yellow': 'Yellow ghosts caught'
        };

        // menu or single level
        BM.singleLevel = DH.storage.readNumber('BM.singleLevel', 0);
        if (BM.singleLevel > Object.keys(BM.levels).length) {
            BM.singleLevel = Object.keys(BM.levels).length;
        }
        if (BM.singleLevel > 0) {
            BM.onStart('level' + BM.singleLevel);
        } else {
            BM.menu();
        }

        // console
        document.getElementById('con').addEventListener('click', function () {
            DH.console.show(true);
        });
        if (DH.storage.readBoolean('BM.con', false)) {
            document.getElementById('con').style.display = 'block';
        }
        DH.console.showOnMultipleClicks(true, document.getElementsByClassName('img2')[0]);

        // start music
        if (DH.music && BM.music) {
            DH.music.next();
        }

        // metrics
        DH.metrics.init(BM.appName || 'bm', BM.appVersion || 1, 'default-app-key', 'https://ghost.sk/metrics/send.php');
        DH.metrics.errorLogger(10);

        console.log('Normal start');
    } catch (e) {
        alert(e);
    }
});

