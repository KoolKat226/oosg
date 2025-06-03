// Commands executed from map events
"use strict";
// globals: document, window, setTimeout, Android

var GT = GT || {};

GT.cmds = {
    // Custom commands
    "warn": function (aCharacter, aCmd, aEndCallback) {
        // Show console warning
        // [{ "warn": "some message" }, ...]
        var current = aCmd.shift();
        console.warn('#warn', current.warn);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }
};

GT.cmdEnd = [];

GT.cmdBreak = false;

GT.cmd = function (aCharacter, aCmd, aEndCallback) {
    // Commands executed from map events
    //console.log('GT.cmd', aCharacter.name, 'aCmd', aCmd, 'end', aEndCallback);

    if (!aCharacter.acceptEvents) {
        console.error("impossible");
    }

    aCmd = typeof aCmd === 'string' ? JSON.parse(aCmd) : aCmd;

    var current, command, value, place, c;

    if (aCmd.length <= 0) {
        if (GT.cmdEnd.length > 0) {
            c = GT.cmdEnd.pop();
            GT.cmd(aCharacter, c, aEndCallback);
        }
        if (aEndCallback) {
            aEndCallback(aCharacter);
        }
        return;
    }

    current = aCmd.shift();

    // convert string command to {command:command}
    if (typeof current === 'string') {
        c = {};
        c[current] = 1;
        current = c;
    }

    command = Object.keys(current)[0];
    value = current[command];

    // custom commands first
    if (GT.cmds.hasOwnProperty(command)) {
        aCmd.unshift(current);
        return GT.cmds[command](aCharacter, aCmd, aEndCallback);
    }

    // {"break": "message"}
    if (command === 'break') {
        GT.cmdBreak = true;
        console.warn('break', value);
        return;
    }

    // {"goto": "stairs", "map": "jail2"}
    if (command === 'goto') {
        place = GT.places.byName[(current.map || aCharacter.map) + ' ' + value];
        if (place) {
            aCharacter.teleport(place.map, place.x, place.y);
            return GT.cmd(aCharacter, aCmd, aEndCallback);
        }
        console.warn('No such place: ' + value);
    }
    // {"gotoxy": [7, 2], "map": "quarry"}
    if (command === 'gotoxy') {
        aCharacter.teleport(current.map || aCharacter.map, value[0], value[1]);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"walkxy": [10, 20]}
    if (command === 'walkxy') {
        aCharacter.goto(value[0], value[1]);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"walk": "left"}
    if (command === 'walk') {
        switch (value) {
        case "left":
            aCharacter.gotoLeft();
            break;
        case "right":
            aCharacter.gotoRight();
            break;
        case "up":
            aCharacter.gotoUp();
            break;
        case "down":
            aCharacter.gotoDown();
            break;
        }
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"turn": "left"}
    if (command === 'turn') {
        aCharacter.turn(value);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"base": "boy"}
    if (command === 'base') {
        aCharacter.base(value);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"log": "Hello world!"}
    if (command === 'log') {
        console.log('#log', value);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"alert": "Hello world!"}
    if (command === 'alert') {
        alert(value);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"gallery": "image/mountain-lake.jpg", "title": "Mountain lake", "author": "Dušan Halický"}
    if (command === 'gallery') {
        if (aCharacter.name === 'Player') {
            GT.gallery(value, current.title, current.author, function () {
                return GT.cmd(aCharacter, aCmd, aEndCallback);
            }, false);
        }
        console.log('gallery', aCharacter && aCharacter.name, aCmd);
        return;
    }

    // {"toast": "Hello world!"}
    if (command === 'toast' || command === 'caption') {
        Android.showToast(value);
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    // {"looking": "left"}
    if (command === 'looking') {
        if (aCharacter.dir === value) {
            return GT.cmd(aCharacter, aCmd, aEndCallback);
        }
        return;
    }

    // {"delay": 500}
    if (command === 'delay') {
        setTimeout(function () {
            return GT.cmd(aCharacter, aCmd, aEndCallback);
        }, value);
        return;
    }

    if (command === 'editor') {
        if (GT.editor) {
            if (!value) {
                GT.editor.current = '';
                if (current.toast) {
                    Android.showToast(current.toast);
                }
            }
        }
        return GT.cmd(aCharacter, aCmd, aEndCallback);
    }

    console.error('Unknown command', current, aCmd);
};
