// Show various extra features to user
"use strict";
// globals: document, window, DH, setTimeout, Android, Billing

var GA = GA || {};

GA.nagging = (function () {
    var self = {};
    self.tic = 0;
    self.everyNDays = 1;
    self.period = 13;
    self.freeTries = 1;
    self.shown = DH.storage.readObject('GA.nagging.shown', {});
    self.tried = DH.storage.readObject('GA.nagging.tried', {});
    self.action = {};

    self.action.virtual_town = function () {
        // virtual town
        self.invite('virtual_town', 'Hey, I would like to invite you to my virtual town populated by many different chatbots.', function () {
            // free
            self.fadeout(function () {
                GA.command('#town');
            });
        }, function () {
            // buy
            console.log('buy town');
            GA.nagging.buy('ghost_unlock_virtual_town', function () {
                self.answer('Awesome, you can visit Virtual town any time by clicking on menu in bottom left corner and then click "Virtual town".');
                self.blinkMenu(1500);
            });
        });
    };

    self.action.mountains = function () {
        // ghost mountains
        self.invite('mountains', 'Hey, let\'s catch some mountain ghosts...', function () {
            // free
            self.fadeout(function () {
                GA.command('#mountains');
            });
        }, function () {
            // buy
            GA.nagging.buy('ghost_unlock_mountains', function () {
                self.answer('Awesome, you can catch mountain ghosts any time by clicking on menu in bottom left corner and then click "Ghost mountains".');
                self.blinkMenu(1500);
            });
        });
    };

    self.action.theme_dark = function () {
        // dark theme
        self.invite('theme_dark', 'Hey, let\'s try cool dark theme', function () {
            // free
            GA.applyTheme('dark');
            self.answer('Do you like it?');
            setTimeout(function () {
                GA.applyTheme(GA.paidOptions.theme);
            }, 10000);
            console.log('test');
        }, function () {
            // buy
            GA.nagging.buy('ghost_unlock_theme_dark', function () {
                GA.applyThemeAndSave('dark');
                self.answer('Awesome, I really like dark theme, if you want to change color theme go to options in bottom left corner.');
                self.blinkMenu(1500);
            });
        });
    };

    self.action.hide_and_seek = function () {
        // hide and seek
        var i = self.invite('hide_and_seek', 'Hey, let\'s play hide and seek, I\'ll hide in deep forest and you try to find me', function () {
            // free
            self.fadeout(function () {
                GA.command('#hs');
            });
        }, function () {
            // buy
            self.answer('Never mind, maybe later...');
        });
        i.test.textContent = "Let's play";
        i.buy.style.display = 'none';
    };

    self.action.trash = function () {
        // ghost mountains
        self.invite('trash', 'Hey, let\'s trash some stuff...', function () {
            // free
            self.fadeout(function () {
                GA.command('#trash');
            });
        }, function () {
            // buy
            GA.nagging.buy('ghost_unlock_trash', function () {
                DH.storage.writeBoolean('TE.unlocked', true);
                self.answer('Awesome, you can trash stuff any time by clicking on menu in bottom left corner and then click "Trash everything".');
                self.blinkMenu(1500);
            });
        });
    };

    self.action.theme_pink = function () {
        // pink theme
        self.invite('theme_pink', 'Hey, let\'s try cute pink theme', function () {
            // free
            GA.applyTheme('pink');
            self.answer('Do you like it?');
            setTimeout(function () {
                GA.applyTheme(GA.paidOptions.theme);
            }, 10000);
        }, function () {
            // buy
            GA.nagging.buy('ghost_unlock_theme_pink', function () {
                GA.applyThemeAndSave('pink');
                self.answer('Awesome, pink theme is really cute, if you want to change color theme go to options in bottom left corner.');
                self.blinkMenu(1500);
            });
        });
    };

    self.action.icon = function () {
        // icon
        function one(aClass, aIcon) {
            // change one type of avatar
            var i, e = document.getElementsByClassName('avatar ' + aClass);
            for (i = 0; i < e.length; i++) {
                e[i].style.backgroundImage = aIcon ? 'url(icon/' + aIcon + ')' : '';
            }
        }
        self.invite('icon', 'Hey, did you know that you can change ghost\'s and your icon?', function () {
            // free
            one('user', 'gogh32.png');
            one('ghost', 'mona32.png');
            setTimeout(function () {
                GA.renderOne('answer', 'Of course you can use any picture you want', false, null, false, false);
            }, 1000);
            setTimeout(function () {
                one('user', '');
                one('ghost', '');
            }, 10000);
        }, function () {
            // buy
            GA.nagging.buy('ghost_unlock_icon', function () {
                self.answer('Awesome, you can now change Your and Ghost\'s icon in options in bottom left corner.');
                self.blinkMenu(1500);
            });
        }, 'Free preview');
    };

    self.action.ads = function () {
        // no ads
        self.invite('ads', 'Hey, did you know you can hide ads?', function () {
            // free
            DH.focus.pop();
            document.getElementById('question').blur();
            //document.body.focus();
            DH.preview('billing/ghost_unlock_ads_preview.png', function () {
                DH.focus.push('question');
            });
        }, function () {
            // buy
            GA.nagging.buy('ghost_unlock_ads', function () {
                self.answer('Awesome, no more ads for you.');
            });
        }, 'Free preview');
    };

    self.buy = function (aSku, aSuccessCallback) {
        // make purchase
        // is billing available
        if (!Billing.isAvailable()) {
            DH.splash('Error', 'OK', 'pink', 'You must be online to make in-app purchases!');
            return;
        }
        // already purchased?
        if (Billing.purchaseExists(aSku)) {
            DH.splash('Yay!', 'OK', '#afa', 'You already purchased this item! Click on the menu in bottom left corner.', self.blinkMenu);
            return;
        }
        // start purchase
        Billing.purchase(aSku, function (aOk) {
            console.log('Purchase successfull ' + aSku);
            if (aOk) {
                aSuccessCallback(aSku);
                return true;
            }
            // user canceled
            console.log('unlocking ' + aSku);
            setTimeout(function () {
                var i, btn = document.body.getElementsByClassName('ghost_invite_buy_button_' + aSku);
                for (i = 0; i < btn.length; i++) {
                    btn[i].disabled = false;
                }
            }, 1000);
        });
    };

    self.answer = function (aText, aDelay) {
        // delayed answer
        setTimeout(function () {
            GA.renderOne('answer', aText, false, null, false, false);
        }, aDelay || 1000);
    };

    self.nextAction = function () {
        // execute next random action
        // get random key
        var a, lowest = Number.MAX_SAFE_INTEGER, highest = 1, n, next, purchases = Billing.purchases();
        // if no ads then skip it
        if (purchases.hasOwnProperty('ghost_unlock_ads')) {
            return undefined;
        }
        // all actions
        for (a in self.action) {
            if (self.action.hasOwnProperty(a)) {
                // only if action was NOT purchased
                if (!purchases.hasOwnProperty('ghost_unlock_' + a)) {
                    // how many times it was shown, find lowest number
                    if (!self.shown.hasOwnProperty(a)) {
                        self.shown[a] = 0;
                    }
                    n = self.shown[a];
                    // is it lowest seen count?
                    console.log(a + ' seen ' + n);
                    if (n < lowest) {
                        lowest = n;
                        next = a;
                    }
                    // remember highest for normalization
                    if (n > highest) {
                        highest = n;
                    }
                }
            }
        }
        // increment next action counter
        if (next) {
            console.log('lowest seen action=' + next + ' seen=' + lowest + ' highest=' + highest);
            self.shown[next]++;
            // make sure nothing is more than 3 behind highest (when new product will be introduced it would be displayed too many times)
            for (a in self.shown) {
                if (self.shown.hasOwnProperty(a)) {
                    if (self.shown[a] < highest - 3) {
                        self.shown[a] = highest - 3;
                    }
                }
            }
            DH.storage.writeObject('GA.nagging.shown', self.shown);
            // run next action
            setTimeout(function () {
                self.action[next]();
            }, 1500);
        }
        return next;
    };

    self.update = function () {
        // Increase tic, execute action if needed
        self.tic++;
        console.log('disabled tic', self.tic, 'period', self.period);
        // no nagging after certain date
        if (Date.now() > 1551394800000) {
            // console.log('nagging off');
            return;
        }
        // every N days
        try {
            if ((new Date()).getDate() % self.everyNDays !== 0) {
                console.log('not today');
                return;
            }
        } catch (ignore) {
        }
        // enabled every PERIOD sentences
        if (self.tic >= self.period) {
            self.tic = 0;
            return self.nextAction();
        }
    };

    self.lipOptions = function (aText) {
        // Show lip with link to options
        DH.lip(aText, function () {
            GA.options(true, 'lip');
        }, 30);
    };

    self.fadeout = function (aCallback) {
        // Fade to black (vt, bm)
        GA.renderOne('answer', 'Get ready...', false, null, false, false);
        setTimeout(function () {
            document.body.style.transition = 'opacity 1s linear, backgroundColor 1s linear';
            document.body.style.opacity = 0;
            document.body.style.backgroundColor = 'black';
            setTimeout(function () {
                aCallback();
            }, 1500);
        }, 1500);
    };

    self.invite = function (aMetricsId, aText, aCallbackTry, aCallbackBuy, aTryButton, aBuyButton) {
        // Render invite with yes/no buttons
        DH.metrics.log('invite', aMetricsId);

        var bubble,
            div,
            test,
            buy;

        // speech bubble
        bubble = GA.renderOne('answer', aText, false, null, false, false);

        // button
        div = document.createElement('div');
        div.style.textAlign = 'center';

        /*
        function hideButtons() {
            div.style.height = div.clientHeight + 'px';
            div.style.transition = 'height 0.5s linear';
            setTimeout(function () {
                div.style.opacity = 0;
                div.style.height = 0;
            });
        }
        */

        // try button
        test = document.createElement('button');
        test.style.margin = '0.5ex';
        test.style.minHeight = '1cm';
        test.textContent = aTryButton || "Try for free";
        test.onclick = function () {
            DH.metrics.log('invite-' + aMetricsId, 'test');
            test.disabled = true;

            // certain are only 3 times free
            if (['virtual_town', 'mountains'].indexOf(aMetricsId) >= 0) {
                if (!self.tried.hasOwnProperty(aMetricsId)) {
                    self.tried[aMetricsId] = 0;
                }
                self.tried[aMetricsId]++;
                DH.storage.writeObject('GA.nagging.tried', self.tried);
                if (self.tried[aMetricsId] > self.freeTries) {
                    setTimeout(function () {
                        GA.renderOne('answer', 'You already played for free, you have to pay now. My creator worked so hard...', false, null, false, false);
                    }, 1000);
                    return;
                }
            }

            //hideButtons();
            aCallbackTry(aMetricsId, test);
        };
        div.appendChild(test);

        // buy button
        buy = document.createElement('button');
        buy.style.margin = '0.5ex';
        buy.style.minHeight = '1cm';
        buy.textContent = aBuyButton || "Buy for $1";
        buy.onclick = function () {
            DH.metrics.log('invite-' + aMetricsId, 'buy');
            buy.disabled = true;
            buy.classList.add('ghost_invite_buy_button_ghost_unlock_' + aMetricsId);
            //hideButtons();
            aCallbackBuy(aMetricsId, buy);
        };
        div.appendChild(buy);

        bubble.appendChild(div);
        return {bubble: bubble, div: div, test: test, buy: buy};
    };

    self.blinkMenu = function (aDelay) {
        // blink menu 3 times
        var m = document.getElementById('showmenu'),
            o = [1, 0.5, 1, 0.5, 1, 0.5];
        function one() {
            m.style.opacity = o.pop();
            if (o.length > 0) {
                setTimeout(one, 200);
            }
        }
        setTimeout(one, aDelay || 0);
    };

    return self;
}());
