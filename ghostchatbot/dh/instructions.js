// Display usage instructions on first app start
"use strict";
// require: storage
// globals: document

var DH = window.DH || {};

DH.instructions = function (aInfo, aCallback, aForceShow) {
    // Display usage instructions on first app start
    var bg, h1, p, img, k, button, seen = {}, seen_all = true, num_seen = 0, first_unseen;

    // do not display if user already seen these instructions
    seen = DH.storage.readObject('DH.instructions', {});
    if (aForceShow) {
        seen = {};
    }
    for (k in aInfo) {
        if (aInfo.hasOwnProperty(k)) {
            if (!seen.hasOwnProperty(k)) {
                seen_all = false;
            } else {
                num_seen++;
            }
        }
    }
    if (seen_all) {
        return;
    }

    // fixed background
    bg = document.createElement('div');
    bg.style.backgroundColor = '#bbb';
    bg.style.position = 'fixed';
    bg.style.left = '0';
    bg.style.top = '0';
    bg.style.right = '0';
    bg.style.bottom = '0';
    bg.style.overflowY = 'scroll';
    bg.style.zIndex = 105;

    // heading
    h1 = document.createElement('h1');
    h1.textContent = 'Instructions';
    h1.style.fontSize = 'large';
    h1.style.textAlign = 'center';
    h1.style.margin = '0';
    h1.style.marginTop = '1ex';
    h1.style.padding = '0';
    bg.appendChild(h1);

    // parts
    for (k in aInfo) {
        if (aInfo.hasOwnProperty(k)) {
            if (typeof aInfo[k] === 'string') {
                // text
                p = document.createElement('p');
                p.textContent = aInfo[k];
            } else {
                // elements
                p = aInfo[k];
            }
            p.style.margin = 'auto';
            p.style.maxWidth = '90vw';
            p.style.fontSize = 'large';
            bg.appendChild(p);

            // image
            img = document.createElement('img');
            img.src = 'instructions/' + k + '.png';
            img.style.display = 'block';
            img.style.margin = 'auto';
            img.style.paddingBottom = '1em';
            img.style.maxWidth = '90vw';
            img.style.maxHeight = '90vh';
            bg.appendChild(img);

            if (!seen.hasOwnProperty(k) && !first_unseen && (num_seen > 0)) {
                first_unseen = p;
            }
            //seen[k] = 1;
        }
    }

    // continue button
    button = document.createElement('button');
    button.textContent = 'Continue';
    button.style.display = 'block';
    button.style.margin = 'auto';
    button.style.marginBottom = '1em';
    button.style.width = '90vw';
    button.style.minHeight = '1.3cm';
    button.addEventListener('click', function () {
        var m;
        for (m in aInfo) {
            if (aInfo.hasOwnProperty(m)) {
                seen[m] = 1;
            }
        }
        DH.storage.writeObject('DH.instructions', seen);
        bg.parentElement.removeChild(bg);
        if (typeof aCallback === 'function') {
            aCallback();
        }
    });
    bg.appendChild(button);

    // show it
    document.body.appendChild(bg);
    if (first_unseen) {
        setTimeout(function () {
            first_unseen.scrollIntoView();
        }, 500);
    }
    return bg;
};

DH.instructionsParagraph = function (aText) {
    // Convert {nav*} to buttons, the rest to text
    var i, a = aText.split(/[\{\}]/g), p = document.createElement('p'), s;
    for (i = 0; i < a.length; i++) {
        if (a[i].substr(0, 3) === 'nav') {
            s = document.createElement('button');
            s.className = 'navButton ' + a[i];
            s.style.width = '1em';
            s.style.height = '1em';
            s.style.minWidth = '1em';
            s.style.minHeight = '1em';
            s.style.backgroundSize = 'contain';
        } else {
            s = document.createElement('span');
            s.textContent = a[i];
        }
        p.appendChild(s);
    }
    return p;
};

