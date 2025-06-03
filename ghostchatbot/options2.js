// Options for android version
"use strict";
// globals: document, window, DH, Android, Billing

var GA = GA || {};

GA.hideSpecialDeal = true;

GA.options = function (aShowPaidFeatures, aSource) {
    if (DH && DH.metrics) {
        DH.metrics.log('options', (aShowPaidFeatures ? 'paid' : 'free') + ' ' + (aSource || ''), DH.metrics.ab(2));
    }

    if (DH.focus) {
        DH.focus.pop();
    }

    if (!Billing.isAvailable()) {
        console.warn('Calling options before billing is available');
    }

    function save() {
        // Save user to storage
        if (DH.storage) {
            DH.storage.writeObject('GHOST_USER', GA.user);
        } else {
            DH.storage3.writeObject('GHOST_USER', GA.user);
        }
    }

    function htmlIcon(aParent, aFilePrefix, aCurrentValue) {
        // custom html for DH.options for user/ghost icon
        var button, clear, img, input = {value: aCurrentValue};

        // icon
        img = document.createElement('img');
        img.src = input.value || 'icon/' + aFilePrefix + '32.png';
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.float = 'left';
        img.style.marginRight = '1ex';
        aParent.appendChild(img);

        // button for change
        button = document.createElement('button');
        button.textContent = 'Change';
        button.style.minHeight = '32px';
        button.onclick = function (event) {
            event.preventDefault();
            DH.metrics.log('options-paid', 'changing ' + aFilePrefix + ' icon');
            GA.profilePictureUpload(aFilePrefix, function (aK, aVal) {
                console.log('icon', aK, aVal);
                //if (aVal) {
                input.value = aVal;
                img.src = input.value;
                GA.paidOptions.icon[aK] = aVal;
                GA.paidOptionsSave();
                //}
                //aCallback(aKey, aVal);
                //input.value = aVal;
                //console.warn(aKey, aVal, aK);
                DH.metrics.log('options-paid', 'changed ' + aFilePrefix + ' icon');
            });
        };
        aParent.appendChild(button);

        // clear
        clear = document.createElement('button');
        clear.textContent = 'Clear';
        clear.style.minHeight = '32px';
        clear.onclick = function (event) {
            event.preventDefault();
            input.value = '';
            img.src = 'icon/' + aFilePrefix + '32.png';
            GA.paidOptions.icon[aFilePrefix] = '';
            GA.paidOptionsSave();
            DH.metrics.log('options-paid', 'cleared ' + aFilePrefix + ' icon');
        };
        aParent.appendChild(clear);

        return input;
    }

    function htmlUser(aParent) {
        return htmlIcon(aParent, 'user', GA.paidOptions.icon.user);
    }

    function htmlGhost(aParent) {
        return htmlIcon(aParent, 'ghost', GA.paidOptions.icon.ghost);
    }

    function pickFreeIap() {
        // Let user choose which iap he want's for free
        var select,
            sp = DH.splash('Awesome!', 'Unlock for free', '#76aeef', function (aParent) {
                var k, p = document.createElement('p'), option, iaps = {
                    'ghost_unlock_icon': 'Custom icons',
                    'ghost_unlock_theme_dark': 'Dark theme',
                    'ghost_unlock_theme_pink': 'Pink theme',
                    'ghost_unlock_mountains': 'Ghost mountains',
                    'ghost_unlock_ads': 'No ads',
                    'ghost_unlock_trash': 'Trash everything',
                    'ghost_unlock_virtual_town': 'Virtual town'
                };
                p.textContent = 'You can now choose one of these paid features and you will have it completely for free:';
                aParent.appendChild(p);

                select = document.createElement('select');
                select.style.minHeight = '1cm';
                select.style.width = '100%';
                aParent.appendChild(select);
                for (k in iaps) {
                    if (iaps.hasOwnProperty(k)) {
                        if (Billing.purchaseExists(k)) {
                            continue;
                        }
                        option = document.createElement('option');
                        option.value = k;
                        option.textContent = iaps[k];
                        select.appendChild(option);
                    }
                }
                if (!option) {
                    option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'You have everything';
                    select.appendChild(option);
                }
            }, function () {
                console.log('forceExists', select.value);
                if (select.value) {
                    Billing.forceExists(select.value);
                    GA.lastOptionsSaveCancel.dataCancel.click();
                    GA.options(true);
                }
            }, '80vw', 'auto');
        sp.bgClickDisable();
    }
    GA.pfi = pickFreeIap;

    function addSpecialDeal(o) {
        if (GA.pro || GA.hideSpecialDeal) {
            return;
        }
        var url, submit;
        o.h1('Special deal!');
        o.noteBig('You can now get any paid feature for FREE. Just publish YouTube video where you play with Ghost Chat Bot and you will get one paid feature of your choice for free.');
        o.noteBig('To qualify video must contain "Ghost Chat Bot" in title and must have this link to Android play store: https://ghost.sk/bot in description.');

        // url
        o.one();
        url = document.createElement('input');
        url.type = 'url';
        url.maxLength = 150;
        url.required = true;
        url.style.width = '100%';
        url.style.boxSizing = 'border-box';
        url.placeholder = 'Paste URL of the video here';
        o.td1.appendChild(url);

        // submit
        submit = o.buttonCenter('Submit URL', function () {
            // check url
            if (url.value && url.value.toString().substr(0, 4) !== 'http') {
                url.value = 'https://' + url.value;
            }
            if (url.reportValidity && !url.reportValidity()) {
                url.focus();
                return;
            }
            submit.disabled = true;
            submit.textContent = 'Wait please...';
            // submit to server
            DH.json('https://ghost.sk/ghost/video.php', {url: url.value.trim()}, function (aOk, aData) {
                submit.disabled = false;
                submit.textContent = 'Submit URL';
                console.log(aOk, aData);
                if (!aOk) {
                    DH.splash('Error', 'OK', 'pink', 'Some error occured: ' + aData, null, '80vw', 'auto');
                    return;
                }
                if (aData.code !== 0) {
                    DH.splash('Error', 'OK', 'pink', aData.message, null, '80vw', 'auto');
                    return;
                }
                pickFreeIap();
            });
        });
        submit.style.marginBottom = '1em';
        //submit
    }

    // show options
    GA.lastOptions = DH.options2(function (o) {
        var input = {}, themes;

        input.h1 = o.h1('Options');

        // try to get rid of the keyboard
        /*
        document.getElementById('question').blur();
        Android.keyboardUnspecified();
        Android.keyboardHide();
        input.h1.focus();
        setTimeout(function () {
            Android.keyboardHide();
            //Android.keyboardUnspecified();
            input.h1.focus();
        }, 500);
        */

        input.nick = o.text('Name', GA.user.params['$nick;'] || 'Ghost', 1, 20);
        input.nick.required = true;
        input.borndate = o.date('Date of birth', GA.user.params['$borndate;'] || '2003-08-23');
        input.age = o.number('Age (years)', GA.user.params['$age;'] || '14', 1, 999, 1);
        input.sex = o.text('Gender', GA.user.params['$sex;'] || 'man');
        input.location = o.text('Location', GA.user.params['$location;'] || 'Slovakia, Europe');
        input.city = o.text('City', GA.user.params['$city;'] || 'Košice');
        input.height = o.text('Height', GA.user.params['$height;'] || '167cm');
        input.weight = o.text('Weight', GA.user.params['$weight;'] || '60kg');
        input.username = o.text('Your name', GA.user.params['$username;'] || '');

        if (aShowPaidFeatures) {
            addSpecialDeal(o);

            o.h1('Extra features');

            // icons
            input.paid_icon_user = o.html('Your icon', htmlUser);
            input.paid_icon_user_tr = o.tr;
            input.paid_icon_ghost = o.html('Ghost icon', htmlGhost);
            input.paid_icon_ghost_tr = o.tr;
            // hide if not paid
            if (!Billing.purchaseExists('ghost_unlock_icon')) {
                input.paid_icon_user_tr.style.display = 'none';
                input.paid_icon_ghost_tr.style.display = 'none';
                // unlock
                input.paid_icon_unlock = o.paid('ghost_unlock_icon', 'Change your and Ghost\'s icon in the chat window to any picture or photo on your phone', 1, function () {
                    if (!Billing.isAvailableDialog()) {
                        return;
                    }
                    Billing.purchase('ghost_unlock_icon', function (aOk) {
                        if (aOk) {
                            input.paid_icon_user_tr.style.display = '';
                            input.paid_icon_ghost_tr.style.display = '';
                            input.paid_icon_unlock.style.display = 'none';
                            input.paid_icon_user_tr.scrollIntoViewIfNeeded();
                            return true;
                        }
                    });
                }, 'billing/ghost_unlock_icon_preview.png');
            }

            // theme
            themes = ['light'];
            if (Billing.purchaseExists('ghost_unlock_theme_dark')) {
                themes.push('dark');
            }
            if (Billing.purchaseExists('ghost_unlock_theme_pink')) {
                themes.push('pink');
            }
            console.log('themes', themes, themes.length);

            input.paid_theme = o.select('Color theme', GA.paidOptions.theme || 'light', themes, function (aValue) {
                GA.paidOptions.theme = aValue;
                GA.paidOptionsSave();
                GA.applyTheme(aValue);
                DH.metrics.log('options-paid', 'changed theme ' + aValue);
            });

            input.paid_theme_tr = o.tr;
            if (themes.length === 1) {
                input.paid_theme_tr.style.display = 'none';
            }

            if (!Billing.purchaseExists('ghost_unlock_theme_dark')) {
                //input.paid_theme_tr.style.display = 'none';
                input.paid_theme_unlock_dark = o.paid('ghost_unlock_theme_dark', 'Change chat window color theme to dark (white text on black background)', 1, function () {
                    if (!Billing.isAvailableDialog()) {
                        return;
                    }
                    Billing.purchase('ghost_unlock_theme_dark', function (aOk) {
                        if (aOk) {
                            input.paid_theme_tr.style.display = '';
                            input.paid_theme_unlock_dark.style.display = 'none';
                            input.paid_theme_tr.scrollIntoViewIfNeeded();
                            var op = document.createElement('option');
                            op.innerText = 'dark';
                            input.paid_theme.appendChild(op);
                            GA.applyTheme('dark');
                            GA.paidOptions.theme = 'dark';
                            GA.paidOptionsSave();
                            input.paid_theme.value = 'dark';
                            GA.paidOptions.theme = 'dark';
                            return true;
                        }
                    });
                }, 'billing/ghost_unlock_theme_dark_preview.png');
            }
            if (!Billing.purchaseExists('ghost_unlock_theme_pink')) {
                //input.paid_theme_tr.style.display = 'none';
                input.paid_theme_unlock_pink = o.paid('ghost_unlock_theme_pink', 'Change chat window color theme to pink', 1, function () {
                    if (!Billing.isAvailableDialog()) {
                        return;
                    }
                    Billing.purchase('ghost_unlock_theme_pink', function (aOk) {
                        if (aOk) {
                            input.paid_theme_tr.style.display = '';
                            input.paid_theme_unlock_pink.style.display = 'none';
                            input.paid_theme_tr.scrollIntoViewIfNeeded();
                            var op = document.createElement('option');
                            op.innerText = 'pink';
                            input.paid_theme.appendChild(op);
                            GA.applyTheme('pink');
                            GA.paidOptions.theme = 'pink';
                            GA.paidOptionsSave();
                            input.paid_theme.value = 'pink';
                            GA.paidOptions.theme = 'pink';
                            return true;
                        }
                    });
                }, 'billing/ghost_unlock_theme_pink_preview.png');
            }

            // no ads
            input.paid_ads = o.span('Ads', 'No ads');
            input.paid_ads_tr = o.tr;
            if (!Billing.purchaseExists('ghost_unlock_ads')) {
                input.paid_ads_tr.style.display = 'none';
                input.paid_ads_unlock = o.paid('ghost_unlock_ads', 'Ads will not be displayed', 1, function () {
                    if (!Billing.isAvailableDialog()) {
                        return;
                    }
                    Billing.purchase('ghost_unlock_ads', function (aOk) {
                        if (aOk) {
                            input.paid_ads_tr.style.display = '';
                            input.paid_ads_unlock.style.display = 'none';
                            input.paid_ads_tr.scrollIntoViewIfNeeded();
                            return true;
                        }
                    });
                }, 'billing/ghost_unlock_ads_preview.png');
            }

            // virtual town
            input.paid_virtual_town = o.button('Virtual town', 'Play now!', function () {
                GA.command('#town');
            });
            input.paid_virtual_town_tr = o.tr;
            if (!Billing.purchaseExists('ghost_unlock_virtual_town')) {
                input.paid_virtual_town_tr.style.display = 'none';
                input.paid_virtual_town_unlock = o.paid('ghost_unlock_virtual_town', 'Virtual town full of chatbots each with different personality', 1, function () {
                    if (!Billing.isAvailableDialog()) {
                        return;
                    }
                    Billing.purchase('ghost_unlock_virtual_town', function (aOk) {
                        if (aOk) {
                            input.paid_virtual_town_tr.style.display = '';
                            input.paid_virtual_town_unlock.style.display = 'none';
                            input.paid_virtual_town_tr.scrollIntoViewIfNeeded();
                            return true;
                        }
                    });
                }, 'billing/ghost_unlock_virtual_town_preview.png');
            }

            // ghost mountains
            input.paid_mountains = o.button('Ghost mountains', 'Play now!', function () {
                GA.command('#mountains menu');
            });
            input.paid_mountains_tr = o.tr;
            if (!Billing.purchaseExists('ghost_unlock_mountains')) {
                input.paid_mountains_tr.style.display = 'none';
                input.paid_mountains_unlock = o.paid('ghost_unlock_mountains', 'Catch various ghosts while flying over mountains', 1, function () {
                    if (!Billing.isAvailableDialog()) {
                        return;
                    }
                    Billing.purchase('ghost_unlock_mountains', function (aOk) {
                        if (aOk) {
                            input.paid_mountains_tr.style.display = '';
                            input.paid_mountains_unlock.style.display = 'none';
                            input.paid_mountains_tr.scrollIntoViewIfNeeded();
                            return true;
                        }
                    });
                }, 'billing/ghost_unlock_mountains_preview.png');
            }

            // trash everything
            input.paid_trash = o.button('Trash everything', 'Play now!', function () {
                DH.storage.writeBoolean('TE.unlocked', true);
                GA.command('#trash');
            });
            input.paid_trash_tr = o.tr;
            if (!Billing.purchaseExists('ghost_unlock_trash')) {
                input.paid_trash_tr.style.display = 'none';
                input.paid_trash_unlock = o.paid('ghost_unlock_trash', 'Trash various things on a map and complete missions', 1, function () {
                    if (!Billing.isAvailableDialog()) {
                        return;
                    }
                    Billing.purchase('ghost_unlock_trash', function (aOk) {
                        if (aOk) {
                            input.paid_trash_tr.style.display = '';
                            input.paid_trash_unlock.style.display = 'none';
                            input.paid_trash_tr.scrollIntoViewIfNeeded();
                            return true;
                        }
                    });
                }, 'billing/ghost_unlock_trash_preview.png');
            }

        }

        o.h1('Experimental features');

        // speech synthesis
        o.h2('Speech synthesis');
        input.voice_select = o.select('Voice', GA.paidOptions.voice || '', [], function (aValue) {
            GA.paidOptions.voice = aValue;
            GA.paidOptionsSave();
            input.voice_test.disabled = aValue === '';
        });
        input.voice_select.style.width = '100%';
        input.voice_sample = o.text('Sample', 'Quick brown fox jumped over the lazy dog.');
        input.voice_sample.style.width = '100%';
        Android.speechVoicesToSelect(input.voice_select, GA.paidOptions.voice);
        input.voice_test = o.button(' ', 'Test this voice', function () {
            Android.speech(input.voice_sample.value, GA.paidOptions.voice);
        });
        input.voice_test.disabled = GA.paidOptions.voice === '';
        Android.speechInit(function () {
            Android.speechVoicesToSelect(input.voice_select);
            input.voice_select.value = GA.paidOptions.voice || '';
        });

        // speech recognition
        o.h2('Speech recognition');
        if (Android.internalSpeechRecognitionAvailable()) {
            input.voice_recognition_select = o.select('Language', GA.paidOptions.voiceRecognition || '', [], function (aValue) {
                console.log('1 VoiceRecognition set to ' + aValue + ' and saved!');
                Android.internalSpeechRecognitionVoice(aValue);
                GA.paidOptions.voiceRecognition = aValue;
                GA.paidOptionsSave();
                console.log('2 VoiceRecognition set to ' + aValue + ' and saved!');
                //input.voice_test.disabled = aValue === '';
            });
            input.voice_recognition_select.style.width = '100%';
            input.voice_recognition_test = o.button(' ', 'Test voice input', function () {
                //Android.internalSpeechRecognitionUserPressedMicButton();

                function test(aVoice) {
                    // Test speech recognition
                    var spinner, listening = false;
                    Android.internalSpeechStartCallback = function () {
                        console.log('synth start');
                    };
                    Android.internalSpeechStopCallback = function () {
                        console.log('synth stop');
                    };
                    Android.internalSpeechRecognitionStartCallback = function () {
                        console.log('rec start');
                        spinner.hide();
                        Android.showToast('Speak now');
                        listening = true;
                    };
                    Android.internalSpeechRecognitionStopCallback = function (aCode) {
                        console.log('rec stop ' + aCode);
                        if (listening) {
                            listening = false;
                            Android.internalSpeechRecognitionCancel();
                        }
                    };
                    Android.internalSpeechRecognitionCallback = function () {
                        console.log('rec data ' + Android.internalSpeechRecognitionData());
                        alert(Android.internalSpeechRecognitionData());
                    };
                    spinner = DH.spinner(5);
                    Android.internalSpeechRecognitionStart(aVoice);
                }
                test(input.voice_recognition_select.value);

                /*
                Android.speechRecognition(function (aText) {
                    // stop recognition
                    GA.command('#recognition stop');
                    Android.internalSpeechRecognitionCancel();
                    // show text
                    alert(aText);
                    // restore question (because rms notify callback)
                    document.getElementById('ask').style.display = '';
                    document.getElementById('question').disabled = false;
                    document.getElementById('question').focus();
                    document.getElementById('question').style.backgroundColor = '';
                    document.getElementById('question').placeholder = 'Type question here';
                    document.getElementById('mic').style.backgroundImage = 'url(icon/mic32.png)';
                }, input.voice_recognition_select.value);
                */
            });
            Android.speechRecognitionVoicesSelect(input.voice_recognition_select, GA.paidOptions.voiceRecognition);
            o.button(' ', 'Voice input service', function () {
                Android.internalSpeechRecognitionSettingsIntent();
            });

            // microphone
            if (Android.internalPermissionRecordAudioAllowed()) {
                o.noteStandalone('Microphone permission is granted');
            } else {
                Android.internalPermissionCallback = function (aPermission) {
                    if (aPermission === 'RECORD_AUDIO') {
                        input.voice_recognition_mic_note.textContent = 'Permission granted!';
                        input.voice_recognition_mic_note.style.color = 'green';
                    }
                };
                o.button('Microphone', 'Allow', function () {
                    input.voice_recognition_mic_note.textContent = ' ';
                    input.voice_recognition_mic_note.style.color = 'black';
                    Android.internalPermissionRecordAudioRequest();
                });
                input.voice_recognition_mic_note = o.noteStandalone('You must allow microphone in permissions to use speech recognition!');
                input.voice_recognition_mic_note.style.color = 'red';
            }

        } else {
            o.button('Voice input', 'Select', function () {
                Android.internalSpeechRecognitionSettingsIntent();
            });
            o.note('You must select voice input service in Android options! Some phones requires Google App to be installed (and updated!). You must also enable microphone in permissions.').style.color = 'red';
        }

        window.o = o;
        window.vs = input.voice_select;

        GA.lastOptionsSaveCancel = o.saveCancel(function () {
            // user clicked save
            window.inp = input;
            window.o = o;

            // get simple values
            GA.user.params['$nick;'] = input.nick.value;
            GA.user.params['$borndate;'] = input.borndate.value;
            GA.user.params['$age;'] = input.age.value;
            GA.user.params['$sex;'] = input.sex.value;
            GA.user.params['$location;'] = input.location.value;
            GA.user.params['$city;'] = input.city.value;
            GA.user.params['$height;'] = input.height.value;
            GA.user.params['$weight;'] = input.weight.value;
            GA.user.params['$username;'] = input.username.value;

            // unlock values are saved immediately after purchase
            // paid values are saved immediately after purchase

            // save to storage
            save();

            // theme
            if (GA.paidOptions.theme) {
                GA.applyTheme(GA.paidOptions.theme);
            }

            if (DH.focus) {
                DH.focus.push('question');
            }
            GA.showKeyboard();
            GA.renderRecentConversations();

            // show mic
            if (GA.paidOptions.voiceRecognition) {
                GA.changeMicButton('inactive');
            } else {
                GA.changeMicButton('hidden');
            }

            return true;
        }, function () {
            // cancel
            if (DH.focus) {
                DH.focus.push('question');
            }
            GA.showKeyboard();
        });
    });
};
