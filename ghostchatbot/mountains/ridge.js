// Mountain ridge generator and rendering
"use strict";
// globals:

var BM = BM || {};

BM.ridgeY = 0;

BM.ridge = function (aDistance, aWithBalloons) {
    // Jittery mountain ridge
    this.d = aDistance;
    this.line = BM.randomLine();
    if (aWithBalloons) {
        this.balloons = BM.balloonsRandom(this.line, (BM.level && BM.level.types) || BM.sprites.balloons);
    } else {
        this.balloons = [];
    }
};

BM.ridge.prototype.color = function (aDistance) {
    // Linearly interpolated ridge color (distant ridges are more hazy)
    if (aDistance < 0) {
        aDistance = 0;
    }
    if (aDistance > 1) {
        aDistance = 1;
    }
    var r = Math.round(5 + aDistance * (123 - 5)),
        g = Math.round(77 + aDistance * (195 - 77)),
        b = Math.round(63 + aDistance * (181 - 63)),
        a = aDistance < 0.8 ? 1 : 1 - (aDistance - 0.8) / 0.2;
    if (BM.monochrome) {
        r = Math.round((r + g + b) / 3);
        g = r;
        b = r;
    }
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};

BM.ridge.prototype.render = function () {
    // Render jittery line of mountain ridge
    BM.context.fillStyle = this.color(this.d);
    BM.context.beginPath();
    var i,
        a,
        b,
        ia,
        ib,
        x,
        y,
        sx,
        sy,
        d = BM.h - Math.sin(this.d * Math.PI / 2) * BM.h * 0.5;

    a = BM.player.x - 0.1;
    b = BM.player.x + 0.1;
    ia = Math.floor(a * this.line.length) - 1;
    if (ia < 0) {
        ia = 0;
    }
    ib = Math.ceil(b * this.line.length) + 1;
    if (ib > this.line.length - 1) {
        ib = this.line.length - 1;
    }

    //console.log('a', a, 'b', b, 'ia', ia, 'ib', ib, 't.d', this.d);
    BM.context.moveTo(0, d);
    for (i = ia; i < ib; i++) {
        // line coords
        x = this.line[i][0];
        y = this.line[i][1];
        // screen coords
        sx = (x - a) * BM.w / (b - a);
        sy = d + 50 - y * 150 + BM.ridgeY;
        BM.context.lineTo(sx, sy);
        //console.log('x', x, 'y', y, 'sx', sx, 'sy', sy);
    }

    BM.context.lineTo(BM.w, sy);
    BM.context.lineTo(BM.w, BM.h);
    BM.context.lineTo(0, BM.h);
    BM.context.closePath();
    BM.context.fill();
};



