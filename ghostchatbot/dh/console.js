// Fake console for WebView, this will allow user to see console on mobile using console.show()
// require: none
"use strict";
// globals: document, window, Android, localStorage, TextEncoder, crypto

var DH = window.DH || {};

DH.consoleOld = console;
DH.console = (function () {
    var self = {
        limit: 200,
        buffer: [],
        important: []
    }, clicks = 0, clicktime = 0, showRun = false;

    self.stringify = function (aObject, aMaxDepth, aFoo, aIndent) {
        // stringify object e.g. max 2 level deep
        var t, k, fl;
        aFoo = aFoo || [];
        aIndent = aIndent || '';
        for (k in aObject) {
            //if (aObject.hasOwnProperty(k)) {
            t = typeof aObject[k];
            switch (t) {
            case "string":
            case "number":
            case "boolean":
                aFoo.push(aIndent + k + ': ' + aObject[k]);
                break;
            default:
                if (aObject[k] === null) {
                    aFoo.push(aIndent + k + ': null');
                } else {
                    if (Array.isArray(aObject[k])) {
                        aFoo.push(aIndent + k + ': [' + aObject[k].toString() + ']');
                    } else {
                        if (aMaxDepth > 1) {
                            aFoo.push(aIndent + k + ': {');
                            fl = aFoo.length;
                            self.stringify(aObject[k], aMaxDepth - 1, aFoo, aIndent + '    ');
                            if (aFoo.length === fl) {
                                aFoo[aFoo.length - 1] += '}';
                            } else {
                                aFoo.push(aIndent + '}');
                            }

                        } else {
                            aFoo.push(aIndent + k + ': {' + t + '}');
                        }
                    }
                }
            }
            //}
        }
        return aFoo.join('\n');
    };

    function push(aMessage) {
        if (aMessage.error || aMessage.warn) {
            self.important.push(aMessage);
        }
        self.buffer.push(aMessage);
        try {
            if ((self.limit > 0) && (self.buffer.length > self.limit)) {
                var a = self.buffer.length;
                self.buffer.splice(0, self.buffer.length - self.limit);
                if (a === self.buffer.length) {
                    alert('this is not possible');
                }
            }
        } catch (e) {
            alert(e);
        }
    }

    function strarg(aArguments) {
        try {
            var i, a = [], k, b = [];
            if (aArguments && aArguments.length) {
                for (i = 0; i < aArguments.length; i++) {
                    if (aArguments[i] === undefined) {
                        a.push('undefined');
                        continue;
                    }
                    if (typeof aArguments[i] === 'function') {
                        a.push('function');
                        continue;
                    }
                    if (typeof aArguments[i] === 'object') {
                        b = [];
                        for (k in aArguments[i]) {
                            if (aArguments[i].hasOwnProperty(k)) {
                                b.push(k + ': ' + (aArguments[i][k] && aArguments[i][k].toString()));
                            }
                        }
                        a.push('{' + b.join(' ') + '}');
                    } else {
                        a.push(aArguments[i].toString());
                    }
                }
            }
            return a.join(', ');
        } catch (e) {
            return aArguments + ' (' + e + ')';
        }
    }

    self.log = function () {
        push({ log: arguments });
        DH.consoleOld.log(strarg(arguments));
        return arguments;
    };

    self.warn = function () {
        push({ warn: arguments });
        DH.consoleOld.warn(strarg(arguments));
        return arguments;
    };

    self.info = function () {
        push({ info: arguments });
        DH.consoleOld.info(strarg(arguments));
        return arguments;
    };

    self.error = function () {
        var s = strarg(arguments);
        push({ error: arguments });
        DH.consoleOld.error(s);
        if (DH.hasOwnProperty('metrics') && DH.metrics.errorLoggerEnabled) {
            DH.metrics.log('error', s);
        }
        return arguments;
    };

    self.debug = function () {
        push({ debug: arguments });
        DH.consoleOld.debug(strarg(arguments));
        return arguments;
    };

    self.clear = function () {
        self.buffer = [];
        DH.consoleOld.clear(arguments);
    };

    self.showRaw = function (aData) {
        // show any raw data on screen
        var t, t1;
        t = document.createElement('div');
        t.style.backgroundColor = 'white';
        t.style.display = 'block';
        t.style.position = 'fixed';
        t.style.left = '0';
        t.style.right = '0';
        t.style.top = '0';
        t.style.bottom = '0';
        t.style.zIndex = 107;
        t.style.whiteSpace = 'pre';
        t.style.overflowY = 'scroll';
        t.style.fontFamily = 'monospace';
        t.style.color = 'black';
        t.style.backgroundColor = 'white';
        t.textContent = aData;
        t.ondblclick = function () {
            t.parentElement.removeChild(t);
        };
        t.ontouchstart = function () {
            if (Date.now() - t1 <= 300) {
                t.parentElement.removeChild(t);
            }
            t1 = Date.now();
        };
        document.body.appendChild(t);
        return t;
    };

    self.show = function (aShowRun) {
        var div = document.createElement('div'), select, option, bm, i, k, nav, line, s, j, a, clear, close, inp, run, cd, output, messages, color = {
            "log": "black",
            "info": "blue",
            "warn": "orange",
            "error": "red",
            "debug": "green",
            "extra": "lime"
        };

        function onClose() {
            div.parentElement.removeChild(div);
        }

        div.style.position = 'fixed';
        div.style.left = 0;
        div.style.top = 0;
        div.style.right = 0;
        div.style.bottom = 0;
        div.style.zIndex = 107;
        div.style.color = 'black';
        div.style.backgroundColor = 'white';
        div.style.boxSizing = 'border-box';
        div.style.overflowY = 'scroll';
        div.style.fontFamily = 'sans-serif';
        div.style.lineHeight = '100%';

        nav = document.createElement('nav');
        nav.style.display = 'flex';
        div.appendChild(nav);

        if (self.bookmarks) {
            select = document.createElement('select');
            select.innerHTML = '<option></option>';
            for (bm in self.bookmarks) {
                if (self.bookmarks.hasOwnProperty(bm)) {
                    option = document.createElement('option');
                    option.value = self.bookmarks[bm];
                    option.textContent = bm;
                    select.appendChild(option);
                }
            }
            select.style.width = '100%';
            select.onchange = function () {
                inp.value = select.value;
            };
            div.appendChild(select);
        }
        clear = document.createElement('button');
        clear.textContent = 'Clear';
        clear.style.minHeight = '1cm';
        clear.style.color = 'black';
        clear.addEventListener('click', function () {
            self.important = [];
            self.buffer = [];
            inp.value = '';
            messages.textContent = '';
            output.textContent = '';
            //onClose();
        });
        nav.appendChild(clear);

        inp = document.createElement('input');
        inp.placeholder = 'JS code';
        inp.style.flex = '1';
        inp.style.width = '1cm';
        inp.style.color = 'black';
        inp.style.backgroundColor = 'white';
        self.inputElement = inp;

        run = document.createElement('button');
        run.textContent = 'Run';
        run.style.minHeight = '1cm';
        run.style.color = 'black';
        run.style.backgroundColor = 'skyblue';
        //run.style.color = 'black';
        run.addEventListener('click', function () {
            var cmd = inp.value; //prompt('Code', '');
            if (!window.hasOwnProperty('FuriganaBrowser') && window.hasOwnProperty('localStorage') && localStorage.getItem('DH.console.unlocked') !== 'true') {
                self.unlock(cmd);
                return;
            }
            if (cmd) {
                try {
                    if (cmd.substr(0, 1) === '#') {
                        output.innerHTML = eval(cmd.substr(1));
                    } else {
                        output.textContent = eval(cmd);
                    }
                    output.style.border = '1px solid blue';
                } catch (e) {
                    output.textContent = e;
                    output.style.border = '1px solid red';
                }
            }
        });

        if (aShowRun) {
            nav.appendChild(inp);
            nav.appendChild(run);
        }

        if (typeof Android === 'object') {
            cd = document.createElement('button');
            cd.textContent = 'CD';
            cd.style.minHeight = '1cm';
            cd.style.color = 'black';
            cd.addEventListener('click', function () {
                output.textContent = Android.consoleData();
            });
            nav.appendChild(cd);
        }
        close = document.createElement('button');
        close.textContent = 'Close';
        close.style.minHeight = '1cm';
        close.style.color = 'black';
        close.addEventListener('click', onClose);
        nav.appendChild(close);

        output = document.createElement('div');
        div.appendChild(output);

        // messages
        messages = document.createElement('div');
        messages.style.overflow = 'scroll';
        messages.style.color = 'black';
        messages.style.backgroundColor = 'white';
        div.appendChild(messages);

        // important first
        for (i = 0; i < self.important.length; i++) {
            s = [];
            for (k in self.important[i]) {
                if (self.important[i].hasOwnProperty(k)) {
                    a = self.important[i][k];
                    for (j in a) {
                        if (a.hasOwnProperty(j)) {
                            s.push(a[j] && a[j].toString());
                        }
                    }
                    line = document.createElement('div');
                    line.textContent = s.join(' ');
                    line.style.color = color.hasOwnProperty(k) ? color[k] : "purple";
                    messages.appendChild(line);
                }
            }
        }
        // all messages
        for (i = 0; i < self.buffer.length; i++) {
            s = [];
            for (k in self.buffer[i]) {
                if (self.buffer[i].hasOwnProperty(k)) {
                    s.push(i + ': ');
                    a = self.buffer[i][k];
                    for (j in a) {
                        if (a.hasOwnProperty(j)) {
                            s.push(a[j] && a[j].toString());
                        }
                    }
                    line = document.createElement('div');
                    line.textContent = s.join(' ');
                    line.style.color = color.hasOwnProperty(k) ? color[k] : "purple";
                    messages.appendChild(line);
                }
            }
        }
        document.body.appendChild(div);
        return div;
    };

    self.dir = function () {
        self.log('console.dir not implemented');
    };

    self.dirxml = function () {
        self.log('console.dirxml not implemented');
    };

    self.table = function (a, b, c, d) {
        DH.consoleOld.table(a, b, c, d);
    };

    self.trace = function () {
        self.log('console.trace not implemented');
    };

    self.group = function () {
        self.log('console.group not implemented');
    };

    self.groupCollapsed = function () {
        self.log('console.groupCollapsed not implemented');
    };

    self.groupEnd = function () {
        self.log('console.groupEnd not implemented');
    };

    self.count = function () {
        self.log('console.count not implemented');
    };

    self.assert = function () {
        self.log('console.' + 'assert' + 't not implemented'); // linter
    };

    self.markTimeline = function () {
        self.log('console.markTimeline not implemented');
    };

    self.profile = function () {
        self.log('console.profile not implemented');
    };

    self.profileEnd = function () {
        self.log('console.profileEnd not implemented');
    };

    self.timeline = function () {
        self.log('console.timeline not implemented');
    };

    self.timelineEnd = function () {
        self.log('console.timelineEnd not implemented');
    };

    self.time = function () {
        self.log('console.time not implemented');
    };

    self.timeEnd = function () {
        self.log('console.timeEnd not implemented');
    };

    self.timeStamp = function () {
        self.log('console.timeStamp not implemented');
    };

    self.memory = DH.consoleOld.memory;

    self.unlock = function (aPassword) {
        var password = aPassword.trim(),
            t1 = Date.now(),
            hash = 'SHA-256',
            salt = '10ae8165724b427a9ad6aa4a9c784c527ece1280',
            iterations = 999000,
            keyLength = 32,
            textEncoder = new TextEncoder("utf-8"),
            passwordBuffer = textEncoder.encode(password);
        if (!window.hasOwnProperty('crypto')) {
            alert('Console unlocked, you can now type and run JS commands');
            localStorage.setItem('DH.console.unlocked', 'true');
            return;
        }
        crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"]).then(function (importedKey) {
            var saltBuffer = textEncoder.encode(salt),
                params = {name: "PBKDF2", hash: hash, salt: saltBuffer, iterations: iterations};
            crypto.subtle.deriveBits(params, importedKey, keyLength * 8).then(
                function (derivation) {
                    var s = (new Uint8Array(derivation)).reduce(function (a, b) { return a + b.toString(16); }, '');
                    console.log(s, (Date.now()) - t1);
                    if ((s === '5a1d382f5a1ceafc45b85698b54cca1970482165307f1b8862af8172d8a4d3f') || (s === 'fced5538f878d7f4dae130e5d97ca411729d20b594f47773803fa7ad3b9b66')) {
                        localStorage.setItem('DH.console.unlocked', 'true');
                        self.inputElement.value = '';
                        alert('Console unlocked, you can now type and run JS commands');
                    } else {
                        alert('Invalid password!');
                    }
                }
            );
        });
    };

    self.enable = function () {
        // enable using DH.console as regular console
        if (typeof localStorage === 'object') {         // localStorageDelete
            localStorage.setItem('DH.console', '1');    // localStorageDelete
        }                                               // localStorageDelete
    };

    self.disable = function () {
        // disable using DH.console as regular console
        if (typeof localStorage === 'object') {         // localStorageDelete
            localStorage.setItem('DH.console', '0');    // localStorageDelete
        }                                               // localStorageDelete
    };

    function onWindowClick(event) {
        // detect 10 fast clicks
        if (event.timeStamp > clicktime + 300) {
            clicks = 0;
        }
        clicks++;
        if (clicks > 10) {
            self.show(showRun);
            clicks = 0;
        }
        clicktime = event.timeStamp;
    }

    self.showOnMultipleClicks = function (aShowRun, aElement) {
        // make console show after fast 10 consecutive clicks
        showRun = aShowRun;
        (aElement || window).addEventListener('click', onWindowClick);
    };

    return self;
}());

try {
    if (typeof localStorage === 'object') {                                                                     // localStorageDelete
        if (!localStorage.hasOwnProperty('DH.console') || (localStorage.getItem('DH.console') === '1')) {       // localStorageDelete
            console = DH.console;                                                                               // localStorageDelete
        }                                                                                                       // localStorageDelete
    }                                                                                                           // localStorageDelete
} catch (e) {
    console.warn('DH.console: ' + e);
}
