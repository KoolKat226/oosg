// Callbacks for main page
"use strict";
// globals: DH, GHOST, window, document, requestAnimationFrame, setTimeout, Android, DOMParser, Billing

var AndroidStartAt = Date.now();

var GA = GA || {};
GA.maxLogSize = 100;

// User's character
GA.user = DH.storage.readObject('GHOST_USER', GHOST.createCharacter('Ghost', 'user'));
GA.user.id = 'user';

// All used characters
GA.characters = [
    GHOST.character.basic,
    GHOST.character.ghost,
    GHOST.character.relationship,
    GHOST.character.ga,
    GHOST.character.android,
    GA.user
];

// Conversation log
GA.log = DH.storage.readObject('GHOST_LOG', []);

GA.saveLog = function () {
    // save conversation to local storage
    DH.storage.writeObject('GHOST_LOG', GA.log.slice(-GA.maxLogSize)); // slice is shallow
};

GA.saveUser = function () {
    // save conversation to local storage
    GHOST.indexRebuild(GA.user);
    DH.storage.writeObject('GHOST_USER', GA.user);
};

GA.showKeyboard = function () {
    // certain functions shared with chrome versions require this functions
    // android version uses DH.focus manager
    DH.type.unused([]); // linter
};

GA.edit = function (event) {
    // edit single answer
    DH.focus.pop();
    var bubble = event.target;

    // make bubble editable
    bubble.contentEditable = true;
    bubble.style.outline = 0;
    bubble.focus();
    window.getSelection().selectAllChildren(bubble);

    function save() {
        // save edited question
        var i,
            q = GHOST.normalize(bubble.dataQuestion, false).join(' '),
            a = bubble.textContent;
        console.info('save', q, '-->', a);
        // add QA to user
        if (!GA.user.data.hasOwnProperty(q)) {
            GA.user.data[q] = [];
        }
        if (GA.user.data[q].indexOf(a) < 0) {
            GA.user.data[q].push(a);
        }
        // save user
        GA.saveUser();
        // change answer in log too
        for (i = 0; i < GA.log.length; i++) {
            if (GA.log[i].q === q) {
                GA.log[i].a = a;
            }
        }
        // save log
        GA.saveLog();
        // focus question input and make bubble not editable
        DH.focus.push('question');
        bubble.contentEditable = false;
    }

    // when user leaves edited bubble save it and focus question input
    bubble.onblur = save;

    bubble.addEventListener('keypress', function (event) {
        // enter will save changes and focus question input
        if (event.keyCode === 13) {
            event.preventDefault();
            save();
        }
    }, true);
};

// Certain GA answers have special token that is replaced with picture
GA.pictures = {
    '$picture;': '<img src="icon/128.png" title="This is me"/>',
    '$picturedealwithit;': '<img src="image/deal_with_it.png" title="I am dealing with it!"/>'
};

GA.renderOne = function (aClass, aText, aFast, aQuestionForEdit, aAds, aSpeech) {
    // render one question or answer
    var block, avatar1, bubble, avatar2, edit;
    // block
    block = document.createElement('div');
    block.classList.add('block');
    block.classList.add(aClass);
    if (!aFast) {
        block.style.opacity = '0';
        block.style.transition = 'opacity 0.5s linear 0.1s';
    }
    // avatar1
    avatar1 = document.createElement('div');
    avatar1.classList.add('avatar');
    avatar1.classList.add(aClass === 'question' ? 'none' : 'ghost');
    // custom ghost icon
    if (aClass !== 'question') {
        if (GA.paidOptions.icon.ghost) {
            avatar1.style.backgroundImage = 'url(' + GA.paidOptions.icon.ghost + ')';
            avatar1.style.backgroundSize = 'contain';
        }
    }
    // bubble
    bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = aText;
    if (aClass === 'answer') {
        if (aAds) {
            bubble.innerHTML = aText;
        }
        if (GA.pictures.hasOwnProperty(aText)) {
            if (GA.paidOptions.icon.ghost) {
                bubble.innerHTML = '<img style="width: 60vw; height: auto;" src="' + GA.paidOptions.icon.ghost + '" title="Myself" />';
            } else {
                bubble.innerHTML = GA.pictures[aText];
            }
            // speech (so that it continues normally)
            if (aSpeech && GA.paidOptions.voice) {
                Android.speech('Picture', GA.paidOptions.voice);
            }
        } else {
            bubble.dataQuestion = aQuestionForEdit;
            if (aQuestionForEdit) {
                bubble.addEventListener('click', GA.edit);
            }
            // speech
            if (aSpeech && GA.paidOptions.voice) {
                Android.speech(bubble.textContent, GA.paidOptions.voice);
            }
        }
    }
    // edit
    edit = document.createElement('div');
    edit.classList.add('edit');
    edit.textContent = 'edit';
    // avatar2
    avatar2 = document.createElement('div');
    avatar2.classList.add('avatar');
    avatar2.classList.add(aClass === 'question' ? 'user' : 'none');
    // custom user icon
    if (aClass === 'question') {
        if (GA.paidOptions.icon.user) {
            avatar2.style.backgroundImage = 'url(' + GA.paidOptions.icon.user + ')';
            avatar2.style.backgroundSize = 'contain';
        }
    }
    // add it to output container
    block.appendChild(avatar1);
    block.appendChild(bubble);
    block.appendChild(avatar2);
    document.getElementById('container').appendChild(block);
    // start animation
    requestAnimationFrame(function () {
        block.style.opacity = '1';
    });
    // scroll down
    document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
    if (!aFast) {
        setTimeout(function () {
            document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
        }, 500);
    }
    return bubble;
};

GA.export = function (aData) {
    console.log('export', aData);
    DH.focus.push('question');
};

GA.import = function (aData) {
    console.log('import', aData);
    var d;
    try {
        d = JSON.parse(aData);
    } catch (e) {
        DH.alert('Invalid data!');
        return;
    }
    if (typeof d !== 'object') {
        DH.alert('This does not look like Ghost data');
        return;
    }
    if (d.id !== 'user') {
        DH.alert('This does not look like Ghost user data');
        return;
    }
    if (!d.data) {
        DH.alert('This does not look like Ghost user data!');
        return;
    }
    GA.user.data = d.data;
    GA.user.dumb = d.dumb;
    GA.user.id = d.id;
    GA.user.index = null;
    GA.user.params = d.params;
    GHOST.indexRebuild(GA.user);
    DH.storage.writeObject('GHOST_USER', GA.user);
    DH.focus.push('question');
};

GA.stripTags = function (aHtml) {
    // Return only text from html
    var d, p = new DOMParser();
    d = p.parseFromString(aHtml, 'text/html');
    return d.body.textContent;
};

GA.changeMicButton = function (aState) {
    // Indicate to user when he can talk
    console.log('changeMicButton ' + aState);
    GA.changeMicButtonState = aState;
    switch (aState) {
    case "green":
        // User can talk
        document.getElementById('ask').style.display = 'none';
        document.getElementById('mic').style.backgroundImage = 'url(icon/mic32on.png)';
        document.getElementById('mic').style.display = 'block';
        document.getElementById('question').style.backgroundColor = 'lime';
        document.getElementById('question').placeholder = 'Talk now!';
        break;
    case "red":
        // User must wait because ghost is talking
        document.getElementById('ask').style.display = 'none';
        document.getElementById('mic').style.backgroundImage = 'url(icon/mic32off.png)';
        document.getElementById('mic').style.display = 'block';
        document.getElementById('question').style.backgroundColor = 'pink';
        document.getElementById('question').placeholder = 'Wait please...';
        break;
    case "inactive":
        // User never talked or no longer wish to talk
        document.getElementById('ask').style.display = '';
        document.getElementById('mic').style.backgroundImage = 'url(icon/mic32.png)';
        document.getElementById('mic').style.display = 'block';
        document.getElementById('question').style.backgroundColor = '';
        document.getElementById('question').placeholder = 'Type question here';
        break;
    case "hidden":
        // Voice not enabled
        document.getElementById('ask').style.display = '';
        document.getElementById('mic').style.display = 'none';
        document.getElementById('question').style.backgroundColor = '';
        document.getElementById('question').placeholder = 'Type question here';
        break;
    default:
        console.error('Unknown mic button state ' + aState);
    }
};

Android.internalPermissionMissingCallback = function (aPermission) {
    // restore original color if mic is not allowed
    if (aPermission === 'RECORD_AUDIO') {
        GA.changeMicButton('hidden');
    }
};

GA.command = function (aCommand) {
    // special commands
    var e, d, i;
    aCommand = aCommand.replace(/^\//, '#');
    if (aCommand === '#clear') {
        GA.command('#recognition cancel');
        GA.clear();
        return true;
    }
    if (aCommand === '#feedback') {
        GA.feedback();
        return true;
    }
    if (aCommand === '#options') {
        GA.options(true);
        return true;
    }
    if (aCommand === '#options paid') {
        GA.options(true);
        return true;
    }
    if (aCommand === '#import') {
        DH.focus.pop();
        e = DH.import(GA.import);
        //DH.focus.push(e.textarea);
        //DH.focus.push('question');
        return true;
    }
    if (aCommand === '#export') {
        d = JSON.parse(JSON.stringify(GA.user));
        delete d.index;
        // copyToClipboard does not work on android
        //DH.copyToClipboard(d);
        //DH.alert('Data were exported to clipboard').green();
        DH.focus.pop();
        e = DH.import(GA.export, GA.export);
        e.textarea.placeholder = '';
        e.textarea.value = JSON.stringify(d, undefined, 4);
        e.textarea.select();
        e.h1.textContent = 'Please copy all data to clipboard';
        e.confirm.textContent = 'Export';
        e.confirm.style.display = 'none';
        return true;
    }
    if (aCommand === '#edits') {
        GA.edits();
        return true;
    }
    if (aCommand === '#console') {
        DH.focus.pop();
        DH.console.show(true);
        return true;
    }
    if (aCommand === '#purge') {
        DH.confirm('Do you really want to erase all data?', ['Yes', 'No'], function (aValue) {
            if (aValue === 'Yes') {
                DH.storage.eraseAll();
                if (!Android.isReal()) {
                    DH.console.disable();
                }
                Android.reload();
            }
        });
        return true;
    }
    if (aCommand === '#candidates') {
        // fill also answers
        if (GHOST.recentCandidates) {
            for (i = 0; i < GHOST.recentCandidates.length; i++) {
                try {
                    GHOST.recentCandidates[i].answer = GHOST.character[GHOST.recentCandidates[i].id].data[GHOST.recentCandidates[i].question];
                } catch (ex) {
                    GHOST.recentCandidates[i].answer = ex;
                }
            }
        }
        d = {
            question: GHOST.log.question,
            tokens: GHOST.log.tokens,
            strings: GHOST.log.tokens,
            bestScore: GHOST.log.bestScore,
            cutScore: GHOST.log.cutScore
        };
        DH.console.showRaw('Log: ' + JSON.stringify(d, undefined, 4) + '\nRecent question candidates:\n\n' + JSON.stringify(GHOST.recentCandidates, undefined, 4));
        return true;
    }
    if (aCommand === '#release') {
        GA.release();
        if (console.show) {
            console.show();
        }
        return true;
    }
    if (aCommand === '#ua') {
        DH.request.post('https://ghost.sk/ua.php', '', function (aReply) {
            console.log('debug reply');
            console.log(aReply);
            alert(aReply);
        });
        return true;
    }
    if (aCommand === '#developer') {
        GA.developer = true;
        return true;
    }
    if (aCommand === '#debug') {
        console.log('debug 1');
        DH.request.post(
            'https://ghost.sk/ghost/online.php',
            'question=' + encodeURIComponent('question ' + (new Date())) +
                '&answer=' + encodeURIComponent(' answer ' + (new Date())) +
                '&who=' + encodeURIComponent('android-debug') +
                '&original=' + encodeURIComponent('original ' + (new Date())),
            function (aReply) {
                    console.log('debug reply');
                    console.log(aReply);
                }
        );
        console.log('debug 2');

        return true;
    }
    // change ghost profile picture
    if (aCommand === '#profile ghost') {
        GA.profilePictureUpload('ghost', alert);
        return true;
    }
    // change user profile picture
    if (aCommand === '#profile user') {
        GA.profilePictureUpload('user', console.log);
        return true;
    }
    // render all again
    if (aCommand === '#render') {
        GA.renderRecentConversations();
        return true;
    }
    // billing
    if (aCommand === '#shop') {
        GA.billing(false);
        return true;
    }
    if (aCommand === '#billing') {
        GA.billing(true);
        return true;
    }
    if (aCommand === '#billing test') {
        Billing.test(['ghost_unlock_questions', 'ghost_unlock_theme_dark', 'ghost_unlock_mountains', 'ghost_unlock_icon', 'ghost_unlock_theme_pink', 'ghost_unlock_ads', 'ghost_unlock_trash', 'ghost_unlock_virtual_town']);
        return true;
    }

    function showPurchases() {
        // Show purchases and their order id in human readable form
        var p = Billing.purchases(), sku;
        for (sku in p) {
            if (p.hasOwnProperty(sku)) {
                GA.renderOne('answer', GA.humanSku(sku) + ': ' + p[sku].orderId, false);
            }
        }
    }

    if (aCommand === '#purchases') {
        showPurchases();
        return true;
    }
    if (aCommand === '#purchases feedback' || aCommand === '#feedback purchases') {
        GA.feedbackPurchases();
        return true;
    }
    if (aCommand === '#keyboard unspecified') {
        Android.keyboardUnspecified();
        return true;
    }
    // virtual town
    if (aCommand === '#town') {
        GA.command('#recognition cancel');
        Android.loadUrl('file:///android_asset/virtualtown.html');
        return true;
    }
    // trash everything
    if (aCommand === '#trash') {
        GA.command('#recognition cancel');
        Android.loadUrl('file:///android_asset/trash.html');
        return true;
    }
    // on/off reporting
    if (aCommand === '#report on') {
        GA.reportEnabled = true;
        DH.storage.writeBoolean('GA.reportEnabled', GA.reportEnabled);
        return true;
    }
    if (aCommand === '#report off') {
        GA.reportEnabled = false;
        DH.storage.writeBoolean('GA.reportEnabled', GA.reportEnabled);
        return true;
    }

    // speech recognition

    if (aCommand === '#recognition cancel') {
        GA.userWantsMic = false;
        Android.internalSpeechStartCallback = undefined;
        Android.internalSpeechStopCallback = undefined;
        Android.internalSpeechRecognitionStartCallback = undefined;
        Android.internalSpeechRecognitionStopCallback = undefined;
        Android.internalSpeechRecognitionCallback = undefined;
        Android.internalSpeechRecognitionCancel();
        console.info('recognition canceled');
        return true;
    }

    if (aCommand === '#recognition start') {
        if (DH.localAdVisible) {
            console.warn('Recognition cannot start while ads are visible!');
            return true;
        }
        GA.ghostSpeaking = false;
        Android.internalSpeechStartCallback = function () {
            // When ghost start talking mic must be red
            console.log('synth start');
            GA.ghostSpeaking = true;
            GA.changeMicButton('red');
        };

        Android.internalSpeechStopCallback = function () {
            // When ghost stop talking start recognition again
            console.log('synth stop uwm=' + GA.userWantsMic);
            GA.ghostSpeaking = false;
            if (GA.userWantsMic) {
                GA.changeMicButton('red'); // red because recognition does not start instantly
                if (!DH.localAdVisible) {
                    Android.internalSpeechRecognitionStart(GA.paidOptions.voiceRecognition);
                }
            } else {
                GA.changeMicButton('inactive');
            }
        };

        Android.internalSpeechRecognitionStartCallback = function () {
            // Show green mic
            console.log("recognition start");
            GA.changeMicButton('green');
        };

        Android.internalSpeechRecognitionStopCallback = function (aCode) {
            // Recognition ended
            console.log("recognition stop " + aCode);
            //Android.showToast(aCode);
            GA.changeMicButton('red');
            if (aCode === 'ERROR_SPEECH_TIMEOUT' || aCode === 'ERROR_NO_MATCH') {
                if (!GA.ghostSpeaking) {
                    console.log("recognition again after timeout\n");
                    Android.internalSpeechRecognitionCancel();
                    setTimeout(function () {
                        if (!DH.localAdVisible) {
                            Android.internalSpeechRecognitionStart('en-US');
                        }
                    }, 1000);
                }
            }
            if (aCode === 'ERROR_RECOGNISER_BUSY') {
                if (!GA.ghostSpeaking) {
                    console.log("recognition busy cancel only\n");
                    Android.internalSpeechRecognitionCancel();
                }
            }
        };

        Android.internalSpeechRecognitionCallback = function () {
            // Actual words recognised
            GA.changeMicButton('red');
            var s = Android.internalSpeechRecognitionData();
            console.log('recognition ' + s);
            document.getElementById('question').value = s;
            GA.ask();
        };

        if (!DH.localAdVisible) {
            Android.internalSpeechRecognitionStart(GA.paidOptions.voiceRecognition);
        }
        console.info('recognition start called');

        return true;
    }
    if (aCommand === '#recognition settings') {
        Android.internalSpeechRecognitionSettingsIntent();
        return true;
    }
    if (aCommand === '#speech test') {
        GA.speechTest();
        return true;
    }
    if (aCommand === '#exit' || aCommand === '#quit') {
        Android.finish();
        return true;
    }
    if (aCommand === '#mountains reset') {
        // reset today's mountain play
        DH.storage.writeString('BM.singleDate', DH.date.yyyymmdd(DH.date.yesterday()));
        return true;
    }
    if (aCommand === '#mountains') {
        GA.command('#recognition cancel');
        i = DH.storage.readNumber('BM.singleLevel', 1);
        if (i <= 1) {
            i = 1;
            DH.storage.writeNumber('BM.singleLevel', 1);
        }
        Android.loadUrl('file:///android_asset/mountains/ghostmountains.html');
        return true;
    }
    if (aCommand === '#mountains menu') {
        GA.command('#recognition cancel');
        DH.storage.writeNumber('BM.singleLevel', 0);
        Android.loadUrl('file:///android_asset/mountains/ghostmountains.html');
        return true;
    }
    if (aCommand === '#hs') {
        GA.command('#recognition cancel');
        Android.loadUrl('file:///android_asset/hideandseek.html');
        return true;
    }
    if (aCommand === '#period 3') {
        GA.nagging.period = 3;
        return true;
    }
    if (aCommand === '#nagging') {
        GA.nagging.tic = GA.nagging.period;
        return true;
    }
    if (aCommand === '#nag') {
        GA.nagging.update();
        return true;
    }
    if (aCommand === '#ad') {
        DH.focus.pop();
        Android.keyboardHide();
        GA.command('#recognition cancel');
        GA.changeMicButton('inactive');
        DH.localAd();
        /*
        */
        return true;
    }
    if (aCommand.match('#nagging ')) {
        GA.nagging.action[aCommand.replace('#nagging ', '')]();
        return true;
    }
    if (aCommand === '#lip next') {
        GA.lipCounter = GA.lipPeriod - 2;
        return true;
    }
    if (aCommand === '#lip period 3') {
        GA.lipPeriod = 3;
        return true;
    }
    if (aCommand === '#store self') {
        Android.internalPlayStore('');
        return true;
    }
    if (aCommand === '#store pro') {
        Android.internalPlayStore('com.delphi_update.ghostchatbotpro');
        return true;
    }
    if (aCommand === '#store ai') {
        Android.internalPlayStore('com.delphi_update.alieninvasion');
        return true;
    }
    if (aCommand === '#ai') {
        DH.lip('My creator made cool space shooter game called <u style="color: blue">Alien invasion</u>, check it out!', function () {
            GA.command('#store ai');
        }, 30);
    }
    // just question
    return false;
};

GA.lipCounter = 0;
GA.lipPeriod = 21;

GA.lipAds = function () {
    // lip ads
    //var lip;
    GA.lipCounter++;
    //document.getElementById('debug').textContent = GA.lipCounter;

    if (GA.lipCounter % GA.lipPeriod === 0) {
        console.log('lipCounter=' + GA.lipCounter + ' lipPeriod=' + GA.lipPeriod + ' %=' + (GA.lipCounter % GA.lipPeriod));
        if (Billing.purchaseExists('ghost_unlock_ads')) {
            return;
        }
        // show ad
        GA.command('#ad');
        return true;
        /*
        switch (Math.floor(2 * Math.random())) {
        case 0:
            // pro version
            lip = DH.lip('You can now purchase <u style="color: blue">Ghost chat bot PRO</u> with all paid features unlocked', function () {
                GA.command('#store pro');
            }, 30);
            break;
        case 1:
            // alien invasion
            lip = DH.lip('My creator made cool space shooter game called <u style="color: blue">Alien invasion</u>, check it out!', function () {
                GA.command('#store ai');
            }, 30);
            lip.lip.style.backgroundColor = 'lightgreen';
            lip.lip.style.borderTopColor = 'lightgreen';
            break;
        }
        */
    }
};

GA.continueRecognitionIfSynthIsOff = function () {
    // If speech synthesis is of but recognition is on, continue the recognition now
    if (GA.userWantsMic && !GA.paidOptions.voice && GA.paidOptions.voiceRecognition) {
        GA.changeMicButton('red'); // red because recognition does not start instantly
        if (!DH.localAdVisible) {
            Android.internalSpeechRecognitionStart(GA.paidOptions.voiceRecognition);
        }
    }
};

GA.adCounter = 0;

GA.askLastQuestion = '';
GA.askLastTime = 0;

GA.ask = function () {
    // answer question in textarea and render it
    var e, q, a, o, sp = true;
    e = document.getElementById('question');
    q = e.value.trim();
    o = q;
    console.log('GA.ask', Date.now(), q);

    if (q === 'show me ad for virtual boyfriend') {
        GA.command('#lip next');
    }

    // workaround for recent bug in android speech recognition (duplicate callbacks)
    if ((q === GA.askLastQuestion) && (Math.abs(Date.now() - GA.askLastTime) < 500)) {
        console.warn('Skipping duplicate question');
        return;
    }
    GA.askLastQuestion = q;
    GA.askLastTime = Date.now();

    // clear and focus question
    e.value = '';
    e.focus();
    // do nothing on empty question
    if (q === '') {
        return;
    }
    // special commands
    if (GA.command(q)) {
        return;
    }

    // render question
    GA.renderOne('question', q);
    // find answer
    setTimeout(
        function () {
            var pat;
            // math
            a = GA.math.ask(GHOST.character.basic, q);
            if (a !== null) {
                GA.renderOne('answer', a, false, q, false, true);
                GA.log.push({q: q, a: a});
                GA.saveLog();
                GA.continueRecognitionIfSynthIsOff();
                GA.report(q, a, '', o);
                return;
            }
            // is it simple why question? turn it into full why question
            try {
                q = GHOST.why.modify('GA', q);
            } catch (e) {
                console.error(e);
            }
            // try detect name
            if (GA.name.parse(q)) {
                console.info('username', GA.user.params['$username;']);
            }
            // ghost
            q = GHOST.appendQuestionMark(q);
            a = GHOST.askChain(GA.characters, q, [0.001, 0.01, 0.02, 0.05, 0.1, 0.5, 0.9, 1]);
            // remember answer for "why" plugin
            GHOST.why.lastAnswer.GA = a && a.answer;
            // fix unknown username
            try {
                if (a && a.hasOwnProperty('answer')) {
                    a.answer = GA.name.fixUnknownName(a.answer);
                }
            } catch (e) {
                console.error('fixUnknownName: ' + e);
            }

            // lip ads
            if (GA.lipAds()) {
                sp = false;
            }

            // render answer
            GA.renderOne('answer', a.answer, false, q, false, sp);
            GA.log.push({q: q, a: a.answer});
            GA.saveLog();
            GA.continueRecognitionIfSynthIsOff();

            // nagging
            if (GA.nagging) {
                pat = GA.nagging.update();
            }

            // report
            GA.report(GHOST.log.tokens.join(' '), a.answer + (pat ? ' (' + pat + ')' : ''), '', o);

            // full screen ads
            /*
            GA.adCounter++;
            if (GA.adCounter >= 30) {
                GA.adCounter = 0;
                if (!Billing.purchaseExists('ghost_unlock_ads')) {
                    GA.command('#ad');
                }
            }
            */
        },
        300
    );
};

GA.clear = function () {
    // clear output
    var i, b = document.getElementsByClassName('block');
    for (i = b.length - 1; i >= 0; i--) {
        b[i].parentElement.removeChild(b[i]);
    }
    GA.log = [];
    GA.saveLog();
};

GA.feedback = function () {
    // open feedback form
    DH.focus.pop();
    DH.feedback('https://ghost.sk/feedback/send.php', GA.channel || 'android', '', function (aSent, aResponse) {
        DH.focus.push('question');
        if (aSent) {
            if (aResponse) {
                DH.alert(aResponse, true, false).green();
            } else {
                DH.alert('Something went wrong, the feedback could not be sent. You must be online to send feedback message...', true, false);
            }
        }
    }, true);
};

GA.validateName = function (aText) {
    // options.js needs this
    return aText.toString().trim();
};

GA.showMenu = function () {
    // show context menu

    if (GA.userWantsMic) {
        if (GA.changeMicButtonState === 'green' || GA.changeMicButtonState === 'red') {
            GA.changeMicButton('inactive');
        }
        GA.command('#recognition cancel');
    }

    var m, extra = [];

    // Trying to find the impossible
    try {
        if (!window.hasOwnProperty('Billing')) {
            console.error('window.Billing not found');
        }
        if (window.hasOwnProperty('Billing')) {
            if (!window.Billing.hasOwnProperty('purchaseExists')) {
                DH.splash('Update needed', 'OK', 'pink', 'Please update your Android WebView component to latest version in Google Play Store');
                return;
            }
        }
    } catch (e) {
        console.error('Error 780: ' + e);
    }

    if (!Billing || !Billing.purchaseExists) {
        DH.splash('Update needed', 'OK', 'pink', 'Please update your Android WebView component to latest version in Google Play Store');
        return;
    }

    if (Billing.purchaseExists('ghost_unlock_virtual_town')) {
        extra.push('Virtual town');
    }
    if (Billing.purchaseExists('ghost_unlock_mountains')) {
        extra.push('Ghost mountains');
    }
    if (Billing.purchaseExists('ghost_unlock_trash')) {
        extra.push('Trash everything');
        if (GA.pro) {
            extra.push('Hide and seek');
        }
    }
    m = DH.contextMenu(['Feedback', 'Options', 'Edits', 'Clear'], function (aLabel) {
        if (aLabel === 'Virtual town') {
            aLabel = 'town';
        }
        if (aLabel === 'Ghost mountains') {
            aLabel = 'mountains menu';
        }
        if (aLabel === 'Hide and seek') {
            aLabel = 'hs';
        }
        if (aLabel === 'Trash everything') {
            DH.storage.writeBoolean('TE.unlocked', true);
            aLabel = 'trash';
        }
        GA.command('#' + aLabel.toLowerCase());
    }, extra);
    m.menu.style.left = '1ex';
    m.menu.style.bottom = '1ex';
    if (m.menu2) {
        m.menu2.style.right = '1ex';
        m.menu2.style.bottom = '1ex';
    }
};

GA.renderRecentConversations = function () {
    // Render recent conversations
    var i;
    document.getElementById('container').innerText = '';
    for (i = 0; i < GA.log.length; i++) {
        if (GA.log[i].q) {
            GA.renderOne('question', GA.log[i].q, true);
        }
        if (GA.log[i].e || GA.log[i].a) {
            GA.renderOne('answer', GA.log[i].e || GA.log[i].a, true, GA.log[i].q);
        }
    }
    // scroll down
    setTimeout(function () {
        document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
    }, 500);
    // scroll down
    setTimeout(function () {
        document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
        // if user name is know say hello now
        if (GA.user.params['$username;']) {
            GA.renderOne('answer', 'Hello ' + GA.user.params['$username;'], false, null, false, true);
        }
    }, 1000);
    // make speech faster on first real answer
    if (GA.paidOptions.voice) {
        Android.speechInit(null, GA.paidOptions.voice);
    }
};

GA.billing = function (aDebug) {
    // Show billing
    DH.focus.pop();
    Android.keyboardHide();
    //try {
        //document.getElementById('download1').addEventListener('click', XX.onDownload1, true);
    var products = {
        ghost_unlock_icon: {
            text: "Change your and Ghost's icon in the chat window to any picture or photo on your phone",
            price: "$1"
        },
        ghost_unlock_theme_dark: {
            text: "Change chat window color theme to dark (white text is displayed on black background)",
            price: "$1"
        },
        ghost_unlock_theme_pink: {
            text: "Change chat window color theme to pink",
            price: "$1"
        },
        ghost_unlock_ads: {
            text: "Ads will not be displayed",
            price: "$1"
        }
    };
    if (aDebug === true) {
        products["android.test.purchased"] = {
            text: "android.test.purchased",
            price: "$1"
        };
        products["android.test.canceled"] = {
            text: "android.test.canceled",
            price: "$1"
        };
        products["android.test.item_unavailable"] = {
            text: "android.test.item_unavailable",
            price: "$1"
        };
    }
    DH.billing.show(products);
  /*
    } catch (e) {
        alert(e);
    }
    */
};

GA.speechTest = function () {
    DH.focus.pop();
    DH.options2(function (o) {
        o.h1('Speech test');

        var log2, log = o.noteBig('Log: ');

        Android.internalSpeechPartialCallback = function () {
            log.textContent += 'PartialCB ';
        };
        Android.internalSpeechCallback = function () {
            log.textContent += 'FullCB ';
        };

        o.button('First sentence', "Speak", function () { Android.speech('This is first very long sentence.', "en-US-language", function () { log.textContent += '1done '; }); });
        o.button('Second sentence', "Speak", function () { Android.speech('Second sentence is also very long.', "en-US-language", function () { log.textContent += '2done '; }); });
        o.button('Third sentence', "Speak", function () { Android.speech('Short third sentence.', "en-US-language", function () { log.textContent += '2done '; }); });

        o.button('Console', "Show", function () { DH.console.show(); });
        o.button('Console data', "Show", function () { DH.console.showRaw(Android.consoleData()); });

        log2 = o.noteBig('Log2: ');

        Android.internalSpeechRecognitionCallback = function () {
            log2.textContent += Android.internalSpeechRecognitionData() + '; ';
        };

        o.button('Recognition1', "Start", function () { Android.internalSpeechRecognitionStart(GA.paidOptions.voiceRecognition); });
        o.button('Recognition2', "Stop", function () { Android.internalSpeechRecognitionStop(); });
        o.button('Voices', "Voices", function () {
            try {
                console.log('a');
                Android.internalSpeechRecognitionVoicesCallback = function (aLanguages) {
                    console.log('b');
                    alert('cb ok');
                    alert('aLanguages=' + JSON.stringify(aLanguages));
                    console.log('c', aLanguages);
                };
                console.log('d');
                Android.internalSpeechRecognitionVoices();
                console.log('e');
                /*


                Android.speechRecognitionVoices(function (aVoices) {
                    try {
                        alert(JSON.stringify(aVoices));
                    } catch (e) {
                        alert('Chyba2: ' + e);
                    }
                });
                */
            } catch (e) {
                console.log('f');
                alert('Chyba1: ' + e);
            }
            console.log('g');
        });

        o.saveCancel(function () {
            console.log('save callback');
            o.hide();
            DH.focus.push('question');
        });

    });
};

GA.applyTheme = function (aTheme) {
    // apply css theme
    console.info('GA.applyTheme', aTheme);
    var e = document.getElementById('theme');
    e.href = "theme_" + aTheme + ".css";
};

GA.applyThemeAndSave = function (aTheme) {
    // apply css theme and save it to options
    GA.applyTheme(aTheme);
    GA.paidOptions.theme = aTheme;
    GA.paidOptionsSave();
};

DH.metrics.init(GA.appName, GA.appVersion);
DH.metrics.errorLogger(10);

window.addEventListener('DOMContentLoaded', function () {
    // initialize window
    DH.metrics.log('DOMContentLoaded');

    document.getElementById('ask').addEventListener('click', GA.ask);
    document.getElementById('showmenu').addEventListener('click', GA.showMenu);

    DH.focus.push('question');

    /*
    var sss = '';

    document.getElementById('question').addEventListener('input', function (event) {
        sss += 'input ' + event.keyCode;
        document.getElementById('debug').textContent = sss;
    });
    */

    document.getElementById('question').addEventListener('input', function (event) {
        // enter answers the question
        if (document.getElementById('question').value.indexOf('\n') > 0) {
        //sss += event.keyCode + ', ';
        //document.getElementById('debug').textContent = sss;
        //if (event.keyCode === 13) {
            GA.ask();
            event.preventDefault();
        }
    });

    // on star apply user theme from options because it is faster then billing
    if (GA.paidOptions.theme) {
        GA.applyTheme(GA.paidOptions.theme);
    }

    // render recent conversation
    GA.renderRecentConversations();

    // A/B testing of options icon
    if (DH.metrics.ab(2) === 1) {
        document.getElementById('showmenu').style.backgroundImage = 'url(icon/menu32_1.png)';
    }

    console.log('normal start');

    // mic button
    document.getElementById('mic').onclick = function () {
        //
        console.log('mic button pressed, cur state=' + GA.changeMicButtonState + ' uwm=' + GA.userWantsMic + ' gs=' + GA.ghostSpeaking);
        switch (GA.changeMicButtonState) {
        case "green":
            // is listening, user wants stop listening
            GA.userWantsMic = false;
            GA.changeMicButton('red');
            GA.command('#recognition cancel');
            GA.changeMicButton('inactive');
            break;
        case "red":
            // is waiting for something, let it be
            GA.command('#recognition cancel');
            GA.changeMicButton('inactive');
            break;
        case "inactive":
            // is inactive, start listening
            GA.userWantsMic = true;
            GA.changeMicButton('red');
            GA.command('#recognition start');
            break;
        case "hidden":
            // impossible
            break;
        }
    };
    if (GA.paidOptions.voiceRecognition) {
        GA.changeMicButton('inactive');
    } else {
        GA.changeMicButton('hidden');
    }

    //GA.options(true);
    //GA.pfi();

    // to reset return from BM
    Android.setBack('file:///android_asset/android.html');
});

