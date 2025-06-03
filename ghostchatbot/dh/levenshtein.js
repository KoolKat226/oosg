// Damerau-Levenshtein distance between strings
// require: none
"use strict";

var DH = window.DH || {};

// cm distance from esc
DH.levenshteinQuertyUS = {
    "scale": Math.sqrt(24.9 * 24.9 + 7.7 * 7.7) / 2,

    "`": [0, 2],
    "1": [2, 2],
    "2": [3.9, 2],
    "3": [5.8, 2],
    "4": [7.7, 2],
    "5": [9.6, 2],
    "6": [11.5, 2],
    "7": [13.4, 2],
    "8": [15.3, 2],
    "9": [17.2, 2],
    "0": [19.1, 2],
    "-": [21, 2],
    "=": [22.9, 2],
    "\\": [24.9, 2],

    "~": [0, 2],
    "!": [2, 2],
    "@": [3.9, 2],
    "#": [5.8, 2],
    "$": [7.7, 2],
    "%": [9.6, 2],
    "^": [11.5, 2],
    "&": [13.4, 2],
    "*": [15.3, 2],
    "(": [17.2, 2],
    ")": [19.1, 2],
    "_": [21, 2],
    "+": [22.9, 2],
    "|": [24.9, 2],

    "q": [2.9, 3.9],
    "w": [4.8, 3.9],
    "e": [6.7, 3.9],
    "r": [8.5, 3.9],
    "t": [10.5, 3.9],
    "y": [12.5, 3.9],
    "u": [14.3, 3.9],
    "i": [16.2, 3.9],
    "o": [18.1, 3.9],
    "p": [20.1, 3.9],
    "[": [22, 3.9],
    "]": [23.9, 3.9],
    "{": [22, 3.9],
    "}": [23.9, 3.9],

    "a": [3.2, 5.8],
    "s": [5.2, 5.8],
    "d": [7.1, 5.8],
    "f": [9, 5.8],
    "g": [10.9, 5.8],
    "h": [12.7, 5.8],
    "j": [14.6, 5.8],
    "k": [16.5, 5.8],
    "l": [18.4, 5.8],
    ";": [20.3, 5.8],
    "'": [22.3, 5.8],
    ":": [20.3, 5.8],
    "\"": [22.3, 5.8],

    "z": [4.3, 7.7],
    "x": [6.1, 7.7],
    "c": [8, 7.7],
    "v": [10, 7.7],
    "b": [11.9, 7.7],
    "n": [13.7, 7.7],
    "m": [15.6, 7.7],
    ",": [17.5, 7.7],
    ".": [19.4, 7.7],
    "/": [21.3, 7.7],
    "<": [17.5, 7.7],
    ">": [19.4, 7.7],
    "?": [21.3, 7.7]
};

DH.levenshtein = function (aWord1, aWord2, aCharMap) {
    // return Damerau-Levenshtein distance between strings
    if (aWord1 === '' || aWord2 === '') {
        return Math.max(aWord1.length, aWord2.length);
    }
    var x, cur = [], prev = [], a, b, c, d, y, m, c1, c2, cost, u, v;
    for (x = 0; x <= aWord1.length; x++) {
        cur.push(0);
        prev.push(x);
    }

    for (y = 1; y <= aWord2.length; y++) {
        cur[0] = y;
        for (x = 1; x <= aWord1.length; x++) {
            a = prev[x] + 1;
            b = cur[x - 1] + 1;
            c = prev[x - 1];
            c1 = aWord1.charAt(x - 1).toLowerCase();
            c2 = aWord2.charAt(y - 1).toLowerCase();
            d = c;
            if (c1 !== c2) {
                cost = 2;
                //console.log('c1', c1, 'c2', c2);
                if (aCharMap && aCharMap.hasOwnProperty(c1) && aCharMap.hasOwnProperty(c2)) {
                    u = aCharMap[c1][0] - aCharMap[c2][0];
                    v = aCharMap[c1][1] - aCharMap[c2][1];
                    cost = 1 + Math.sqrt(u * u + v * v) / aCharMap.scale;
                    //console.log(c1, c2, cost);
                }
                d = c + cost;
            }
            m = Math.min(a, b, d);
            cur[x] = m;
        }
        prev = cur.slice();
    }
    return cur.slice(-1)[0];
};

