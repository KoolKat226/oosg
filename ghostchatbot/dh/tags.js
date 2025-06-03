// Input with string tags
// require: none
"use strict";
// globals: document

var DH = window.DH || {};

DH.tags = function (aElementOrId, aInitialTags, aKnownTags) {
    // Tag editor
    var self = {},
        element = typeof aElementOrId === 'string' ? document.getElementById(aElementOrId) : aElementOrId,
        ul = document.createElement('ul'),
        inputLi = document.createElement('li'),
        input = document.createElement('input');
    element.appendChild(ul);
    inputLi.appendChild(input);
    inputLi.className = 'editor';
    ul.appendChild(inputLi);
    self.input = input;

    function removeTag(event) {
        // Remove tag
        var li = event.target.parentElement;
        li.parentElement.removeChild(li);
    }

    self.add = function (aTag) {
        // Add single tag
        var li, span, close;
        li = document.createElement('li');
        span = document.createElement('span');
        span.textContent = aTag;
        li.appendChild(span);
        close = document.createElement('button');
        close.textContent = 'X';
        close.onclick = removeTag;
        li.appendChild(close);
        if (aKnownTags && aKnownTags.indexOf(aTag) >= 0) {
            li.classList.add('known');
        }
        inputLi.insertAdjacentElement('beforeBegin', li);
    };

    function addTagsFromInput() {
        // Add tags from input
        var tags = input.value.split(/[\ \,\.]+/); //.split(//); //match(/[\w\'\-]+/g); // '
        if (tags) {
            tags.map(function (s) {
                if (!s.match(/[\,\.\ ]+/) && s.trim() !== '') {
                    self.add(s.trim());
                }
            });
        }
        input.value = '';
    }

    function onKeyDown(event) {
        // As user type add tags
        var c = event.key;
        if ([',', '.', ' ', 'Enter', 'Tab'].indexOf(c) >= 0) {
            addTagsFromInput();
            event.preventDefault();
        }
    }

    function onInput(event) {
        // Handle datalist input
        if (!event.data && !event.inputType) {
            addTagsFromInput();
        }
    }

    function onBlur(event) {
        // Add tags when user leaves
        if (event.target.value.trim() !== '') {
            addTagsFromInput();
        }
    }

    input.addEventListener('keydown', onKeyDown, true);
    input.addEventListener('input', onInput, true);
    input.addEventListener('blur', onBlur, true);

    self.addTags = function (aTags) {
        // Add multiple tags
        var i;
        for (i = 0; i < aTags.length; i++) {
            self.add(aTags[i]);
        }
    };
    if (aInitialTags) {
        self.addTags(aInitialTags);
    }
    if (aKnownTags) {
        (function () {
            var i, option, datalist;
            datalist = document.createElement('datalist');
            datalist.id = 'dhtagsdatalist' + Date.now();
            for (i = 0; i < aKnownTags.length; i++) {
                option = document.createElement('option');
                option.value = aKnownTags[i];
                datalist.appendChild(option);
            }
            element.appendChild(datalist);
            input.setAttribute('list', datalist.id);
        }());
    }

    self.tags = function () {
        // Return all tags
        var li = ul.getElementsByTagName('li'), i, a = [], span;
        for (i = 0; i < li.length; i++) {
            span = li[i].getElementsByTagName('span');
            if (span.length > 0) {
                a.push(span[0].textContent);
            }
        }
        return a;
    };

    self.unique = function () {
        // Return unique tags
        var i, o = {}, a = self.tags();
        for (i = 0; i < a.length; i++) {
            o[a[i]] = 1;
        }
        return Object.keys(o);
    };

    self.clear = function () {
        // Clear all tags
        var li = ul.getElementsByTagName('li'), i;
        for (i = li.length - 1; i >= 0; i--) {
            if (!li[i].classList.contains('editor')) {
                li[i].parentElement.removeChild(li[i]);
            }
        }
    };

    return self;
};

