// Ballons rendering and functions
"use strict";
// globals: Image, DH, GT, document, setTimeout

var BM = BM || {};

BM.balloonImages = {};

BM.balloon = function (aX, aType) {
    // Create one balloon
    this.x = aX;
    this.type = aType || 'pink';
    this.visible = true;
};

BM.balloonsRandom = function (aLine) {
    // Generate random balloons (prefer peaks of given line) using level-defined random function
    var block = Math.floor(aLine.length / 16), i = block, maxx = 0, maxy = 0, maxi = 0, bal = [], x, y;
    while (i < aLine.length) {
        x = aLine[i][0];
        y = aLine[i][1];
        if (y > maxy && x > 0.1 && x < 0.9) {
            maxx = x;
            maxy = y;
            maxi = i;
        }
        if ((maxi > 0) && (i - maxi >= block)) { //  /*&& (maxy > 0.2)*/
            bal.push(new BM.balloon(maxx, BM.level.random()));
            maxx = 0;
            maxy = 0;
            maxi = 0;
        }
        i++;
    }
    return bal;
};

BM.balloonsRender = function (aBalloons, aDistance, aLine) {
    // Render balloons
    var size, bi, a, b, i, bx, by, by2, d;
    if (BM.monochrome) {
        BM.context.strokeStyle = 'rgba(170,170,170,' + (1 - aDistance) + ')';
    } else {
        BM.context.strokeStyle = 'rgba(255,128,128,' + (1 - aDistance) + ')';
    }
    size = (1 - aDistance) * 50;
    size = 5 + 35 * (1 - Math.sin(aDistance * Math.PI / 2));
    if (size > 40) {
        size = 40;
    }
    d = BM.h - Math.sin(aDistance * Math.PI / 2) * BM.h * 0.5;
    //console.log('size', size);
    BM.context.globalAlpha = 1 - aDistance * aDistance;
    for (bi = 0; bi < aBalloons.length; bi++) {
        if (!aBalloons[bi].visible) {
            continue;
        }
        a = BM.player.x - 0.1;
        b = BM.player.x + 0.1;
        i = Math.round(aBalloons[bi].x * aLine.length);
        bx = (aBalloons[bi].x - a) * BM.w / (b - a);
        by = d + 50 - 0.5 * 150;
        //console.log('ll', aLine.length, 'i', i)
        by2 = d + 50 - aLine[i][1] * 150;
        //console.log('a', a, 'b', b, 'i', i, 'bx', bx, 'by', by);
        BM.context.drawImage(BM.sprites.sprites[BM.monochrome ? 'gray' : aBalloons[bi].type], bx - size / 2, by - 2 * size + BM.ridgeY, size, size);
        // string
        if (BM.drawStrings) {
            BM.context.beginPath();
            BM.context.moveTo(bx, by - size + BM.ridgeY);
            BM.context.lineTo(bx, by2 + BM.ridgeY);
            BM.context.closePath();
            BM.context.stroke();
        }
    }
    BM.context.globalAlpha = 1;
};

BM.balloonsHit = function (aBalloons, aDistance) {
    // Test if player hit balloons
    var i, px = BM.player.x, s = BM.player.score, sizeD = BM.level.hitboxSizeY || 0.05, sizeX = BM.level.hitboxSizeX || 0.02;
    if (BM.player.life <= 0) {
        return;
    }
    if (Math.abs(aDistance) < sizeD) {
        for (i = 0; i < aBalloons.length; i++) {
            if (aBalloons[i].visible && (Math.abs(px - aBalloons[i].x) < sizeX)) {
                aBalloons[i].visible = false;
                BM.player.score++;
                BM.player.pop(aBalloons[i].type);
                DH.sound.play('pop');
                BM.explosions.add(BM.monochrome ? 'gray' : aBalloons[i].type, BM.w / 2 - 15, BM.h - 50 - 15);

                if (BM.buffs[aBalloons[i].type]) {
                    BM.buffs[aBalloons[i].type]();
                }

                if (BM.level.hit(aBalloons[i].type, aBalloons[i])) {
                    BM.onWin();
                }

                GT.achievements.add('balloons', 1);
                GT.achievements.add(aBalloons[i].type, 1);
            }
        }
    }
    if (s !== BM.player.score) {
        BM.player.speed *= 1.02;
        BM.player.speedLimit();
    }
};

BM.balloonsStats = function (aKeyValue) {
    // Show animated balloon statistics at the end of the level
    var div, figure, img, figcaption, k, a = [], speed = 0, eol = false;
    div = document.createElement('div');
    div.className = 'stats';
    for (k in aKeyValue) {
        if (aKeyValue.hasOwnProperty(k)) {
            figure = document.createElement('div');
            if (k === 'EOL') {
                figure.style.flexBasis = '100%';
                div.appendChild(figure);
                eol = true;
                continue;
            }
            img = document.createElement('img');
            img.src = 'image/' + k + '.png';
            img.style.width = eol ? '2em' : '1em';
            img.style.height = eol ? '2em' : '1em';
            figcaption = document.createElement('div');
            figcaption.innerHTML = '&nbsp;'; //textContent = ''; //aKeyValue[k];
            figcaption.style.fontSize = 'x-small';
            figcaption.style.color = k;
            figcaption.style.textShadow = '1px 1px 0px rgba(0,0,0,0.5)';
            figure.appendChild(img);
            figure.appendChild(figcaption);
            div.appendChild(figure);
            a.push({element: figcaption, current: 0, max: aKeyValue[k]});
            div.appendChild(figure);
            //speed += aKeyValue[k];
            if (aKeyValue[k] > speed) {
                speed = aKeyValue[k];
            }
        }
    }
    speed = 2000 / speed;
    function animate() {
        var i, again = false;
        for (i = 0; i < a.length; i++) {
            if (a[i].current < a[i].max) {
                a[i].current++;
                a[i].element.textContent = a[i].current;
                if (a[i].current > a[i].max) {
                    a[i].element.textContent = a[i].max;
                }
                if (!again) {
                    DH.sound.play('count');
                }
                again = true;
                //break;
            }
        }
        if (again) {
            setTimeout(animate, speed);
        }
    }
    setTimeout(animate, 500);
    return div;
};

