// Rendering of XY charts
// require: date
"use strict";
// globals: document

var DH = window.DH || {};

DH.chartXY = function (aCanvas, aData, aOptions) {
    // draw xy chart in canvas
    var r = {}, ctx, x0, xd, i, x, y, px, py, ox, oy, w, h, sx, sy, xy = [], minx, miny, maxx, maxy,
        xlabels = [], xlab, xlab2, ylab, ylab2, border = 20, rec, rec2 = {};
    aCanvas = typeof aCanvas === 'string' ? document.getElementById(aCanvas) : aCanvas;

    // set options defaults
    aOptions = aOptions || {};
    aOptions.originY = aOptions.originY || 0;
    aOptions.stringX = aOptions.stringX || false;
    aOptions.labelCallbackX = aOptions.labelCallbackX || function (x) { return x; };
    aOptions.labelCallbackY = aOptions.labelCallbackY || function (y) { return y.toFixed(2); };
    aOptions.lineWidth = aOptions.lineWidth === undefined ? 1 : aOptions.lineWidth;
    aOptions.lineColor = aOptions.lineColor || 'black';
    aOptions.dotSize = aOptions.dotSize === undefined ? 6 : aOptions.dotSize;
    aOptions.dotColor = aOptions.dotColor || 'red';

    // convert dates to days (unless X are strings)
    for (x in aData) {
        if (aData.hasOwnProperty(x)) {
            y = aData[x];
            if (aOptions.numericX) {
                x = parseFloat(x);
                xlabels.push(x.toFixed(aOptions.numericXdigits));
            } else if (aOptions.stringX) {
                xlabels.push(x);
                x = xlabels.length;
            } else {
                xlabels.push(x);
            }
            xd = new Date(x);
            x0 = x0 || xd;
            xy.push([DH.date.daysBetween(xd, x0), y]);
        }
    }

    // find extremes
    minx = Number.MAX_VALUE;
    maxx = 0;
    miny = Number.MAX_VALUE;
    maxy = 0;
    for (i = 0; i < xy.length; i++) {
        x = xy[i][0];
        y = xy[i][1];
        minx = x < minx ? x : minx;
        maxx = x > maxx ? x : maxx;
        miny = y < miny ? y : miny;
        maxy = y > maxy ? y : maxy;
    }
    r.minyorig = miny;
    miny = aOptions.originY;
    //console.log('extremes', minx, maxx, miny, maxy);

    // round extremes to whole numbers
    miny = Math.floor(miny);
    maxy = Math.ceil(maxy);
    if (maxx === minx) {
        maxx = maxx + 1;
    }
    //console.log('extremes2', minx, maxx, miny, maxy);

    // prepare canvas for rendering
    sx = border + 0.5;
    sy = border + 0.5;
    w = aCanvas.clientWidth - 2 * border;
    h = aCanvas.clientHeight - 2 * border;
    ctx = aCanvas.getContext('2d');
    aCanvas.width = aCanvas.clientWidth;
    aCanvas.height = aCanvas.clientHeight;

    function line(aX1, aY1, aX2, aY2, aColor, aWidth, aDotSize, aDotColor) {
        //console.log('line', aX1, aY1, aX2, aY2, aColor, aWidth, aDotSize, aDotColor);
        // line
        ctx.fillStyle = aColor || "black";
        ctx.strokeStyle = aColor || "black";
        ctx.lineWidth = aWidth || 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(aX1, aY1);
        ctx.lineTo(aX2, aY2);
        ctx.stroke();
        ctx.closePath();
        // dot
        if (aDotSize > 0) {
            ctx.fillStyle = aDotColor || "red";
            ctx.beginPath();
            ctx.ellipse(aX1, aY1, aDotSize / 2, aDotSize / 2, 0, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(aX2, aY2, aDotSize / 2, aDotSize / 2, 0, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
        }
    }

    // axes
    line(sx, sy, sx, sy + h, aOptions.axisColor || 'black', 1, 0);
    line(sx, sy + h, sx + w, sy + h, aOptions.axisColor || 'black', 1, 0);
    line(sx, sy, sx + w, sy, aOptions.axisColor2 || 'silver', 1, 0);
    line(sx + w, sy, sx + w, sy + h, aOptions.axisColor2 || 'silver', 1, 0);

    // y-axis extremes
    ctx.fillStyle = aOptions.axisColor || 'black';
    ctx.fillText(miny, 4, sy + h);
    ctx.fillText(maxy, 4, sy - 4);

    //console.log('xy', xy);
    // draw series
    for (i = 0; i < xy.length; i++) {
        x = xy[i][0];
        y = xy[i][1];
        px = sx + w * (x - minx) / (maxx - minx);
        py = sy + h * (y - miny) / (maxy - miny);

        // label on x-axis (only when it changes)
        xlab = aOptions.labelCallbackX(xlabels[i]);
        if (xlab !== xlab2) {
            // label's background
            ctx.fillStyle = "transparent";
            rec = {x: px, y: sy + h + 2, w: ctx.measureText(xlab).width, h: 23};
            // hide first label if it overlap next label
            if (i <= 2) {
                if (rec2.x + rec2.w > rec.x) {
                    ctx.clearRect(rec2.x, rec2.y, rec2.w, rec2.h);
                }
                rec2 = JSON.parse(JSON.stringify(rec));
            }
            // label's white background
            ctx.fillRect(rec.x, rec.y, rec.w, rec.h);
            // label text
            ctx.fillStyle = "black";
            if (!aOptions.onlyXExtremes || (aOptions.onlyXExtremes && (i === 0) || (i === xy.length - 1))) {
                if (i === xy.length - 1) {
                    ctx.fillText(xlab, 2 * sx + w - ctx.measureText(xlab).width - 5, sy + h + 13);
                } else {
                    ctx.fillText(xlab, px, sy + h + 13);
                }
            }
            // vertical gray lines
            line(px, sy, px, sy + h, 'gray', 0.2, 0, 'red');
            ctx.fillStyle = "black";
            // small vertical black line
            line(px, sy + h + 0.5, px, sy + h + 2.5, 'black', 2, 0);
        }
        xlab2 = xlab;

        // label near y value
        ylab = aOptions.labelCallbackY(y, {index: i, x: x, xlabel: xlabels[i]});
        if (ylab !== ylab2 && !aOptions.noValueLabels) {
            ctx.fillStyle = 'black';
            ctx.fillText(ylab, px - (i === xy.length - 1 ? 15 : 0), 2 * sy + h - py - 10);
        }
        ylab2 = ylab;

        // series line
        if (i > 0) {
            line(ox, 2 * sy + h - oy, px, 2 * sy + h - py, aOptions.lineColor, aOptions.lineWidth, aOptions.dotSize, aOptions.dotColor);
        } else {
            // first dot and line (only usefull when chart has single point)
            line(px, 2 * sy + h - py, px, 2 * sy + h - py, aOptions.lineColor, aOptions.lineWidth, aOptions.dotSize, aOptions.dotColor);
        }

        ox = px;
        oy = py;
    }

    r.canvas = aCanvas;
    r.context = ctx;
    r.data = aData;
    r.options = aOptions;
    r.xlabels = xlabels;
    r.minx = minx;
    r.miny = miny;
    r.maxx = maxx;
    r.maxy = maxy;
    return r;
};

