// Show dialog with key-value options
// require: none
"use strict";

var DH = window.DH || {};

DH.options = function (aOptions, aHints, aCallback, aTitle) {
    // show options dialog
    var div, h1, cancel, k, form, table, tr, td, td1, inp, h1b, p, btn,
        opt, o, opts, inputs = {}, focus = null;

    div = document.createElement('div');
    div.className = 'dh_options';
    div.style.position = 'fixed';
    div.style.left = 0;
    div.style.top = 0;
    div.style.right = 0;
    div.style.bottom = 0;
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.backgroundColor = 'inherit';
    div.style.color = 'inherit';
    div.style.padding = '1ex';
    div.style.margin = '0';

    h1 = document.createElement('h1');
    h1.textContent = aTitle || 'Options';
    h1.style.margin = '0';
    h1.style.padding = '0';
    h1.style.paddingBottom = '1ex';
    h1.style.fontSize = 'large';
    div.appendChild(h1);

    // for some reason table cannot have flex=1
    form = document.createElement('form');
    form.style.flex = '1';
    form.style.overflowY = 'scroll';
    div.appendChild(form);

    table = document.createElement('table');
    table.style.marginRight = '1ex';
    form.appendChild(table);

    function hint(aKey, aHint, aDefault) {
        // get single hint
        if (aHints && aHints.hasOwnProperty(aKey) && aHints[aKey].hasOwnProperty(aHint)) {
            return aHints[aKey][aHint];
        }
        return aDefault;
    }

    for (k in aOptions) {
        if (aOptions.hasOwnProperty(k)) {
            // row
            tr = document.createElement('tr');
            table.appendChild(tr);
            // first column
            td = document.createElement('td');
            if (aHints && aHints.hasOwnProperty(k) && aHints[k].caption) {
                td.textContent = aHints[k].caption;
            } else {
                td.textContent = k;
            }
            td.style.whiteSpace = 'nowrap';
            td1 = td;
            tr.appendChild(td);

            // shop
            if (hint(k, 'type') === 'shop') {
                td.textContent = '';
                td.setAttribute('colspan', 2);
                td.style.whiteSpace = 'normal';
                // h1
                h1b = document.createElement('h1');
                h1b.textContent = hint(k, 'caption');
                h1b.style.margin = '0';
                h1b.style.padding = '0';
                h1b.style.paddingTop = '1ex';
                h1b.style.fontSize = 'large';
                td.appendChild(h1b);
                // text
                p = document.createElement('div');
                td.appendChild(p);
                // button
                btn = document.createElement('button');
                btn.textContent = hint(k, 'label');
                btn.style.minHeight = hint(k, 'minHeight');
                btn.style.float = 'right';
                btn.style.marginLeft = '1ex';
                btn.onclick = hint(k, 'onclick');
                p.appendChild(btn);
                p.appendChild(document.createTextNode(hint(k, 'text')));
                continue;
            }

            // second column
            td = document.createElement('td');
            td.style.width = '100%';
            tr.appendChild(td);
            // custom html
            if (hint(k, 'type') === 'html') {
                inputs[k] = hint(k, 'html')(td);
            } else if (hint(k, 'type') === 'separator') {
                // separator
                td1.innerHTML = '&nbsp;';
            } else if (hint(k, 'type') === 'h1') {
                // h1
                inputs[k] = document.createElement('h1');
                inputs[k].style.margin = '0';
                inputs[k].style.padding = '0';
                inputs[k].style.paddingTop = '1ex';
                inputs[k].style.fontSize = 'large';
                inputs[k].textContent = hint(k, 'caption');
                td1.textContent = '';
                td1.appendChild(inputs[k]);
                //td1.style.paddingTop = '1ex';
                //td.innerHTML = '<button style="float: right;">Open shop</button>';
                /*
                if (hint(k, 'onclick')) {
                    inp = document.createElement('button');
                    inp.textContent = hint(k, 'label');
                    td.appendChild(inp);
                }*/
            } else {
                // input
                opts = hint(k, 'options');
                if (opts) {
                    inp = document.createElement('select');
                    for (o = 0; o < opts.length; o++) {
                        opt = document.createElement('option');
                        opt.textContent = opts[o];
                        inp.appendChild(opt);
                    }
                } else {
                    inp = document.createElement('input');
                }
                inputs[k] = inp;
                if (inp.nodeName.toUpperCase() === 'INPUT') {
                    inp.type = hint(k, 'type', 'text');
                }
                if (hint(k, 'maxLength') > 0) {
                    inp.maxLength = hint(k, 'maxLength');
                }
                if (['text', 'url', 'email', 'password'].indexOf(inp.type) >= 0) {
                    if (hint(k, 'maxLength', 0) <= 0) {
                        inp.style.width = '100%';
                    }
                }
                // min max
                if (hint(k, 'min')) {
                    inp.min = hint(k, 'min');
                }
                if (hint(k, 'max')) {
                    inp.max = hint(k, 'max');
                }
                // required
                if (hint(k, 'required')) {
                    inp.required = true;
                }
                // minHeight
                if (hint(k, 'minHeight')) {
                    inp.style.minHeight = hint(k, 'minHeight');
                }
                // focus
                if (hint(k, 'focus')) {
                    focus = inp;
                }
                // datalist options
                /*
                opts = hint(k, 'options', []);
                if (opts.length > 0) {
                    dl = document.createElement('datalist');
                    for (o = 0; o < opts.length; o++) {
                        opt = document.createElement('option');
                        opt.textContent = opts[o];
                        dl.appendChild(opt);
                    }
                    dl.id = 'datalist-for-' + k;
                    div.appendChild(dl);
                    inp.setAttribute('list', 'datalist-for-' + k);
                    inp.style.width = '';
                }
                */
                // value
                inp.value = aOptions[k];
                // button label
                if ((inp.type === 'button') && hint(k, 'label')) {
                    inp.dataKey = k;
                    inp.dataValue = aOptions[k];
                    inp.title = aOptions[k];
                    inp.value = hint(k, 'label');
                    inp.onclick2 = hint(k, 'onclick');
                    inp.onclick = function (event) {
                        event.target.onclick2(event.target.dataKey, event.target.dataValue, function (aKey, aVal) {
                            aOptions[aKey] = aVal;
                        });
                    };
                }
                // checkbox
                if (inp.type === 'checkbox') {
                    inp.checked = aOptions[k];
                }
                // disabled
                if (hint(k, 'disabled')) {
                    inp.disabled = true;
                }
                td.appendChild(inp);
            }

            // hidden
            if (hint(k, 'hidden')) {
                tr.style.display = 'none';
                tr.style.opacity = 0.5;
            }

            // note
            if (hint(k, 'note')) {
                tr = document.createElement('tr');
                table.appendChild(tr);
                // first column
                td = document.createElement('td');
                tr.appendChild(td);
                // second column
                td = document.createElement('td');
                td.style.width = '100%';
                td.textContent = hint(k, 'note');
                tr.appendChild(td);
            }
        }
    }

    // submit button
    tr = document.createElement('tr');
    table.appendChild(tr);
    // first column
    td = document.createElement('td');
    tr.appendChild(td);
    // second column
    td = document.createElement('td');
    td.style.width = '100%';
    tr.appendChild(td);
    inp = document.createElement('input');
    inp.type = 'submit';
    inp.value = 'Save';
    td.appendChild(inp);

    // cancel button
    cancel = document.createElement('button');
    cancel.style.marginLeft = '1ex';
    cancel.textContent = 'Cancel';
    td.appendChild(cancel);
    cancel.onclick = function (event) {
        event.preventDefault();
        div.parentElement.removeChild(div);
        aCallback();
    };

    // submit function (this will also run input validation)
    form.onsubmit = function (event) {
        event.preventDefault();
        var j;
        for (j in aOptions) {
            if (aOptions.hasOwnProperty(j)) {
                if (!inputs[j]) {
                    continue;
                }
                if (inputs[j].type !== 'button') {
                    aOptions[j] = inputs[j].value;
                }
                if (inputs[j].type === 'checkbox') {
                    aOptions[j] = inputs[j].checked;
                }
            }
        }
        if (aCallback) {
            aCallback(aOptions);
        }
        div.parentElement.removeChild(div);
    };

    document.body.appendChild(div);
    setTimeout(function () { if (focus) { focus.focus(); } }, 300);
    return {div: div, h1: h1, table: table, inputs: inputs };
};

