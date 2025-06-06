// Buffs and debuffs caused by different balloons
"use strict";
// globals: document, window, DH, setTimeout, setInterval, Android

var BM = BM || {};

BM.buffs = (function () {
    // Buffs and debuffs caused by different balloons
    var self = {},
        active = [],
        visible = {},
        confusion = 0,
        indicator = {},
        seen = DH.storage.readObject('BM.buffs.seen', {}),
        infos = {
            'brown': 'Slow down by 50% for 10 seconds',
            'red': 'Speed up 2x for 10 seconds',
            'yellow': 'Confusion for 10 seconds',
            'gray': 'Back and white vision for 10 seconds',
            'black': 'You die!'
        };

    self.visible = visible;

    self.reset = function () {
        // Reset buffs
        var k;
        active = [];
        for (k in visible) {
            if (visible.hasOwnProperty(k)) {
                if (indicator.hasOwnProperty(k)) {
                    indicator[k].style.display = 'none';
                }
            }
        }
        visible = {};
        confusion = 0;
    };

    function indicatorShow(aType) {
        // Show buff indicator
        visible[aType] = visible[aType] || 0;
        visible[aType]++;
        if (indicator.hasOwnProperty(aType)) {
            indicator[aType].style.display = 'flex';
        }
    }

    function indicatorHide(aType) {
        // Hide buff indicator
        visible[aType]--;
        if (visible[aType] <= 0 && indicator.hasOwnProperty(aType)) {
            indicator[aType].style.display = 'none';
        }
    }

    // update visible indicators
    setInterval(function () {
        var t, i, min;
        for (t in visible) {
            if (visible.hasOwnProperty(t)) {
                if (visible[t] > 0) {
                    min = 0;
                    for (i = 0; i < active.length; i++) {
                        if (active[i].type === t && active[i].time > min) {
                            min = active[i].time;
                        }
                    }
                    // indicator
                    if (indicator.hasOwnProperty(t + 'Label')) {
                        indicator[t + 'Label'].textContent = min.toFixed(1) + 's';
                    }
                }
            }
        }
    }, 200);

    function info(aType, aInfo) {
        // Show popup info first time balloon of given type is popped
        if (!seen[aType]) {
            var titleCase = aType.substr(0, 1).toUpperCase() + aType.substr(1);
            BM.pause = true;
            BM.popup(titleCase + ' ' + BM.noun, aInfo || infos[aType], 'image/' + aType + '.png', function () {
                seen[aType] = true;
                DH.storage.writeObject('BM.buffs.seen', seen);
                BM.pause = false;
            }, []);
        } else {
            if (aType !== 'black') {
                DH.sound.play('ooh');
            }
        }
        indicatorShow(aType);
    }

    self.update = function (aDt) {
        // Age buffs and restore original state on buff expiration
        var i, stillActive = {};
        for (i = active.length - 1; i >= 0; i--) {
            active[i].time -= aDt;
            // frame based buffs
            if (active[i].frame) {
                active[i].frame();
            }
            // restore buffs
            if (active[i].time <= 0) {
                indicatorHide(active[i].type);
                active[i].callback();
                active.splice(i, 1);
            } else {
                stillActive[active[i].type] = true;
            }
        }
        BM.player.dir += confusion / 1000;
    };

    self.brown = function () {
        // Slow down by 50% for 10s
        var x = BM.player.speed / 2;
        BM.player.speed -= x;
        active.push({type: 'brown', time: 10, callback: function () {
            BM.player.speed += x;
            BM.player.speedLimit();
        }});
        info('brown');
    };

    self.red = function () {
        // Speed up 2x for 10s
        var x = BM.player.speed;
        BM.player.speed += x;
        active.push({type: 'red', time: 10, callback: function () {
            BM.player.speed -= x;
            BM.player.speedLimit();
        }});
        info('red');
    };

    self.yellow = function () {
        // Confusion for 10s
        confusion++;
        active.push({type: 'yellow', time: 10, callback: function () {
            confusion--;
        }});
        info('yellow');
    };

    self.gray = function () {
        // Monochromatic vision
        BM.monochrome = true;
        BM.monochromeCount++;
        document.body.style.backgroundColor = '#cccccc';
        BM.render();
        active.push({type: 'gray', time: 10, callback: function () {
            BM.monochromeCount--;
            if (BM.monochromeCount < 0) {
                BM.monochromeCount = 0;
            }
            BM.monochrome = BM.monochromeCount > 0;
            if (!BM.monochrome) {
                document.body.style.backgroundColor = '#bceabc';
            }
        }});
        info('gray');
    };

    self.black = function () {
        // Death
        DH.sound.play('argh');
        active.push({
            type: 'black',
            time: 3,
            frame: function () {
                BM.player.speed *= 0.95;
                BM.player.spiral += 0.1;
                BM.player.life = 0;
                BM.ridgeY -= 5;
            },
            callback: function () {
                BM.onFail();
            }
        });
        info('black');
    };

    self.help = function () {
        // Show what all buffs do
        DH.splash('Help', [], '#bceabc', function (aContent) {
            var div, img, label, k, h1, p;
            for (k in infos) {
                if (infos.hasOwnProperty(k)) {
                    div = document.createElement('div');
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.marginBottom = '1ex';
                    img = document.createElement('img');
                    img.src = 'image/' + k + '.png';
                    img.style.width = '1cm';
                    img.style.height = '1cm';
                    img.style.marginRight = '1ex';
                    label = document.createElement('label');
                    label.textContent = infos[k];
                    div.appendChild(img);
                    div.appendChild(label);
                    aContent.appendChild(div);
                }
            }
            // controls
            h1 = document.createElement('h3');
            h1.textContent = 'Controls';
            aContent.appendChild(h1);

            p = document.createElement('p');
            if (Android.isReal()) {
                p.textContent = BM.helpText || 'Read objective on the beginning of each level. Swipe left and right to control flying.';
            } else {
                p.textContent = BM.helpText || 'Read objective on the beginning of each level. Use left/right arrows or A/D keys or mouse left button to control flying. Some levels are easier with mouse!';
            }
            aContent.appendChild(p);

        }, null, '80vw', '80vh');
    };

    window.addEventListener('DOMContentLoaded', function () {
        indicator.red = document.getElementById('indicator_red');
        indicator.redLabel = indicator.red.getElementsByTagName('label')[0];
        indicator.brown = document.getElementById('indicator_brown');
        indicator.brownLabel = indicator.brown.getElementsByTagName('label')[0];
        indicator.yellow = document.getElementById('indicator_yellow');
        indicator.yellowLabel = indicator.yellow.getElementsByTagName('label')[0];
        indicator.gray = document.getElementById('indicator_gray');
        indicator.grayLabel = indicator.gray.getElementsByTagName('label')[0];
        self.ind = indicator;
    });

    return self;
}());

