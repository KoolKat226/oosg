// show user's edits and allow to edit them further, this replaces import/export functionality in android app
"use strict";
// globals: DH, GHOST

var GA = GA || {};

GA.edits = function () {
    // show edits
    var o = {}, h = {}, i, q, a;
    if (DH.focus) {
        DH.focus.pop();
    }

    // add all q/a to object
    i = 0;
    for (q in GA.user.data) {
        if (GA.user.data.hasOwnProperty(q)) {
            i++;
            o['Q' + i] = q;
            o['A' + i] = GA.user.data[q].join(';');
            h['A' + i] = { note: '\xA0' };
        }
    }

    // note if no edits
    if (Object.keys(GA.user.data).length === 0) {
        o[" "] = { type: 'html' };
        h[" "] = { type: 'html', html: function (aParent) { aParent.textContent = "You don't have any edits yet. In chat window tap on the ghost's answer and type something else to change ghost's answer for your question."; } };
    }

    // show options
    DH.options(o, h, function (aChanged) {
        // save changes
        if (DH.focus) {
            DH.focus.push('question');
        }
        GA.showKeyboard();
        if (!aChanged) {
            return;
        }
        var k, n = {};
        for (k in aChanged) {
            if (aChanged.hasOwnProperty(k)) {
                if (k.charAt(0) === 'Q') {
                    q = aChanged[k];
                }
                if (k.charAt(0) === 'A') {
                    a = aChanged[k];
                    if (q && a) {
                        q = GHOST.normalize(q, undefined, GHOST.character.basic.slang, false, GHOST.character.basic.shortcuts).join(' ');
                        n[q] = a.split(';');
                    }
                }
            }
        }
        console.log(n);
        // save modified edits
        GA.user.data = n;
        // rebuild index because data has changed
        GHOST.indexRebuild(GA.user);
        // save user data
        if (DH.storage) {
            DH.storage.writeObject('GHOST_USER', GA.user);
        } else {
            DH.storage3.writeObject('GHOST_USER', GA.user);
        }
    }, 'Edits');
};
