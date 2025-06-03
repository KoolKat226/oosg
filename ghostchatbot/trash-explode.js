// Animate exploding sprites
"use strict";
// globals: document, window, setTimeout, TE, GT

var BM = BM || {};

BM.fragments = 9;
BM.fragmentFrames = 50;

BM.chunk = function (aImg, aX, aY, aSrcX, aSrcY, aSrcW, aSrcH, aDstX, aDstY, aDstW, aDstH) {
    // Create single chunk of image
    this.img = aImg;
    this.x = aX;
    this.y = aY;
    this.sx = aSrcX;
    this.sy = aSrcY;
    this.sw = aSrcW;
    this.sh = aSrcH;
    this.dx = aDstX - aDstW / 2;
    this.dy = aDstY - aDstH / 2;
    this.dw = aDstW;
    this.dh = aDstH;
    var ax = aSrcX + aSrcW / 2,
        ay = aSrcY + aSrcH / 2,
        bx = 16 / 2,
        by = 16 / 2;
    this.vx = (ax - bx) / 10 + 0.25 * (Math.random() - Math.random());
    this.vy = (ay - by) / 5 + 0.25 * (Math.random() - Math.random());
    this.rx = TE.player.rx;
    this.ry = TE.player.ry;
    this.opacity = 3;
};

BM.chunk.prototype.update = function () {
    // Update position of flying chunk
    var kx = 16 * GT.canvas.zoom * (TE.player.rx - this.rx),
        ky = 16 * GT.canvas.zoom * (TE.player.ry - this.ry),
        dt = 1;
    BM.context.globalAlpha = this.opacity > 1 ? 1 : this.opacity;
    BM.context.drawImage(this.img, this.sx, this.sy, this.sw, this.sh, this.dx - kx, this.dy - ky, this.dw, this.dh);
    this.vy += 0.04 * dt;
    this.dx += this.vx;
    this.dy += this.vy;
    this.opacity *= 0.95;
};

BM.explosions = (function () {
    // Explosions manager
    var self = {};
    self.explosions = [];

    self.reset = function () {
        // Clear explosions
        self.explosions = [];
    };

    self.add = function (aType, aX, aY) {
        // Create balloon chunks
        var e = {}, s = GT.canvas.zoom * 16, t = s / 3;
        e.img = BM.sprites.sprites[aType];
        e.c7 = new BM.chunk(e.img, aX, aY, 0, 0, 5, 5, aX, aY, t, t);
        e.c8 = new BM.chunk(e.img, aX, aY, 6, 0, 5, 5, aX + t, aY, t, t);
        e.c9 = new BM.chunk(e.img, aX, aY, 11, 0, 5, 5, aX + 2 * t, aY, t, t);
        e.c4 = new BM.chunk(e.img, aX, aY, 0, 6, 5, 5, aX, aY + t, t, t);
        e.c5 = new BM.chunk(e.img, aX, aY, 6, 6, 5, 5, aX + t, aY + t, t, t);
        e.c6 = new BM.chunk(e.img, aX, aY, 11, 6, 5, 5, aX + 2 * t, aY + t, t, t);
        e.c1 = new BM.chunk(e.img, aX, aY, 0, 11, 5, 5, aX, aY + 2 * t, t, t);
        e.c2 = new BM.chunk(e.img, aX, aY, 6, 11, 5, 5, aX + t, aY + 2 * t, t, t);
        e.c3 = new BM.chunk(e.img, aX, aY, 11, 11, 5, 5, aX + 2 * t, aY + 2 * t, t, t);
        e.frame = 0;
        self.explosions.push(e);
    };

    self.render = function () {
        // Render all chunks
        var i, e;
        for (i = self.explosions.length - 1; i >= 0; i--) {
            e = self.explosions[i];
            if (e.frame <= BM.fragmentFrames) {
                e.frame++;
                e.c7.update();
                e.c8.update();
                e.c9.update();
                if (BM.fragments > 3) {
                    e.c4.update();
                    e.c5.update();
                    e.c6.update();
                    if (BM.fragments > 6) {
                        e.c1.update();
                        e.c2.update();
                        e.c3.update();
                    }
                }
            } else {
                self.explosions.splice(i, 1);
            }
        }
    };

    return self;
}());

