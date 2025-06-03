// Translate level names with minimal effort (balloon->ghost)
"use strict";
// globals: document, window, Android

var BM = BM || {};

BM.noun = 'ghost';
BM.nouns = 'ghosts';
BM.verb = 'catch';
BM.verbed = 'caught';
BM.drawStrings = false;

BM.localizeLevels = function () {
    // localize levels
    console.warn('Localizing levels ', BM.noun, BM.verb, Object.keys(BM.levels).length, 'levels');
    var i, k;
    for (k in BM.levels) {
        if (BM.levels.hasOwnProperty(k)) {
            for (i = 0; i < BM.levels[k].objective.length; i++) {
                BM.levels[k].objective[i] = BM.levels[k].objective[i].replace(/Pop/g, 'Catch').replace(/pop/g, 'catch').replace(/balloons/g, 'ghosts').replace(/balloon/g, 'ghost');
            }
            //console.log(BM.levels[k].objective.join('\n'));
        }
    }
};

// localize levels
BM.localizeLevels();

// special back
BM.onBack = function () {
    // Pause/unpause game
    var old_pause = BM.pause;
    if (!old_pause) {
        BM.onPause();
    } else {
        Android.loadUrl('file:///android_asset/android.html');
    }
};

var java = 'java'; // linter
Android.setBack(java + 'script:try { BM.onBack(); } catch (ignore) {}');
