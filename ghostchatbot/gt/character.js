// Characters (npc, player)
"use strict";
// globals: document, window, setTimeout, setInterval, DH

var GT = GT || {};

GT.characters = (function () {
    // All characters
    var self = {};
    self.names = {};
    self.characters = [];
    self.player = undefined;
    self.frames = 0;
    self.defaults = {}; // Default health for bases
    self.occupied = false; // if true characters will be non-walkable

    self.clear = function () {
        // Clear all characters
        self.names = {};
        self.characters = [];
        self.player = undefined;
    };

    self.save = function () {
        // Save characters to local storage
        var i, a = [], o;
        for (i = 0; i < self.characters.length; i++) {
            o = self.characters[i].toData();
            o.player = self.player === self.characters[i];
            a.push(o);
        }
        DH.storage.writeObject('GT.characters.characters', a);
        return a;
    };

    self.load = function () {
        // Load characters from local storage
        var i, a = DH.storage.readObject('GT.characters.characters'), c;
        self.names = {};
        self.characters = [];
        self.player = '';
        for (i = 0; i < a.length; i++) {
            c = GT.character(a[i].name, a[i].map, a[i].x, a[i].y, a[i].baseTile);
            if (a[i].player) {
                self.player = c;
            }
            self.names[a[i].name] = c;
        }
    };

    self.update = function (aTime) {
        // Update all characters
        var i;
        if (self.player) {
            self.touchpad(self.player, aTime);
        }

        self.edge2invalid = false;
        for (i = 0; i < self.characters.length; i++) {
            self.characters[i].update(aTime);
        }
        if (self.edge2invalid) {
            self.edge2update();
        }
    };

    self.optimalRenderingOrder = function (aBaseOrder, aDebug) {
        // Sort characters from lower (spider, rat, crystal) to middle (humans, skeletons) to top (bat, ghost)
        self.characters.sort(function (a, b) {
            if ((a.health <= 0) && (b.health > 0)) {
                return -1;
            }
            if ((a.health > 0) && (b.health <= 0)) {
                return 1;
            }
            if (aBaseOrder[a.baseTile] < aBaseOrder[b.baseTile]) {
                return -1;
            }
            if (aBaseOrder[a.baseTile] > aBaseOrder[b.baseTile]) {
                return 1;
            }
            return 0;
        });
        if (aDebug) {
            var i;
            for (i = 0; i < self.characters.length; i++) {
                console.log(i, self.characters[i].baseTile, self.characters[i].health);
            }
        }
    };

    self.draw = function (aContext, aCx, aCy, aWidth, aHeight) {
        // Draw all characters (if something changed)
        var i, key, ch;
        // get current key
        key = [self.player.name + ' ' + GT.canvas.w + ' ' + GT.canvas.h];
        for (i = 0; i < self.characters.length; i++) {
            // only characters on current map
            ch = self.characters[i];
            if (ch.map === GT.background.map) {
                key.push(ch.name + ' ' + ch.tile + ' ' + ch.rx + ' ' + ch.ry + ' ' + ch.dir);
            }                               //base
        }
        key = key.join(',');
        // effects
        key += GT.effects.update();
        // did key changed?
        if (self.key !== key) {
            // clear
            aContext.clearRect(0, 0, aWidth, aHeight);
            // render all chars
            for (i = 0; i < self.characters.length; i++) {
                // only characters on current map
                ch = self.characters[i];
                if (ch.map === GT.background.map) {
                    ch.draw(aContext, self.player, aCx, aCy);
                }
            }
            // draw effects
            GT.effects.draw(aContext);
            // draw speech bubbles
            self.lastBubble = null;
            // player's bubble first
            if (GT.characters.player.bubble) {
                ch = GT.characters.player;
                self.lastBubble = GT.bubble(GT.canvas.charContext, ch.bubble, ch.clip.x + ch.clip.w / 2, ch.clip.y, 'white', self.lastBubble);
            }
            for (i = 0; i < self.characters.length; i++) {
                // only characters on current map
                ch = self.characters[i];
                if (ch !== GT.characters.player) {
                    if (ch.map === GT.background.map && ch.bubble) {
                        self.lastBubble = GT.bubble(GT.canvas.charContext, ch.bubble, ch.clip.x + ch.clip.w / 2, ch.clip.y, 'white', self.lastBubble);
                    }
                }
            }
            // remember key
            self.key = key;
            self.frames++;
        }
    };

    self.touchpad = function (aCharacter, aTime) {
        // Control character with touchpad
        var horizontal = Math.abs(GT.touchpad.x) > Math.abs(GT.touchpad.y),
            a = 0.1, // direction threshold
            b = 0.3; // movement threshold
        // change direction (without walking)
        if (horizontal) {
            if (GT.touchpad.x < -a) {
                aCharacter.turn('left');
            }
            if (GT.touchpad.x > a) {
                aCharacter.turn('right');
            }
        } else {
            if (GT.touchpad.y < -a) {
                aCharacter.turn('up');
            }
            if (GT.touchpad.y > a) {
                aCharacter.turn('down');
            }
        }
        if (horizontal) {
            // mostly horizontal movement
            if (GT.touchpad.x < -b) {
                aCharacter.gotoLeft();
            }
            if (GT.touchpad.x > b) {
                aCharacter.gotoRight();
            }
            if (GT.touchpad.y < -b) {
                aCharacter.gotoUp();
            }
            if (GT.touchpad.y > b) {
                aCharacter.gotoDown();
            }
        } else {
            // mostly vertical movement
            if (GT.touchpad.y < -b) {
                aCharacter.gotoUp();
            }
            if (GT.touchpad.y > b) {
                aCharacter.gotoDown();
            }
            if (GT.touchpad.x < -b) {
                aCharacter.gotoLeft();
            }
            if (GT.touchpad.x > b) {
                aCharacter.gotoRight();
            }
        }
        // update
        aCharacter.update(aTime);
    };

    self.uid = function () {
        // Generate random locally unique id
        var i = DH.storage.readNumber('GT.character.uid', 0);
        i++;
        DH.storage.writeNumber('GT.character.uid', i);
        return i;
    };

    self.singleTileCharacter = function (aBase) {
        // Create character tiles from single tile
        var b;
        b = GT.tiles[aBase + '-left'] || GT.tiles[aBase];
        GT.tiles[aBase + '-left'] = GT.tiles[aBase + '-left'] || b;
        GT.tiles[aBase + '-left-walk1'] = GT.tiles[aBase + '-left-walk1'] || b;
        GT.tiles[aBase + '-left-walk2'] = GT.tiles[aBase + '-left-walk2'] || b;
        b = GT.tiles[aBase + '-right'] || GT.tiles[aBase];
        GT.tiles[aBase + '-right'] = GT.tiles[aBase + '-right'] || b;
        GT.tiles[aBase + '-right-walk1'] = GT.tiles[aBase + '-right-walk1'] || b;
        GT.tiles[aBase + '-right-walk2'] = GT.tiles[aBase + '-right-walk2'] || b;
        b = GT.tiles[aBase + '-up'] || GT.tiles[aBase];
        GT.tiles[aBase + '-up'] = GT.tiles[aBase + '-up'] || b;
        GT.tiles[aBase + '-up-walk1'] = GT.tiles[aBase + '-up-walk1'] || b;
        GT.tiles[aBase + '-up-walk2'] = GT.tiles[aBase + '-up-walk2'] || b;
        b = GT.tiles[aBase + '-down'] || GT.tiles[aBase];
        GT.tiles[aBase + '-down'] = GT.tiles[aBase + '-down'] || b;
        GT.tiles[aBase + '-down-walk1'] = GT.tiles[aBase + '-down-walk1'] || b;
        GT.tiles[aBase + '-down-walk2'] = GT.tiles[aBase + '-down-walk2'] || b;
        b = GT.tiles[aBase + '-down'] || GT.tiles[aBase];
        GT.tiles[aBase + '-sleep'] = GT.tiles[aBase + '-sleep'] || b;
        GT.tiles[aBase + '-dead'] = GT.tiles[aBase + '-dead'] || b;
    };

    self.nearest = function (aFromCharacter, aAllowedBases, aMaxDistance, aAlive) {
        // Find nearest enemy, usually from player and looking for enemies
        var i, ch, d, m = 1e9, r;
        for (i = 0; i < self.characters.length; i++) {
            ch = self.characters[i];
            // only characters on same map and not itself
            if (ch !== aFromCharacter && ch.map === aFromCharacter.map && aAllowedBases.hasOwnProperty(ch.baseTile)) {
                d = aFromCharacter.distanceTo(ch.x, ch.y);
                if (d < m && d <= aMaxDistance && (!aAlive || (aAlive && (ch.health > 0)))) {
                    m = d;
                    r = ch;
                }
            }
        }
        return r;
    };

    self.removeDead = function () {
        // Remove dead characters except player
        var i;
        for (i = self.characters.length - 1; i >= 0; i--) {
            if (self.characters[i] !== self.player && self.characters[i].health <= 0) {
                self.characters.splice(i, 1);
            }
        }
    };

    self.clear = function () {
        // Clear all characters
        self.names = {};
        self.characters = [];
    };

    self.prepare = function (aMap, aName) {
        // Prepare character (create it if it does not exists)
        var m, n, c;
        // if map is not specified find where npc is
        if (!aMap) {
            for (m in GT.maps) {
                if (GT.maps.hasOwnProperty(m)) {
                    if (GT.maps[m].npc.hasOwnProperty(aName)) {
                        aMap = m;
                    }
                }
            }
        }
        if (!aMap) {
            throw "Character " + aName + " is not on any map";
        }
        n = GT.maps[aMap].npc[aName];
        if (!self.names.hasOwnProperty(aName)) {
            c = GT.character(aName, aMap, n.x, n.y, n.base);
            c.turn(n.dir);
        }
        return self.names[aName];
    };

    self.edge2invalid = false;
    self.edge2time = 0;
    self.edge2update = function () {
        // Update edge2 on player's map
        var t1 = Date.now(), t2, i, map = GT.maps[GT.characters.player.map];
        GT.map.edge2clear(map);
        for (i = self.characters.length - 1; i >= 0; i--) {
            if (self.characters[i] !== self.player && self.characters[i].health > 0 && self.characters[i].map === self.player.map) {
                GT.map.edge2add(map, self.characters[i].x, self.characters[i].y);
            }
        }
        t2 = Date.now();
        self.edge2time += t2 - t1;
    };

    return self;
}());

GT.character = function (aName, aMap, aX, aY, aBaseTile) {
    // Create one character and add it to character list (name must be unique)
    var self = {},
        oldtime = 0,
        walkFrame = 0,
        walkTime = 0,
        walkTimeOld = 0,
        stepTime = 0,
        lookKey = '',
        wasMoving = false,
        walkKey = aX + ' ' + aY,
        eventKey = aX + ' ' + aY,
        wallhackEnabled = false,
        oldHealth = 100, // onDie trigger
        fractionsPerCell = 8, // number of steps between cells, tile size should be divisible by it, affects bg smoothness
        frameChangeTime = 100, // how long stay one animation frame on
        fx = 0, // fraction of cell (0 ~ fractionsPerCell-1)
        fy = 0,
        tx = aX,
        ty = aY;

    self.onWalk = undefined;
    self.onEvent = undefined;
    self.onLook = undefined;
    self.onStop = undefined;
    self.onMap = undefined;
    self.onTurn = undefined;
    self.onDie = undefined;

    self.name = aName;
    self.x = aX || 0; // integer position, e.g. [3, 4]
    self.y = aY || 0;
    self.rx = self.x; // real position including fractions, e.g. [3.25, 4]
    self.ry = self.y;
    self.acceptEvents = true; // false will prevent enemies to look at gallery etc.
    self.health = GT.characters.defaults.hasOwnProperty(aBaseTile) ? GT.characters.defaults[aBaseTile].health : 100;

    self.baseTile = aBaseTile || 'boy';
    self.dir = 'down';
    self.tile = self.baseTile + '-' + self.dir;

    self.speed = 40;       // how long to wait between walk frames
    self.walkFrames = ["", "-walk1", "", "-walk2"]; // suffixes for walking frames
    self.follow = null; // character to follow
    self.map = aMap;
    self.wallCauseOnWalk = false; // if true hitting wall will cause onWalk event
    self.dirOffsetY = 0; // -0.5 when sleeping on bed

    self.test = function () {
        console.log('t', tx, ty, 'f', fx, fy, fractionsPerCell);
    };

    /*
    self.hit = function (aHit) {
        self.hitFrame = 30;
        self.hitTile = 'hit1';
        self.health -= aHit;
    };
    */

    self.wallhack = function (aValue) {
        // Set wallhack on/off
        if (aValue === undefined) {
            aValue = !wallhackEnabled;
        }
        wallhackEnabled = aValue;
        if (self === GT.characters.player) {
            GT.background.debug = aValue;
            GT.background.load(self.map);
            GT.background.key = '';
        }
        return wallhackEnabled;
    };

    self.toData = function () {
        // Return only important data for storage, basically constructor attributes
        return {
            name: self.name,
            map: self.map,
            x: self.x,
            y: self.y,
            baseTile: self.baseTile
        };
    };

    self.updateTile = function (aTime) {
        // Update current tile (walking, sleeping, direction)
        var n = aTime;
        walkTime += n - walkTimeOld;
        walkTimeOld = n;
        if (self.health <= 0) {
            self.dir = 'dead';
        }
        if (walkTime > frameChangeTime) {
            walkFrame++;
            walkTime = 0;
            self.tile = self.baseTile + '-' + self.dir;
            // walk frames
            if (self.dir !== 'sleep' && self.dir !== 'dead') {
                self.tile += self.walkFrames[walkFrame % self.walkFrames.length];
            }
        }
    };

    self.base = function (aBaseTile) {
        // Change base tile
        if (!GT.tiles.hasOwnProperty(aBaseTile + '-down')) {
            console.error('Cannot change to base ' + aBaseTile);
            return;
        }
        self.baseTile = aBaseTile;
        walkFrame = -1;
        walkTime = 0;
        walkTimeOld = 0;
        self.updateTile(GT.time);
        GT.characters.key = '';
    };

    self.allowedMove = function (aOldX, aOldY, aNewX, aNewY) {
        // Return [aNewX, aNewY] of it is allowed move, old coordinates otherwise
        var LEFT = 1, RIGHT = 2, UP = 4, DOWN = 8,
            map = GT.maps[self.map],
            dx = aNewX - aOldX,
            dy = aNewY - aOldY,
            e, l, r, u, d,
            edge_on, edge_no;

        // do not move
        if (self.frozen) {
            return [aOldX, aOldY];
        }
        // staying on the same spot is legal move
        if (aOldX === aNewX && aOldY === aNewY) {
            return [aOldX, aOldY];
        }
        // prevent moving out of map
        if ((aNewX < 0) || (aNewY < 0) || (aNewX > map.width - 1) || (aNewY > map.height - 1)) {
            return [aOldX, aOldY];
        }
        // wallhack allows any move
        if (wallhackEnabled) {
            return [aNewX, aNewY];
        }

        // find cell edges
        e = map.edge[aOldY][aOldX];
        if (GT.characters.occupied) {
            e |= map.edge2[aOldY][aOldX];
        }
        l = (e & LEFT) > 0;
        r = (e & RIGHT) > 0;
        u = (e & UP) > 0;
        d = (e & DOWN) > 0;
        //console.log('lrud', l, r, u, d, 'dx', dx, 'dy', dy);

        // ortogonal moves
        if (dx > 0 && r) {
            return [aOldX, aOldY];
        }
        if (dx < 0 && l) {
            return [aOldX, aOldY];
        }
        if (dy < 0 && u) {
            return [aOldX, aOldY];
        }
        if (dy > 0 && d) {
            return [aOldX, aOldY];
        }

        // diagonal moves
        edge_on = map.edge[aOldY][aNewX];
        edge_no = map.edge[aNewY][aOldX];
        if (GT.characters.occupied) {
            edge_on |= map.edge2[aOldY][aNewX];
            edge_no |= map.edge2[aNewY][aOldX];
        }
        // to right up
        if ((aOldX === aNewX - 1) && (aOldY === aNewY + 1)) {
            if ((edge_on & UP) || (edge_no & RIGHT)) {
                return [aOldX, aOldY];
            }
        }
        // to right down
        if ((aOldX === aNewX - 1) && (aOldY === aNewY - 1)) {
            if ((edge_on & DOWN) || (edge_no & RIGHT)) {
                return [aOldX, aOldY];
            }
        }
        // to left down
        if ((aOldX === aNewX + 1) && (aOldY === aNewY - 1)) {
            if ((edge_on & DOWN) || (edge_no & LEFT)) {
                return [aOldX, aOldY];
            }
        }
        // to left up
        if ((aOldX === aNewX + 1) && (aOldY === aNewY + 1)) {
            if ((edge_on & UP) || (edge_no & LEFT)) {
                return [aOldX, aOldY];
            }
        }

        // allowed move
        return [aNewX, aNewY];
    };

    self.debugEdge = function () {
        // Print edge where character is now standing
        var LEFT = 1, RIGHT = 2, UP = 4, DOWN = 8,
            map = GT.maps[self.map],
            e, l, r, u, d;
        // find edges
        e = map.edge[self.y][self.x];
        l = (e & LEFT) > 0;
        r = (e & RIGHT) > 0;
        u = (e & UP) > 0;
        d = (e & DOWN) > 0;
        console.log('x', self.x, 'y', self.y, 'l', l, 'r', r, 'u', u, 'd', d, 'edge', e, 'walk', walkFrame, walkTime, walkTimeOld);
    };

    self.update = function (aTime) {
        // Update character (movement)
        var now = aTime,
            dt = now - oldtime,
            d,
            moved,
            xy,
            xyd,
            cmd;
        oldtime = now;
        stepTime += dt;

        // if speed is 0 move directly on cells
        if (self.speed === 0) {
            fractionsPerCell = 1;
        }

        // move towards target
        if (stepTime > self.speed) {
            stepTime = 0;
            moved = false;

            if (self.x < tx) {
                fx++;
                if (fx >= fractionsPerCell) {
                    self.x++;
                    fx = 0;
                }
                moved = true;
            }
            if (self.x > tx) {
                fx--;
                if (fx <= -fractionsPerCell) {
                    self.x--;
                    fx = 0;
                }
                moved = true;
            }
            if (self.y < ty) {
                fy++;
                if (fy >= fractionsPerCell) {
                    self.y++;
                    fy = 0;
                }
                moved = true;
            }
            if (self.y > ty) {
                fy--;
                if (fy <= -fractionsPerCell) {
                    self.y--;
                    fy = 0;
                }
                moved = true;
            }

            // finish movement when suddenly changed direction mid-cell (g.gotoLeft(); setTimeout(g.gotoRight, 200);)
            if (!moved && (fx !== 0 || fy !== 0)) {
                if (fx > 0) {
                    fx--;
                }
                if (fx < 0) {
                    fx++;
                }
                if (fy > 0) {
                    fy--;
                }
                if (fy < 0) {
                    fy++;
                }
                moved = true;
            }

            // walk event
            xy = self.x + ' ' + self.y;
            if (xy !== walkKey) {
                GT.map.checkSubmap(self);

                // edge2
                if (GT.characters.occupied) {
                    if (self.name !== GT.characters.player.name) {
                        GT.characters.edge2invalid = true;
                        //console.log('edge2add', self.name, self.map, self.x, self.y);
                    }
                }
            }
            if (self.onWalk && xy !== walkKey) {
                self.onWalk(self);
                // walkKey = xy;
            }
            walkKey = xy;

            // map event
            if (self.acceptEvents && xy !== eventKey) {
                eventKey = xy;
                if (GT.maps[self.map].event.hasOwnProperty(xy)) {
                    cmd = GT.maps[self.map].event[xy];
                    if (self.onEvent) {
                        self.onEvent(self, cmd);
                    }
                    GT.cmd(self, cmd);
                }
            }

            // look event
            if (self.onLook) {
                xyd = xy + ' ' + self.dir;
                if (lookKey !== xyd) {
                    lookKey = xyd;
                    self.onLook(self);
                }
            }

            // cycle walking animation
            if (moved) {
                self.rx = self.x + fx / fractionsPerCell;
                self.ry = self.y + fy / fractionsPerCell;
                self.updateTile(aTime);
            }

            // stop event
            if (wasMoving && !moved) {
                if (self.health <= 0) {
                    self.dir = 'dead';
                }
                self.tile = self.baseTile + '-' + self.dir;
                if (self.onStopWalkPath) {
                    self.onStopWalkPath(self);
                }
                if (!self.onStopWalkPath && self.onStop) {
                    self.onStop(self);
                }
            }
            wasMoving = moved;
        }

        // follow another character
        if (self.follow) {
            // on the same map
            if (self.map === self.follow.map) {
                d = self.distanceTo(self.follow.x, self.follow.y);
                if (d > 1.42) {
                    self.goto(self.follow.x, self.follow.y);
                }
                if (d < 1) {
                    // do not spread on event cells
                    if (!GT.maps[self.map].event.hasOwnProperty(self.x + ' ' + self.y)) {
                        self.spread();
                    }
                }
            } else {
                // if followed character dissapeared assume it was teleported away
                if (self.follow.beforeTeleport) {
                    //console.log('Following out of map', self.name, self.follow.beforeTeleport, self.x, self.y);
                    self.goto(self.follow.beforeTeleport.x, self.follow.beforeTeleport.y);
                    // note: this is 10x in console, consider only calling it once
                }
            }
        }

        // die event
        if (self.health <= 0 && oldHealth > 0 && self.onDie) {
            setTimeout(function () {
                self.onDie(self);
            }, 500);
        }
        oldHealth = self.health;

        // update event
        if (self.onUpdate) {
            self.onUpdate(self);
        }
    };

    self.spread = function () {
        // move from current position anywhere else 1 cell
        var a, allowed;
        allowed = self.allowedMove(self.x, self.y, self.x - 1, self.y);
        a = allowed[0] !== self.x || allowed[1] !== self.y;
        if (a) {
            self.gotoLeft();
            setTimeout(function () { self.turn('right'); }, 500);
            return;
        }
        allowed = self.allowedMove(self.x, self.y, self.x + 1, self.y);
        a = allowed[0] !== self.x || allowed[1] !== self.y;
        if (a) {
            self.gotoRight();
            setTimeout(function () { self.turn('left'); }, 500);
            return;
        }
        allowed = self.allowedMove(self.x, self.y, self.x, self.y - 1);
        a = allowed[0] !== self.x || allowed[1] !== self.y;
        if (a) {
            self.gotoUp();
            setTimeout(function () { self.turn('down'); }, 500);
            return;
        }
        allowed = self.allowedMove(self.x, self.y, self.x, self.y + 1);
        a = allowed[0] !== self.x || allowed[1] !== self.y;
        if (a) {
            self.gotoDown();
            setTimeout(function () { self.turn('up'); }, 500);
            return;
        }
    };

    self.gotoLeft = function () {
        // Walk 1 cell left
        var n = Math.round(self.x - 1),
            allowed = self.allowedMove(self.x, self.y, n, ty),
            fail = allowed[0] === self.x && allowed[1] === self.y;
        tx = allowed[0];
        if (self.dir === 'sleep') {
            self.dir = 'left';
        }
        if (fail && self.wallCauseOnWalk && self.onWalk) {
            self.onWalk(self);
            if (self.onStopWalkPath) {
                self.onStopWalkPath();
            }
        }
        return !fail;
    };

    self.gotoRight = function () {
        // Walk 1 cell right
        var n = Math.round(self.x + 1),
            allowed = self.allowedMove(self.x, self.y, n, ty),
            fail = allowed[0] === self.x && allowed[1] === self.y;
        tx = allowed[0];
        if (self.dir === 'sleep') {
            self.dir = 'right';
        }
        if (fail && self.wallCauseOnWalk && self.onWalk) {
            self.onWalk(self);
            if (self.onStopWalkPath) {
                self.onStopWalkPath();
            }
        }
        return !fail;
    };

    self.gotoUp = function () {
        // Walk 1 cell up
        var n = Math.round(self.y - 1),
            allowed = self.allowedMove(self.x, self.y, tx, n),
            fail = allowed[0] === self.x && allowed[1] === self.y;
        ty = allowed[1];
        if (self.dir === 'sleep') {
            self.dir = 'up';
        }
        if (fail && self.wallCauseOnWalk && self.onWalk) {
            self.onWalk(self);
            if (self.onStopWalkPath) {
                self.onStopWalkPath();
            }
        }
        return !fail;
    };

    self.gotoDown = function () {
        // Walk 1 cell down
        var n = Math.round(self.y + 1),
            allowed = self.allowedMove(self.x, self.y, tx, n),
            fail = allowed[0] === self.x && allowed[1] === self.y;
        ty = allowed[1];
        if (self.dir === 'sleep') {
            self.dir = 'down';
        }
        if (fail && self.wallCauseOnWalk && self.onWalk) {
            self.onWalk(self);
            if (self.onStopWalkPath) {
                self.onStopWalkPath();
            }
        }
        return !fail;
    };

    self.gotoForward = function () {
        // Walk 1 cell forward
        if (self.dir === 'sleep') {
            self.dir = 'down';
        }
        switch (self.dir) {
        case "left":
            return self.gotoLeft();
        case "right":
            return self.gotoRight();
        case "up":
            return self.gotoUp();
        case "down":
            return self.gotoDown();
        }
    };

    self.gotoBackward = function () {
        // Walk 1 cell backward
        if (self.dir === 'sleep') {
            self.dir = 'down';
        }
        switch (self.dir) {
        case "left":
            return self.gotoRight();
        case "right":
            return self.gotoLeft();
        case "up":
            return self.gotoDown();
        case "down":
            return self.gotoUp();
        }
    };

    self.goto = function (aX, aY, aDir) {
        // Walk to distant place, ignoring obstacles
        tx = Math.round(aX);
        ty = Math.round(aY);
        if (aDir) {
            self.dir = aDir;
        } else {
            self.lookTo(tx, ty);
        }
    };

    self.walkPath = function (aPath, aCallback, aCallback2) {
        // Walk given path (l=turn left, L=walk left, r=turn right, R=walk right, ..., p=pause, s=sleep, e=dead, 2=aCallback2, w=walls off, W=walls on) then call callback
        var p = aPath.split(''),
            o;
        function one() {
            if (p.length > 0) {
                o = p.shift();
                //console.log('o', o);
                switch (o) {
                // turning
                case "l":
                    self.turn('left');
                    one();
                    break;
                case "r":
                    self.turn('right');
                    one();
                    break;
                case "u":
                    self.turn('up');
                    one();
                    break;
                case "d":
                    self.turn('down');
                    one();
                    break;
                // sleep
                case "s":
                    self.turn('sleep');
                    one();
                    break;
                // dead
                case "e":
                    self.turn('dead');
                    one();
                    break;
                // lefthand
                case "<":
                    self.turn('lefthand');
                    one();
                    break;
                // righthand
                case ">":
                    self.turn('righthand');
                    one();
                    break;
                // wallhack on
                case "w":
                    wallhackEnabled = true;
                    one();
                    break;
                // wallhack off
                case "W":
                    wallhackEnabled = false;
                    one();
                    break;
                // pause
                case "p":
                    setTimeout(one, 200);
                    break;
                // secondary callback
                case "2":
                    aCallback2(self, p);
                    one();
                    break;
                // walking
                case "L":
                    self.gotoLeft();
                    break;
                case "R":
                    self.gotoRight();
                    break;
                case "U":
                    self.gotoUp();
                    break;
                case "D":
                    self.gotoDown();
                    break;
                case "F":
                    self.gotoForward();
                    break;
                case "B":
                    self.gotoBackward();
                    break;
                }
            } else {
                //console.warn('path finished', self.name, aPath);
                self.onStopWalkPath = undefined;
                if (self.onStop) {
                    self.onStop(self);
                }
                if (aCallback) {
                    aCallback();
                }
            }
        }
        self.onStopWalkPath = one;
        one();
    };

    self.teleport = function (aMap, aX, aY, aDir) {
        // Instantly teleport to new place on any map, e.g. via stairs
        console.log('teleport', self.name, aMap, aX, aY, aDir);
        if (!aMap) {
            throw "Undefined map for teleport in " + self.name;
        }
        self.beforeTeleport = {
            map: self.map,
            x: self.x,
            y: self.y
        };
        self.map = aMap;
        self.x = Math.round(aX);
        self.y = Math.round(aY);
        self.rx = self.x;
        self.ry = self.y;
        fx = 0;
        fy = 0;
        walkKey = self.x + ' ' + self.y;
        eventKey = self.x + ' ' + self.y;
        tx = self.x;
        ty = self.y;
        if (aDir) {
            self.dir = aDir;
            self.updateTile(GT.time || 0);
        }
        lookKey = self.x + ' ' + self.y + ' ' + self.dir;
        if (self === GT.characters.player) {
            GT.background.load(GT.maps[aMap], GT.canvas.customViewport(self.x, self.y));
        }
        // onMap event
        if (self.onMap) {
            self.onMap(self);
        }
    };

    self.distanceTo = function (aX, aY) {
        // Return distance to place on map
        var dx = self.x - aX,
            dy = self.y - aY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    self.lookTo = function (aX, aY) {
        // Look to given place
        var dx = aX - self.x,
            dy = aY - self.y,
            horizontal = Math.abs(dx) > Math.abs(dy);
        // detect direction
        if (horizontal) {
            if (dx < 0) {
                self.turn('left');
            }
            if (dx > 0) {
                self.turn('right');
            }
        } else {
            if (dy < 0) {
                self.turn('up');
            }
            if (dy > 0) {
                self.turn('down');
            }
        }
    };

    self.relativeToAbsoluteDir = function (aDir) {
        // Convert relative direction (e.g. lefthand) to absolute direction (left when facing up, right when facing down)
        switch (self.dir + '-' + aDir) {
        case 'left-lefthand':
            aDir = 'down';
            break;
        case 'left-righthand':
            aDir = 'up';
            break;
        case 'right-lefthand':
            aDir = 'up';
            break;
        case 'right-righthand':
            aDir = 'down';
            break;
        case 'up-lefthand':
            aDir = 'left';
            break;
        case 'up-righthand':
            aDir = 'right';
            break;
        case 'down-lefthand':
            aDir = 'right';
            break;
        case 'down-righthand':
            aDir = 'left';
            break;
        }
        return aDir;
    };

    self.turn = function (aDir) {
        // Turn and update tile if needed, also works for "sleep" and "dead"
        var cmd;
        if (self.dir !== aDir) {
            self.dir = self.relativeToAbsoluteDir(aDir);
            self.tile = self.baseTile + '-' + self.dir;
            // some characters don't have sleep tile
            if (!GT.tiles.hasOwnProperty(self.tile)) {
                self.dir = 'down';
                self.tile = self.baseTile + '-' + self.dir;
            }
            // walk frames
            if (self.dir !== 'sleep' && self.dir !== 'dead') {
                self.tile += self.walkFrames[walkFrame % self.walkFrames.length];
            }
            // sleep on bed workaround
            self.dirOffsetY = 0;
            if ((self.dir === 'sleep') && (GT.maps[self.map].ground[self.y][self.x].indexOf("bedbottom") >= 0)) {
                self.dirOffsetY = -0.5;
            }
            // turn will also call event on map, this is used in gallery
            if (self.acceptEvents && GT.maps[self.map].event.hasOwnProperty(self.x + ' ' + self.y)) {
                cmd = GT.maps[self.map].event[self.x + ' ' + self.y];
                // only if looking is present, otherwise it would trigger when turning on stairs
                if (cmd.match('"looking"')) {
                    if (self.onEvent) {
                        self.onEvent(self, cmd);
                    }
                    GT.cmd(self, cmd);
                }
            }
            if (self.onTurn) {
                self.onTurn(self);
            }
        }
    };

    self.draw = function (aContext, aPlayer, aCx, aCy) {
        // Draw character tile
        //console.log('GT.character.draw', aContext, aPlayer, aCx, aCy);
        var t = GT.tiles[self.tile];
        if (!t) {
            console.error("No such tile " + self.tile);
        }
        self.clip = {
            x: (self.rx - aPlayer.rx + aCx) * GT.size * GT.canvas.zoom,
            y: (self.ry - aPlayer.ry + aCy + self.dirOffsetY) * GT.size * GT.canvas.zoom,
            w: GT.size * GT.canvas.zoom,
            h: GT.size * GT.canvas.zoom
        };
        aContext.drawImage(t.image,
            t.x, t.y, GT.size, GT.size,
            self.clip.x, self.clip.y,
            self.clip.w, self.clip.h
            );
    };

    self.setPlayer = function () {
        // Set this character as player
        GT.characters.player = self;
        return self;
    };

    self.pick = function (aTile) {
        // Pick tile from ground, must be preceeded with "drop" tile
        var ground = GT.maps[self.map].ground[self.y][self.x],
            a = ground.indexOf(aTile);
        if (a > 0 && ground[a - 1] === 'drop') {
            ground.splice(a - 1, 2);
            GT.map.change(GT.maps[self.map], self.x, self.y, ground, false);
            return true;
        }
        return false;
    };

    GT.characters.characters.push(self);
    GT.characters.names[aName] = self;
    return self;
};

