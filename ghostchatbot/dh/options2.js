// Show dialog with custom options
"use strict";
// globals: document, window, setTimeout
// require: splash, none

var DH = window.DH || {};

DH.preview = function (aPreviewImage, aHideCallback) {
    // Show preview of paid feature
    var s = DH.splash('Preview', ['Close'], 'black', function (aParent) {
        var e = document.createElement('img');
        e.src = aPreviewImage;
        e.style.width = '100%';
        e.style.height = '100%';
        e.style.boxSizing = 'border-box';
        e.style.border = '1px solid gray';
        aParent.appendChild(e);
    }, aHideCallback, '90vw', '95vh');
    s.bg.style.color = 'white';
    s.bg.style.zIndex = 30;
};

DH.options2 = function (aShowCallback) {
    // background
    var bg, o = {}, inputs = {};

    // background
    bg = document.createElement('div');
    bg.className = 'dh_options2';
    document.body.appendChild(bg);

    // table
    o.table = document.createElement('table');

    // special functions

    o.hide = function () {
        bg.parentElement.removeChild(bg);
    };

    o.one = function () {
        // row with 1 column
        o.tr = document.createElement('tr');
        o.table.appendChild(o.tr);
        o.td1 = document.createElement('td');
        o.td1.setAttribute('colspan', 2);
        o.tr.appendChild(o.td1);
        o.td2 = null;
    };

    o.two = function () {
        // row with 2 columns
        o.tr = document.createElement('tr');
        o.table.appendChild(o.tr);
        o.td1 = document.createElement('td');
        o.td1.style.whiteSpace = "nowrap";
        o.tr.appendChild(o.td1);
        o.td2 = document.createElement('td');
        o.td2.style.width = '100%';
        o.tr.appendChild(o.td2);
    };

    o.label = function (aLabel) {
        // label
        var e = document.createElement('label');
        e.textContent = aLabel.match(/^\{/) ? '' : aLabel;
        o.td1.appendChild(e);
        return e;
    };

    o.input = function (aType, aValue) {
        // input
        var e = document.createElement('input');
        e.type = aType || "text";
        if (aValue !== undefined) {
            e.value = aValue;
        }
        o.td2.appendChild(e);
        return e;
    };

    o.saveCancel = function (aSaveCallback, aCancelCallback) {
        // save and cancel buttons
        o.one();
        var save, cancel;

        o.td1.className = 'savecancel';

        save = document.createElement('button');
        save.textContent = 'Save';
        save.onclick = function () {
            var k, ret = {};
            for (k in inputs) {
                if (inputs.hasOwnProperty(k)) {
                    ret[k] = inputs[k].value;
                }
            }
            if (aSaveCallback(ret, o)) {
                o.hide();
            }
        };
        o.td1.appendChild(save);

        cancel = document.createElement('button');
        cancel.textContent = 'Cancel';
        cancel.onclick = function () {
            if (aCancelCallback) {
                aCancelCallback(o);
            }
            o.hide();
        };
        o.td1.appendChild(cancel);

        save.dataCancel = cancel;
        return save;
    };

    // actual types

    o.h1 = function (aLabel) {
        // heading
        o.one();
        var e = document.createElement('h1');
        e.textContent = aLabel;
        o.td1.appendChild(e);
        return e;
    };

    o.h2 = function (aLabel) {
        // heading
        o.one();
        var e = document.createElement('h2');
        e.textContent = aLabel;
        o.td1.appendChild(e);
        return e;
    };

    o.span = function (aLabel, aValue) {
        // plain text
        o.two();
        o.label(aLabel);
        o.td2.textContent = aValue;
        return o.td2;
    };

    o.text = function (aLabel, aValue, aMin, aMax) {
        // text input
        o.two();
        o.label(aLabel);
        var i = o.input('text', aValue);
        if (aMin !== undefined) {
            i.minLength = aMin;
        }
        if (aMax !== undefined) {
            i.maxLength = aMax;
            i.style.maxWidth = (aMax + 3) + 'ex';
        }
        inputs[aLabel] = i;
        return i;
    };

    o.number = function (aLabel, aValue, aMin, aMax, aStep) {
        // number input
        o.two();
        o.label(aLabel);
        var i = o.input('number', aValue);
        i.min = aMin;
        i.max = aMax;
        i.step = aStep;
        inputs[aLabel] = i;
        return i;
    };

    o.checkbox = function (aLabel, aValue, aRightLabel, aCallback) {
        // text input
        o.two();
        o.label(aLabel);
        var i, right = document.createElement('label');
        o.td2.appendChild(right);
        i = o.input('checkbox');
        i.checked = aValue;
        i.addEventListener('change', function (event) { aCallback(event.target.checked, aLabel); }, true);
        right.appendChild(i);
        right.appendChild(document.createTextNode(aRightLabel));
        inputs[aLabel] = i;
        return i;
    };

    o.date = function (aLabel, aValue) {
        // date input
        o.two();
        o.label(aLabel);
        var i = o.input('date', aValue);
        inputs[aLabel] = i;
        return i;
    };

    o.select = function (aLabel, aValue, aValues, aCallback) {
        // date input
        o.two();
        o.label(aLabel);
        var i, s = document.createElement('select'), opt;
        for (i = 0; i < aValues.length; i++) {
            opt = document.createElement('option');
            opt.textContent = aValues[i];
            s.appendChild(opt);
        }
        s.value = aValue;
        if (aCallback) {
            s.onchange = function () {
                aCallback(s.value);
            };
        }
        o.td2.appendChild(s);
        inputs[aLabel] = s;
        return s;
    };

    o.html = function (aLabel, aCallback) {
        // html created with callback constructor
        o.two();
        o.label(aLabel);
        if (typeof aCallback === 'function') {
            return aCallback(o.td2);
        }
        o.td2.textContent = '';
        return o.td2;
    };

    o.button = function (aLabel, aButtonLabel, aCallback) {
        // button
        o.two();
        o.label(aLabel);
        var b = document.createElement('button');
        b.textContent = aButtonLabel;
        b.dataLabel = aLabel;
        b.onclick = aCallback;
        o.td2.appendChild(b);
        return b;
    };

    o.buttons = function (aLabel, aButtonLabels, aCallback) {
        // buttons
        o.two();
        o.label(aLabel);
        var i, b, a = [];
        for (i = 0; i < aButtonLabels.length; i++) {
            b = document.createElement('button');
            b.textContent = aButtonLabels[i];
            b.dataLabel = aLabel;
            b.dataIndex = i;
            b.onclick = aCallback;
            o.td2.appendChild(b);
            a.push(b);
        }
        return a;
    };

    o.buttonCenter = function (aButtonLabel, aCallback) {
        // button
        o.one();
        var b = document.createElement('button');
        b.textContent = aButtonLabel;
        b.onclick = aCallback;
        o.td1.appendChild(b);
        o.td1.style.textAlign = 'center';
        return b;
    };

    o.note = function (aText) {
        // add note
        var n = document.createElement('span');
        n.className = 'note';
        n.textContent = aText;
        o.td2.appendChild(n);
        return n;
    };

    o.noteStandalone = function (aText) {
        // add note
        o.two();
        var n = document.createElement('span');
        n.className = 'note';
        n.textContent = aText;
        o.td2.appendChild(n);
        return n;
    };

    o.noteBig = function (aText) {
        // add note
        o.one();
        var n = document.createElement('span');
        n.className = 'note';
        n.textContent = aText;
        o.td1.appendChild(n);
        return n;
    };

    o.hr = function () {
        // add note
        o.one();
        var n = document.createElement('hr');
        o.td1.appendChild(n);
        return n;
    };

    o.paid = function (aProduct, aText, aPrice, aCallback, aPreviewImage) {
        o.one();
        var div, img, btn, text;
        div = document.createElement('div');
        div.className = 'paid';

        img = document.createElement('img');
        img.src = 'billing/' + aProduct + '.png';
        div.appendChild(img);

        text = document.createElement('div');
        text.textContent = aText + ' ';
        div.appendChild(text);

        btn = document.createElement('button');
        btn.textContent = 'Buy for $' + aPrice;
        btn.onclick = function () {
            aCallback(aProduct);
        };
        btn.className = 'color green';
        div.appendChild(btn);

        if (aPreviewImage) {
            btn = document.createElement('a');
            btn.href = '#';
            btn.textContent = '(preview)';
            btn.onclick = function () {
                DH.preview(aPreviewImage);
            };
            btn.className = 'color blue';
            text.appendChild(btn);
        }

        o.td1.appendChild(div);
        return div;
    };

    // animate bg
    setTimeout(function () {
        bg.classList.add('visible');
    }, 1);

    // animate content
    setTimeout(function () {
        bg.appendChild(o.table);
        aShowCallback(o, bg);
    }, 700);

    return {bg: bg, o: o, inputs: inputs};
};

