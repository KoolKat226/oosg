// Show Android.consoleData() using DH.console.show()
// require: none
"use strict";
// globals: document, window, Android, localStorage, TextEncoder, crypto, Uint8Array

var DH = window.DH || {};

DH.console = (function () {
    var self = {}, clicks = 0, clicktime = 0, lastMessage, old_data = [];
    self.limit = 200;
    self.buffer = [];
    self.important = [];
    self.autoRefresh = true;

    self.clear = function () {
        self.buffer = [];
        self.important = [];
        old_data = [];
    };

    self.str = function (aObject) {
        // Convert any arguments to string, objects at most 1 level deep, usage: console.log('foo', DH.console.str(window))
        try {
            // on desktop return object/s
            if (window.hasOwnProperty('Android') && window.Android.isReal && !window.Android.isReal()) {
                if (arguments.length === 1) {
                    return aObject;
                }
                return arguments;
            }
            // on mobile stringify it to level1
            var i, a = [], k, b = [], s;
            for (i = 0; i < arguments.length; i++) {
                if (arguments[i] === undefined) {
                    a.push('undefined');
                    continue;
                }
                if (typeof arguments[i] === 'function') {
                    a.push('function');
                    continue;
                }
                if (Array.isArray(arguments[i])) {
                    a.push('[' + arguments[i] + ' items]');
                    continue;
                }
                if (typeof arguments[i] === 'object') {
                    b = [];
                    for (k in arguments[i]) {
                        if (arguments[i].hasOwnProperty(k)) {
                            if (typeof arguments[i][k] === 'function') {
                                s = 'F()';
                            } else if (Array.isArray(arguments[i][k])) {
                                s = '[?]';
                            } else if (typeof arguments[i][k] === 'object') {
                                s = '{?}';
                            } else {
                                s = arguments[i][k] && arguments[i][k].toString();
                            }
                            b.push(k + ':' + s);
                        }
                    }
                    a.push('{' + b.join(' ') + '}');
                    continue;
                }
                a.push(arguments[i].toString());
            }
            return a.join(', ');
        } catch (e) {
            return 'DH.console.str(?) ' + e;
        }
    };

    function renderOne(aParent, aTime, aKind, aFile, aMessage, aOriginal) {
        var div, message, file, hidden,
            color = {
                "PAGE": "fuchsia",
                "LOG": "black",
                "INFO": "blue",
                "WARN": "orange",
                "WARNING": "orange",
                "ERROR": "red",
                "DEBUG": "green",
                "EXTRA": "lime"
            };
        // div
        div = document.createElement('div');
        aParent.appendChild(div);
        // floating file
        file = document.createElement('div');
        file.textContent = aFile;
        file.style.float = 'right';
        file.style.color = 'gray';
        file.style.fontSize = 'xx-small';
        file.title = aTime;
        div.appendChild(file);
        // message
        message = document.createElement('div');
        message.textContent = /*o.time.substr(-5) + '> ' + */aMessage;
        message.style.color = color[aKind] || 'red';
        message.style.paddingBottom = '0.5ex';
        message.style.borderTop = '1px solid #00000011';
        div.appendChild(message);
        // hidden
        hidden = document.createElement('div');
        hidden.textContent = aOriginal;
        hidden.style.color = 'gray';
        hidden.style.display = 'none';
        hidden.style.paddingBottom = '0.5ex';
        div.appendChild(hidden);
        message.onclick = function () {
            hidden.style.display = 'block';
            file.style.display = 'none';
        };
        lastMessage = message;
        return {
            div: div,
            dile: file,
            message: message,
            hidden: hidden
        };
    }

    function render(aMessages, aImportant) {
        try {
            var lines = Android.consoleData().split('\n'), i, par, o, rendered = false;
            for (i = 0; i < lines.length; i++) {
                par = lines[i].split(' ');
                if (par.length < 3) {
                    continue;
                }
                o = {
                    time: par[0].replace(/\>$/, ''),
                    kind: par[1].replace(/\>$/, ''),
                    file: par[2].replace(/\:$/, '').replace('file:///android_asset/', '').replace('(', ':').replace(')', ''),
                    message: lines[i].substr(par[0].length + 1 + par[1].length + 1 + par[2].length + 1)
                };
                old_data.push(o);
                if (o.kind !== 'LOG' && o.kind !== 'PAGE') {
                    renderOne(aImportant, o.time, o.kind, o.file, o.message, lines[i]);
                }
                renderOne(aMessages, o.time, o.kind, o.file, o.message, lines[i]);
                rendered = true;
            }
            if (lastMessage && rendered) {
                lastMessage.scrollIntoViewIfNeeded();
            }
        } catch (e) {
            console.error('console2 render error ' + e);
            if (self.output) {
                self.output.textContent = e;
            }
        }
    }
    self.old_data = old_data;

    self.show = function () {
        var div = document.createElement('div'), select, option, bm, i, k, nav, interval,
            line, s, j, a, clear, close, inp, run, bookmarks_button, om, output, important, messages, color = {
            "log": "black",
            "info": "blue",
            "warn": "orange",
            "error": "red",
            "debug": "green",
            "extra": "lime"
        };

        function onClose() {
            div.parentElement.removeChild(div);
            window.clearInterval(interval);
        }

        div.style.position = 'fixed';
        div.style.left = 0;
        div.style.top = 0;
        div.style.right = 0;
        div.style.bottom = 0;
        div.style.zIndex = 999107;
        div.style.color = 'black';
        div.style.backgroundColor = 'white';
        div.style.boxSizing = 'border-box';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.fontFamily = 'sans-serif';
        div.style.lineHeight = '100%';

        // important
        important = document.createElement('div');
        important.style.backgroundColor = '#ffeeee';
        important.style.borderBottom = '1px solid red';
        important.style.maxHeight = '80vh';
        important.style.overflowY = 'scroll';
        important.onclick = function () {
            important.textContent = '';
        };
        div.appendChild(important);

        // output+messages
        om = document.createElement('div');
        om.style.flex = 1;
        om.style.overflowY = 'scroll';
        div.appendChild(om);

        // output
        output = document.createElement('div');
        output.style.whiteSpace = 'pre-wrap';
        output.style.wordBreak = 'break-word';
        output.style.maxHeight = '70vh';
        output.style.overflowY = 'scroll';
        div.appendChild(output);
        self.output = output;

        // nav with buttons
        nav = document.createElement('nav');
        nav.style.display = 'flex';
        div.appendChild(nav);

        // clear
        clear = document.createElement('button');
        clear.textContent = 'Clr';
        clear.style.minHeight = '1cm';
        clear.style.minWidth = '1cm';
        clear.style.color = 'black';
        clear.addEventListener('click', function () {
            if (inp.value !== '') {
                inp.value = '';
                inp.focus();
                return;
            }
            self.important = [];
            self.buffer = [];
            old_data = [];
            inp.value = '';
            messages.textContent = '';
            output.textContent = '';
            important.textContent = '';
            //onClose();
        });
        nav.appendChild(clear);

        // bookmarks combo
        self.bookmarks = self.bookmarks || {};
        self.bookmarks['Storage.debug()'] = 'Storage.debug()';
        self.bookmarks['localStorage keys'] = 'Object.keys(localStorage).join(", ")';
        self.bookmarks['localStorage.clear()'] = 'localStorage.clear()';
        self.bookmarks['Reload'] = 'Android.reload()';
        self.bookmarks['android.html'] = 'Android.loadUrl("file:///android_asset/android.html")';
        self.bookmarks['Console auto refresh'] = 'DH.console.autoRefresh = !DH.console.autoRefresh';
        if (self.bookmarks) {
            bookmarks_button = document.createElement('button');
            bookmarks_button.style.minHeight = '1cm';
            bookmarks_button.style.minWidth = '1cm';
            bookmarks_button.textContent = '☰';
            bookmarks_button.style.position = 'relative';
            nav.appendChild(bookmarks_button);

            select = document.createElement('select');
            select.style.position = 'absolute';
            select.style.left = 0;
            select.style.top = 0;
            select.style.width = '0.9cm';
            select.style.maxWidth = '0.9cm';
            select.style.height = '0.9cm';
            select.style.opacity = 0;
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
            bookmarks_button.appendChild(select);
        }

        // js input
        inp = document.createElement('input');
        inp.placeholder = 'JS code';
        inp.style.flex = '10';
        inp.style.minHeight = '1cm';
        inp.style.border = 'none';
        inp.style.width = '1cm';
        inp.style.color = 'black';
        inp.style.backgroundColor = 'silver';
        if (!window.hasOwnProperty('FuriganaBrowser') && window.hasOwnProperty('localStorage') && localStorage.getItem('DH.console.unlocked') !== 'true') {
            inp.style.backgroundColor = 'pink';
        }
        self.inputElement = inp;
        nav.appendChild(inp);

        // run
        run = document.createElement('button');
        run.textContent = 'Run';
        run.style.minHeight = '1cm';
        run.style.color = 'black';
        //run.style.color = 'black';
        run.addEventListener('click', function () {
            var cmd = inp.value, //prompt('Code', '');
                ev = 'ev';
            if (!window.hasOwnProperty('FuriganaBrowser') && window.hasOwnProperty('localStorage') && localStorage.getItem('DH.console.unlocked') !== 'true') {
                self.unlock(cmd);
                return;
            }
            if (cmd) {
                try {
                    if (cmd.substr(0, 1) === '#') {
                        output.innerHTML = window[ev + 'al'](cmd.substr(1));
                    } else {
                        output.textContent = window[ev + 'al'](cmd);
                    }
                    output.style.border = '1px solid blue';
                    inp.focus();
                } catch (e) {
                    output.textContent = e;
                    output.style.border = '1px solid red';
                }
                if (lastMessage) {
                    lastMessage.scrollIntoViewIfNeeded();
                }
            }
        });
        nav.appendChild(run);

        // close
        close = document.createElement('button');
        close.textContent = '❌';
        close.style.minHeight = '1cm';
        close.style.minWidth = '1cm';
        close.style.color = 'black';
        close.addEventListener('click', onClose);
        nav.appendChild(close);

        // messages
        messages = document.createElement('div');
        messages.style.color = 'black';
        messages.style.backgroundColor = 'white';
        om.appendChild(messages);

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
            console.log('zzz');
        }
        document.body.appendChild(div);

        // messages from previous shows
        for (i = 0; i < old_data.length; i++) {
            a = renderOne(messages, old_data[i].time, old_data[i].kind, old_data[i].file, old_data[i].message, '???');
            a.div.style.opacity = 0.5;
        }

        render(messages, important);
        interval = window.setInterval(function () {
            if (self.autoRefresh) {
                render(messages, important);
            }
        }, 50);
        return div;
    };

    self.unlock = function (aPassword) {
        if (!window.hasOwnProperty('crypto')) {
            alert('Console unlocked, you can now type and run JS commands');
            localStorage.setItem('DH.console.unlocked', 'true');
            return;
        }
        var password = aPassword.trim(),
            t1 = Date.now(),
            hash = 'SHA-256',
            salt = '10ae8165724b427a9ad6aa4a9c784c527ece1280',
            iterations = 999000,
            keyLength = 32,
            textEncoder = new TextEncoder("utf-8"),
            passwordBuffer = textEncoder.encode(password);
        crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"]).then(function (importedKey) {
            var saltBuffer = textEncoder.encode(salt),
                params = {name: "PBKDF2", hash: hash, salt: saltBuffer, iterations: iterations};
            crypto.subtle.deriveBits(params, importedKey, keyLength * 8).then(
                function (derivation) {
                    var s = (new Uint8Array(derivation)).reduce(function (a, b) { return a + b.toString(16); }, ''); // typed arrays cause GC lag
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

    function onWindowClick(event) {
        // detect 10 fast clicks
        if (event.timeStamp > clicktime + 300) {
            clicks = 0;
        }
        clicks++;
        if (clicks > 10) {
            self.show();
            clicks = 0;
        }
        clicktime = event.timeStamp;
    }

    self.showOnMultipleClicks = function (aShowRun, aElement) {
        // make console show after fast 10 consecutive clicks
        self.ignored = aShowRun;
        (aElement || window).addEventListener('click', onWindowClick);
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

    return self;
}());

