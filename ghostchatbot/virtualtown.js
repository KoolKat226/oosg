// Main window
"use strict";
// globals: document, GT, requestAnimationFrame, window, DH, setInterval, setTimeout, Android, GHOST

//GT.walls = true;

var VT = VT || {};
VT.gold = DH.storage.readNumber('VT.gold', 0);

// duplicate tiles for single tile characters
GT.characters.singleTileCharacter('invisible');

function purge() {
    // Erase storage and reload app
    DH.storage.eraseAll();
    Android.reload();
}

function walls() {
    // Turn walls on/off
    GT.walls = !GT.walls;
    GT.characters.player.wallhack(!GT.walls);
}

VT.inventory = new GT.Inventory('Player', {gold: 1000});

VT.onEditor = function () {
    /*
    if (VT.ed) {
        VT.ed.show(VT.inventory);
        return;
    }
    VT.ed =
    */
    if (GT && GT.player && GT.player.map === "jail2") {
        Android.showToast('Map editor is not allowed in jail!');
        return;
    }
    if (GT.editor) {
        GT.editor.show(VT.inventory);
    }
/*
    VT.ed = GT.editor(GT.ed = GT.editor(GT.fakeInventory()undefined, function (aTile) {
        var g = GT.maps[GT.background.map].ground[GT.player.y][GT.player.x].slice();
        g.push(aTile);
        GT.map.change(GT.player.map, GT.player.x, GT.player.y, g, false);
    });
*/
};

GT.cmds.newspaper = function (aCharacter, aCmd, aEndCallback) {
    // Show newspaper
    var current = aCmd.shift();
    console.log('newspaper', aCharacter.name, current, typeof aEndCallback);
    if (aCharacter.name === 'Player') {
        DH.splash('Magic library', ['OK'], '#fec', 'Look at the shelves to learn about various transmutation magic spells. Or you can type magic formula, e.g. #sleep or #dead.', console.log, 'auto', 'auto');
    }
};

GT.cmds.bank = function (aCharacter, aCmd, aEndCallback) {
    // Show bank balance
    if (aCharacter.name !== GT.player.name) {
        console.log('NPC bank ignored');
        return;
    }
    console.log('bank', aCharacter, aCmd, typeof aEndCallback);
    var current = aCmd.shift();
    console.log('bank', current);
    Android.showToast('Bank account balance: $' + VT.gold);
};

GT.cmds.exit = function (aCharacter) {
    // Leave game
    if (aCharacter.name !== GT.player.name) {
        console.log('NPC exit ignored');
        return;
    }
    DH.splash('Do you really want to leave this game?', ["No", "Yes"], "pink", undefined, function (aButton) {
        if (aButton === 'Yes') {
            Android.loadUrl('file:///android_asset/android.html');
        }
    });
};

GT.cmds.shop = function (aCharacter, aCmd, aEndCallback) {
    // Show bank balance
    if (aCharacter.name !== GT.player.name) {
        console.log('NPC shop ignored');
        return;
    }
    console.log('shop', typeof aCharacter, aCmd, typeof aEndCallback);
    var s, current = aCmd.shift();
    switch (current.shop) {
    case "Steve's groceries":
        GT.shop("Steve's groceries", GT.goods, VT.inventory);
        break;
    case "Black market":
        s = GT.shop('Black market', GT.allGoods(), VT.inventory, 2);
        s.h1.classList.add('compact');
        s.table.classList.add('compact');
        break;
    default:
        console.warn('unknown shop', current, "Steve's groceries", current === "Steve's groceries");
    }
};

GT.cmds.magic = function (aCharacter, aCmd, aEndCallback) {
    // Simple magic turning base tile (with confirmation dialog)
    var current = aCmd.shift();
    console.log('magic', aCharacter.name, current);
    if (aCharacter.name === 'Player') {
        DH.splash('Magic', ['No', 'Yes'], 'skyblue', 'Do you want to turn into ' + current.magic + '?', function (aButton) {
            if (aButton === 'Yes') {
                aCharacter.base(current.magic);
            }
            if (aEndCallback) {
                aEndCallback(aCharacter, aCmd);
            }
        }, 'auto', 'auto');
    } else {
        aCharacter.base(current.magic);
    }
};

VT.consoleCommands = function (aCommand) {
    // Parse #commands
    var par = aCommand.split(' '), place, a, b;
    if (par[0] === '#go') {
        place = GT.places.anyPlaceOrNpc(par[1].toLowerCase());
        if (!place) {
            place = GT.places.anyPlaceOrNpc('ga_' + par[1].toLowerCase());
        }
        console.log('place', place);
        GT.player.teleport(place.map, place.x, place.y);
        return;
    }
    if (par[0] === '#sleep') {
        GT.player.turn('sleep');
        return;
    }
    if (par[0] === '#dead') {
        GT.player.turn('dead');
        return;
    }
    if (par[0] === '#rename') {
        GHOST.changeParam('$nick;', par[1], par[2]);
        return;
    }
    if (par[0] === '#walls') {
        walls();
        return;
    }
    if (par[0] === '#purge') {
        purge();
        return;
    }
    if (par[0] === '#editor') {
        document.getElementById('editor').style.display = 'block';
        return;
    }

    function next() {
        document.getElementById('question').focus();
        var s = a.shift();
        b.textContent = a.length > 0 ? a[0] : 'END';
        VT.consoleCommands('#go ' + s);
        if (!GT.player.gotoDown()) {
            if (!GT.player.gotoRight()) {
                if (!GT.player.gotoLeft()) {
                    GT.player.gotoUp();
                }
            }
        }
        if (a.length === 0) {
            b.parentElement.removeChild(b);
            return;
        }
    }

    if (par[0] === '#release') {
        a = ['ga_bat', 'ga_spider', 'ga_craig', 'ga_curator', 'ga_mayor', 'ga_shopkeeper', 'ga_shopkeeper2', 'ga_banker', 'ga_ken', 'ga_kim', 'ga_jane', 'ga_john', 'ga_founder_skeleton', 'ga_frog', 'ga_firefighter', 'ga_fisherman', 'ga_surveyor', 'ga_warden', 'ga_founder_ghost', 'ga_prisoner', 'library'];
        b = document.createElement('button');
        b.style.position = 'fixed';
        b.style.left = 0;
        b.style.top = 0;
        b.style.minWidth = '1.3cm';
        b.style.minHeight = '1.3cm';
        b.onclick = next;
        document.body.appendChild(b);
        next();
        return;
    }
    if (par[0] === '#console') {
        DH.console.show(true);
        return;
    }
    if (par[0] === '#console5') {
        setTimeout(function () {
            DH.console.show(true);
        }, 5000);
        return;
    }
    console.warn('Unknown command: ' + aCommand, aCommand);
};

VT.character = function (aNameOrJob) {
    // find character by it's name or job
    aNameOrJob = aNameOrJob.toLowerCase();
    // directly
    if (GT.characters.names.hasOwnProperty(aNameOrJob)) {
        return GT.characters.names[aNameOrJob];
    }
    if (GT.characters.names.hasOwnProperty('ga_' + aNameOrJob)) {
        return GT.characters.names['ga_' + aNameOrJob];
    }
    // by ghost character names
    var lookup = {
        'me': 'Player',
        'player': 'Player',
        'mia': 'ga_mayor',
        'steve': 'ga_shopkeeper',
        'dave': 'ga_shopkeeper2',
        'dealer': 'ga_shopkeeper2',
        'fred': 'ga_fisherman',
        'frank': 'ga_firefighter',
        'cindy': 'ga_curator',
        'skeleton': 'ga_founder_skeleton',
        'ghost': 'ga_founder_ghost',
        'sue': 'ga_surveyor',
        'bob': 'ga_banker',
        'slime': 'ga_banker',
        'peter': 'ga_prisoner',
        'guard': 'ga_warden',
        'manager': 'ga_ken',
        'wife': 'ga_kim',
        'art critic': 'ga_craig',
        'critic': 'ga_craig',
        'artist': 'ga_jane',
        'programmer': 'ga_john'
    };
    if (lookup.hasOwnProperty(aNameOrJob)) {
        return GT.characters.names[lookup[aNameOrJob]];
    }
};

VT.onSpecialCommand = function (aQuestion, aNearest) {
    // special commands
    window.nr = aNearest;
    var i,
        p,
        a,
        b,
        tokens,
        n = GHOST.normalize(aQuestion).join(' '),
        follow = {
            'ok follow me': 1,
            'follow': 1,
            'follow me': 1,
            'everyone follow me': 1,
            'do follow me': 1,
            'follow me then': 1,
            'follow me now': 1,
            'follow . me': 1,
            'follow me ok': 1,
            'come then': 1,
            'ok come follow me': 1,
            'follow me guys': 1,
            'ok let us go then': 1,
            'ok let us go': 1,
            'oh let us go then': 1,
            'let us go': 1,
            "follow me and my buddy": 1,
            'let go': 1,
            'just follow me ok': 1,
            "just follow me !": 1,
            "but come follow me": 1,
            "can we walk together": 1,
            "we can come follow me": 1,
            "hey would you like to come with me for a walk": 1,
            "hey would you like to come with me": 1,
            "would you like to come with me for a walk": 1,
            "$nick; would you like to come with me": 1,
            "com with me please": 1,
            "don't come with me": 1,
            'let us leave': 1,
            'let us go then': 1,
            'want to follow me': 1,
            'let us go now': 1,
            'let us walk': 1,
            'then let us go': 1,
            'come': 1,
            'follow me again': 1,
            'come closer': 1,
            'come here': 1,
            'hi come here': 1,
            'can you follow me': 1,
            'i want you follow me': 1,
            'i want you to follow me': 1,
            'can not you follow me': 1,
            'come with me': 1,
            'oh really then come with me': 1,
            'come with me please': 1
        },
        immovable = {
            'ga_prisoner': 1,
            'ga_warden': 1,
            'ga_surveyor': 1,
            'ga_shopkeeper': 1,
            'ga_shopkeeper2': 1,
            'ga_banker': 1,
            'ga_kim': 1
        },
        stop = {
            'stay': 1,
            'stay here': 1,
            'stay there': 1,
            'do stay here': 1,
            'please stay here': 1,
            'stop': 1,
            'stand here': 1,
            'stand here do not follow me': 1,
            'can you stop': 1,
            'can you stop following me': 1,
            'you can go now': 1,
            'do not follow me please': 1,
            'do not follow me': 1,
            'stop following': 1,
            'stop following me': 1,
            'leave me alone': 1,
            'don\'t follow me': 1
        },
        name,
        movable = aNearest && !immovable.hasOwnProperty(aNearest.name);
    // remove exclamation mark
    n = n.replace(/ [\!\?]+$/, '');
    // remove opening and ending phrases
    n = n.replace(/^please /, '').replace(/ please$/, '');
    n = n.replace(/^hmm /, '').replace(/ hmm$/, '');
    // a follow b
    tokens = n.split(' ');
    if (tokens.length === 3 && tokens[1] === 'follow') {
        a = VT.character(tokens[0]);
        b = VT.character(tokens[2]);
        console.log('ab', a, b);
        if (a && b && a.name !== b.name) {
            a.follow = b;
            return true;
        }
    }
    // remove character name
    if (aNearest) {
        n = n.split(' ');
        name = GHOST.character[aNearest.name].params['$nick;'].toLowerCase();
        i = n.indexOf(name);
        if (i >= 0) {
            n.splice(i, 1);
        }
        n = n.join(' ');
    }
    // follow
    if (aNearest && follow.hasOwnProperty(n) && movable) {
        GT.characters.names[aNearest.name].follow = GT.player;
        return true;
    }
    // look
    if (aNearest) {
        if (n === 'look up' || n === 'turn up' || n === 'bend over') {
            aNearest.turn('up');
            return true;
        }
        if (n === 'walk up' || n === 'step up' || n === 'move up') {
            aNearest.walkPath('uU');
            return true;
        }
        if (n === 'walk down' || n === 'step down' || n === 'move down') {
            aNearest.walkPath('dD');
            return true;
        }
        if (n === 'walk left' || n === 'step left' || n === 'move left') {
            aNearest.walkPath('lL');
            return true;
        }
        if (n === 'walk right' || n === 'step right' || n === 'move right') {
            aNearest.walkPath('rR');
            return true;
        }
        if (n === 'look down' || n === 'turn down' || n === 'wake up' || n === 'stand up') {
            aNearest.turn('down');
            return true;
        }
        if (n === 'can you turn around' || n === 'turn around' || n === 'look away' || n === 'do not look' || n === 'don\'t look') {
            aNearest.walkPath('>p>');
            return true;
        }
        if (n === 'walk forward' || n === 'walk' || n === 'move forward' || n === 'step forward') {
            aNearest.walkPath('F');
            return true;
        }
        if (n === 'go back' || n === 'back' || n === 'step back' || n === 'move back') {
            aNearest.walkPath('B');
            return true;
        }
        if (n === 'look left' || n === 'turn left') {
            aNearest.turn('left');
            return true;
        }
        if (n === 'look right' || n === 'turn right') {
            aNearest.turn('right');
            return true;
        }
        if (n === 'sleep' || n === 'go sleep' || n === 'sleep here' || n === 'humps' || n === 'sleep again' || n === 'lay down' || n === 'take a nap' || n === 'go and take a nap' || n === 'zz') {
            aNearest.turn('sleep');
            return true;
        }
        if (n === 'die' || n === 'go die' || n === 'kills you' || n === 'hide' || n === 'slaps') {
            aNearest.turn('dead');
            return true;
        }
        if (n === 'magic' || n === 'sparkle' || n === 'kiss' || n === 'kisses') {
            GT.effects.magic(aNearest);
            return true;
        }
        if (n === 'dance' || n === 'let\'s dance' || n === 'start dancing' || n === 'can you dance') {
            aNearest.walkPath('>2p>2p>2p>2>2p>2p>2p>2', function () { GT.effects.magic(aNearest); }, function () { GT.effects.attack(aNearest); });
            return true;
        }
    }
    // stop following
    if (aNearest && stop.hasOwnProperty(n) && movable) {
        GT.characters.names[aNearest.name].follow = undefined;
        return true;
    }
    // go to place
    if (aNearest) {
        if (n.match(/^go to /) || n.match(/^go to the /)) {
            name = n.replace(/^go to the /, '').replace(/^go to /, '');
            // try looking by ghost names
            p = VT.character(name);
            console.warn('go to2 ', name, p);
            if (!p) {
                p = GT.places.anyPlaceOrNpc(name);
            }
            if (p && p.map === aNearest.map) {
                console.warn(p);
                aNearest.follow = undefined;
                aNearest.goto(p.x, p.y);
                aNearest.onStopWalkPath = function () {
                    aNearest.onStopWalkPath = undefined;
                    aNearest.spread();
                };
                return true;
            }
        }
    }

    return false;
};

VT.onKeyPressQuestion = function (event) {
    // User asks question when pressed enter in input
    var q = event.target.value.toString().trim(), q2,
        nearest,
        multichar,
        a;
    if (event.key === 'Enter' && q !== '') {

        if (q.charAt(0) === '#') {
            event.target.value = '';
            VT.consoleCommands(q);
            return;
        }

        nearest = GT.characters.nearest(GT.player, {boy: 1, girl: 1, slime: 1, bat: 1, spider: 1, rat: 1, frog: 1, skeleton: 1, ghost: 1}, 5, true);
        console.log('question', q, 'nearest', nearest && nearest.name);
        if (nearest) {

            if (VT.onSpecialCommand(q, nearest)) {
                // special
                a = {answer: 'SPECIAL'};
            } else {
                // ask
                multichar = GHOST.multichar(nearest.name);
                console.log('multichar', multichar, nearest.parents);
                q2 = GHOST.why.modify(nearest.name, q);
                a = GHOST.askChain(GHOST.multichar(nearest.name), q2);
                GHOST.why.lastAnswer[nearest.name] = a.answer;
                setTimeout(function () {
                    GT.bubblesCasual(nearest.name, [a.answer]);
                }, 500);
            }

            VT.report(q, a.answer, nearest.name, q);
        } else {
            VT.report(q, '', 'nobody', q);
        }
        GT.bubblesCasual('Player', [q]);
        event.target.value = '';
    }
};

VT.initTown = function () {
    // Initialize town
    GT.init(function () {
        // initialize canvas
        GT.canvas.init('background_canvas', 'character_canvas');

        // initialize on-screen touchpad
        GT.touchpad = DH.touchpad('icon/arrows130.png', undefined, true); // {img:{style:{}}};
        GT.touchpad.img.style.zIndex = 10;
        GT.touchpad.img.style.bottom = '2em';
        GT.touchpad.img.style.opacity = 0.7;
        // disable wasd
        GT.keyboard.touchpad = false;

        // hide touchpad on desktop
        if (!Android.isReal()) {
            GT.touchpad.hide();
            GT.touchpad.hide = function () { console.log('GT.touchpad.hide suppressed'); };
            GT.touchpad.show = function () { console.log('GT.touchpad.show suppressed'); };
        }

        // init

        // npc
        GT.map.npc('basement_ken', 'ga_spider');
        GT.map.npc('gallery2', 'ga_craig');
        GT.map.npc('ghosttown', 'ga_curator');
        GT.map.npc('ghosttown', 'ga_mayor');
        GT.map.npc('ghosttown', 'ga_shopkeeper');
        GT.map.npc('ghosttown', 'ga_shopkeeper2');
        GT.map.npc('ghosttown', 'ga_banker');
        GT.map.npc('ghosttown', 'ga_ken');
        GT.map.npc('ghosttown', 'ga_kim');
        GT.map.npc('ghosttown', 'ga_jane');
        GT.map.npc('ghosttown', 'ga_john');
        GT.map.npc('ghosttown', 'ga_founder_skeleton');
        GT.map.npc('ghosttown', 'ga_frog');
        GT.map.npc('ghosttown', 'ga_firefighter');
        GT.map.npc('ghosttown', 'ga_fisherman');
        GT.map.npc('ghosttown', 'ga_surveyor');
        GT.map.npc('ghosttown', 'ga_warden');
        GT.map.npc('tomb', 'ga_founder_ghost');
        GT.map.npc('jail2', 'ga_prisoner');
        GT.map.npc('quarry', 'ga_bat');

        // player
        GT.player = GT.character('Player', GT.playerOld.map, GT.playerOld.x, GT.playerOld.y, GT.playerOld.baseTile);
        GT.player.setPlayer();
        GT.background.autoclear = true;
        GT.background.load(GT.playerOld.map);
        GT.background.key = '';

        // player autosave
        setInterval(function () {
            if (GT.player.x !== GT.playerOld.x || GT.player.y !== GT.playerOld.y || GT.player.map !== GT.playerOld.map || GT.player.baseTile !== GT.playerOld.baseTile) {
                console.log('Autosave player position');
                GT.playerOld.x = GT.player.x;
                GT.playerOld.y = GT.player.y;
                GT.playerOld.map = GT.player.map;
                GT.playerOld.baseTile = GT.player.baseTile;
                DH.storage.writeObject('GT.playerOld', GT.playerOld);
            }
        }, 10000);

        // question
        document.getElementById('question').addEventListener('keypress', VT.onKeyPressQuestion, true);

        // rendering loop
        GT.loop();
    });
};

VT.chooseYourCharacter = function (aCallback) {
    // Let user choose character
    var sp = DH.splash('Virtual town', ['Boy', 'Girl'], '#8b6', function (aParent) {
        var p, boy, girl;

        p = document.createElement('p');
        p.textContent = 'Choose your character';

        boy = document.createElement('img');
        boy.style.width = '64px';
        boy.style.height = '64px';
        boy.style.imageRendering = 'pixelated';
        boy.src = 'icon/boy.png';
        boy.onclick = function () { sp.buttonsArray[0].click(); };

        girl = document.createElement('img');
        girl.style.width = '64px';
        girl.style.height = '64px';
        girl.style.imageRendering = 'pixelated';
        girl.src = 'icon/girl.png';
        girl.onclick = function () { sp.buttonsArray[1].click(); };

        aParent.appendChild(p);
        aParent.appendChild(boy);
        aParent.appendChild(girl);
        aParent.style.textAlign = 'center';

        p = document.createElement('p');
        p.textContent = 'In game use blue arrows to walk around and when you are near other characters type in the white input field at the bottom of the screen.';
        aParent.appendChild(p);
    }, function (aButton) {
        console.warn(aButton);
        GT.playerOld.baseTile = (aButton || 'boy').toLowerCase();
        DH.storage.writeString('GT.playerBase', GT.playerOld.baseTile);
        DH.storage.writeObject('GT.playerOld', GT.playerOld);
        if (GT.player) {
            GT.player.base(aButton.toLowerCase());
        }
        if (aCallback) {
            aCallback(aButton);
        }
    }, '40vh', 'auto');
    window.sp = sp;
};

// initialize window
window.addEventListener('DOMContentLoaded', function () {
    Android.isReal = function () {
        return true;
    };

    // load saved player
    GT.playerOld = DH.storage.readObject('GT.playerOld', {map: 'ghosttown', x: 53, y: 48, baseTile: ''});
    if (GT.playerOld.baseTile === '') {
        VT.chooseYourCharacter(VT.initTown);
    } else {
        VT.initTown();
    }

    DH.metrics.init('virtualtown', 201);
    DH.metrics.errorLogger(10);
    document.getElementById('editor').onclick = VT.onEditor;

});

