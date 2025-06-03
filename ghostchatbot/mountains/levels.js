// Levels
"use strict";
// globals: document, window, DH, BM, setTimeout

var BM = BM || {};

BM.standardDistribution = {
    black: 1,
    brown: 2,
    red: 2,
    gray: 2,
    yellow: 2,
    blue: 3,
    cyan: 4,
    orange: 5,
    white: 5,
    green: 6,
    purple: 7,
    lime: 10,
    pink: 10
};

BM.unused = function () {
    return false;
};

BM.levels = {};

/*
Variable            Description

BM.time             Elapsed time in seconds (e.g. 15.6)
BM.player.total     Total amount of popped balloons (e.g. 4)
BM.player.balloons  Colors and counts of popped balloons (e.g. {pink: 3, cyan: 1})
BM.player.distance  Number of crossed mountain ridges (e.g 15)
*/

BM.levels.level1 = {
    requires: 0,
    objective: ["Pop 10 balloons", "", "⭐ finish level", "⭐⭐ under 10s", "⭐⭐⭐ under 9s"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({balloons: 10});
    },
    hit: function () {
        BM.progress.balloons();
        return BM.player.total >= 10;
    },
    stars: function () {
        if (BM.time < 9) {
            return 3;
        }
        if (BM.time < 10) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level2 = {
    requires: 1,
    objective: ["Pop 20 balloons under 30s", "", "⭐ finish level", "⭐⭐ under 20s", "⭐⭐⭐ under 25s"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({balloons: 20, time: 30});
    },
    mountain: function () {
        BM.progress.time(true);
        if (BM.time >= 30) {
            BM.onFail();
        }
        return false;
    },
    hit: function () {
        BM.progress.balloons();
        return BM.player.total >= 20;
    },
    stars: function () {
        if (BM.time < 25) {
            return 3;
        }
        if (BM.time < 20) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level3 = {
    requires: 2,
    objective: ["Pop 30 balloons", "", "⭐ finish level", "⭐⭐ under 30s", "⭐⭐⭐ under 40s"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({balloons: 30});
    },
    hit: function () {
        BM.progress.balloons();
        return BM.player.total >= 30;
    },
    stars: function () {
        if (BM.time < 40) {
            return 3;
        }
        if (BM.time < 30) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level4 = {
    requires: 3,
    objective: ["Pop 10 balloons and at least 3 blue", "", "⭐ finish level", "⭐⭐ under 30s", "⭐⭐⭐ under 40s"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({balloons: 10, blue: 3});
    },
    hit: function () {
        BM.progress.balloons();
        BM.progress.colored('blue');
        return (BM.player.total >= 10) && (BM.player.balloons.blue >= 3);
    },
    stars: function () {
        if (BM.time < 40) {
            return 3;
        }
        if (BM.time < 30) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level5 = {
    requires: 4,
    objective: ["Pop 30 balloons and at least 10 pink and 10 green", "", "⭐ finish level", "⭐⭐ under 50s", "⭐⭐⭐ under 40s"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({balloons: 30, pink: 10, green: 10});
    },
    hit: function () {
        BM.progress.balloons();
        BM.progress.colored('pink');
        BM.progress.colored('green');
        return (BM.player.total >= 30) && (BM.player.balloons.pink >= 10) && (BM.player.balloons.green >= 10);
    },
    stars: function () {
        if (BM.time < 40) {
            return 3;
        }
        if (BM.time < 50) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level6 = {
    requires: 8,
    objective: ["Cross 30 mountains", "", "⭐ finish level", "⭐⭐ under 30s", "⭐⭐⭐ under 20s"],
    random: BM.random({black: 1, red: 1, brown: 1, yellow: 1, pink: 3}),
    init: function () {
        BM.progress.reset({mountains: 30});
    },
    mountain: function () {
        BM.progress.mountains(true);
        return BM.player.distance >= 30;
    },
    hit: BM.unused,
    stars: function () {
        if (BM.time < 30) {
            return 3;
        }
        if (BM.time < 20) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level7 = {
    requires: 10,
    objective: ["Pop 10 pink and nothing else!", "", "⭐ finish level", "⭐⭐ under 30s", "⭐⭐⭐ under 20s"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({pink: 10});
    },
    hit: function (aType) {
        if (aType !== 'pink') {
            BM.onFail();
            return false;
        }
        BM.progress.colored('pink');
        return (BM.player.balloons.pink >= 10);
    },
    stars: function () {
        if (BM.time < 30) {
            return 3;
        }
        if (BM.time < 20) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level8 = {
    requires: 12,
    objective: ["Survive for 100 seconds", "", "⭐ finish level", "⭐⭐ pop 50 balloons", "⭐⭐⭐ pop 100 balloons"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({time: 100});
    },
    mountain: function () {
        BM.progress.time(true);
        if (BM.time >= 100) {
            BM.onWin();
        }
        return false;
    },
    hit: BM.unused,
    stars: function () {
        if (BM.player.total >= 100) {
            return 3;
        }
        if (BM.player.total >= 50) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level9 = {
    requires: 15,
    objective: ["Cross 100 mountains", "", "⭐ finish level", "⭐⭐ pop 50 balloons", "⭐⭐⭐ pop 100 balloons"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({mountains: 100});
    },
    mountain: function () {
        BM.progress.mountains(true);
        if (BM.player.distance >= 100) {
            BM.onWin();
        }
        return false;
    },
    hit: BM.unused,
    stars: function () {
        if (BM.player.total >= 100) {
            return 3;
        }
        if (BM.player.total >= 50) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level10 = {
    requires: 20,
    objective: ["Pop 20 balloons before crossing 20 mountains", "", "⭐ finish level", "⭐⭐ without brown", "⭐⭐⭐ colorblind"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({balloons: 20, mountains: 20});
    },
    mountain: function () {
        BM.progress.mountains(false);
        if (BM.player.distance >= 20 && BM.player.total < 20) {
            BM.onFail();
        }
        return false;
    },
    hit: function () {
        BM.progress.balloons();
        if (BM.player.total >= 20 && BM.player.distance <= 20) {
            BM.onWin();
        }
        return false;
    },
    stars: function () {
        if (BM.player.balloons.gray > 0) {
            return 3;
        }
        if (!BM.player.balloons.brown) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level11 = {
    requires: 22,
    objective: ["Pop balloon at least every 3 seconds for 30 seconds", "", "⭐ finish level", "⭐⭐ pop 40 balloons", "⭐⭐⭐ without red"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({time: 30});
        BM.lastHitTime = 0;
    },
    mountain: function () {
        BM.progress.time(true);
        if (BM.time >= 30) {
            BM.onWin();
        }
        if (BM.time - BM.lastHitTime > 3) {
            BM.onFail();
        }
        return false;
    },
    hit: function () {
        if (!BM.lastHitTime) {
            BM.lastHitTime = BM.time;
        }
        if (BM.time - BM.lastHitTime > 3) {
            BM.onFail();
        }
        BM.lastHitTime = BM.time;
        if (BM.time >= 30) {
            BM.onWin();
        }
        return false;
    },
    stars: function () {
        if (!BM.player.balloons.red) {
            return 3;
        }
        if (BM.player.total >= 40) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level12 = {
    requires: 24,
    objective: ["Pop 30 balloons in 30 seconds", "", "⭐ finish level", "⭐⭐ pop 40 balloons", "⭐⭐⭐ without red"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({balloons: 30, time: 30});
    },
    mountain: function () {
        BM.progress.time();
        if (BM.time > 30) {
            BM.onFail();
        }
        return false;
    },
    hit: function () {
        BM.progress.balloons();
        return (BM.player.total >= 30) && (BM.time <= 30);
    },
    stars: function () {
        if (!BM.player.balloons.red) {
            return 3;
        }
        if (BM.player.total >= 40) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level13 = {
    requires: 26,
    objective: ["Pop 20 pink in 60s", "", "⭐ finish level", "⭐⭐ under 55s", "⭐⭐⭐ under 50s"],
    random: BM.random(BM.standardDistribution),
    init: function () {
        BM.progress.reset({pink: 20, time: 60});
    },
    mountain: function () {
        BM.progress.time();
        if ((BM.time > 60) && (BM.player.balloons.pink < 20)) {
            BM.onFail();
        }
        return false;
    },
    hit: function () {
        BM.progress.colored('pink');
        return (BM.time <= 60) && (BM.player.balloons.pink >= 20);
    },
    stars: function () {
        if (BM.time < 50) {
            return 3;
        }
        if (BM.time < 55) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level14 = {
    requires: 27,
    objective: ["Cross 30 mountains without hitting black", "", "⭐ finish level", "⭐⭐ pop 1 pink", "⭐⭐⭐ pop 2 pink"],
    random: BM.random({black: 10, pink: 5}),
    hitboxSizeX: 0.015,
    balloons: function () { // (aLine)
        var r = [], i, x;
        for (i = 0; i < 20; i++) {
            x = i / 20 + (Math.random() - Math.random()) / 20;
            if (x < 0.1) {
                x = 0.1;
            }
            if (x > 0.9) {
                x = 0.9;
            }
            r.push({x: x, type: 'black', visible: true});
        }
        return r;
    },
    init: function () {
        BM.progress.reset({mountains: 30});
    },
    mountain: function () {
        BM.progress.mountains(true);
        return BM.player.distance >= 30;
    },
    hit: BM.unused,
    stars: function () {
        if (BM.player.balloons.pink >= 2) {
            return 3;
        }
        if (BM.player.balloons.pink === 1) {
            return 2;
        }
        return 1;
    }
};

BM.levels.level15 = {
    requires: 28,
    objective: ["Slalom between black balloons, pop all pink balloons", "", "⭐ finish level", "⭐⭐ pop 3 green", "⭐⭐⭐ pop 5 green"],
    random: BM.random({green: 1}),
    hitboxSizeX: 0.015,
    balloons: function () { // (aLine)
        if (BM.ridgesCreated > 24) {
            return [];
        }
        if (BM.ridgesCreated % 4 === 0) {
            return [{x: 0.51, type: 'black', visible: true}, {x: 0.53, type: 'pink', visible: true}, {x: 0.6, type: 'green', visible: true}];
        }
        if (BM.ridgesCreated % 4 === 2) {
            return [{x: 0.4, type: 'green', visible: true}, {x: 0.47, type: 'pink', visible: true}, {x: 0.49, type: 'black', visible: true}];
        }
        return [];
    },
    discard: function (aRidge) {
        var i;
        for (i = 0; i < aRidge.balloons.length; i++) {
            if (aRidge.balloons[i].type === 'pink' && aRidge.balloons[i].visible) {
                BM.onFail();
                return false;
            }
        }
        return true;
    },
    init: function () {
        BM.progress.reset({mountains: 30});
    },
    mountain: function () {
        BM.progress.mountains(true);
        if ((BM.player.distance >= 30) && (BM.player.balloons.pink < 13)) {
            BM.onFail();
            return false;
        }
        return BM.player.distance >= 30;
    },
    hit: BM.unused,
    stars: function () {
        if (BM.player.balloons.green >= 3) {
            return 2;
        }
        if (BM.player.balloons.green >= 5) {
            return 3;
        }
        return 1;
    }
};

