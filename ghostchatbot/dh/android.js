// Dummy Android object so that non-android apps won't crash trying calling it
// require: import
"use strict";
// globals: Android, window, document, setTimeout, DH, localStorage
// zzzrequire: assert,cookie,flash,import,import2,metrics,param,request,spinner,splash,storage

if (typeof window.Android !== 'object') {
    console.log('Creating dummy Android object');

    window.Android = (function () {
        var self = {},
            back = 'file:///android_asset/android.html',
            build = '2017-11-30 10:05:00 build 1',
            data = '',
            cdata = "",
            history = [];

        self.hasPermissionWriteExternalStorage = function () {
            // desktop always has permission
            return true;
        };

        self.isConnectedWifi = function () {
            return true;
        };

        self.isConnectedMobile = function () {
            return false;
        };

        self.busyShow = function () {
            console.log('Android.busyShow()');
        };
        self.busyHide = function () {
            console.log('Android.busyHide()');
        };

        cdata = "06:49:35> LOG> file:///android_asset/alpha.js(12): Sample log message\n06:49:36> WARNING> file:///android_asset/alpha.js(34): Sample log warninge\n06:49:37> ERROR> file:///android_asset/alpha.js(45): Sample log error\n06:49:38> LOG> file:///android_asset/alpha.js(2332): Anorther log message\n";
        cdata = cdata.split('\n');

        self.consoleData = function () {
            var i, a = [];
            for (i = 0; i < 10; i++) {
                a.push(cdata.shift());
            }
            return a.join('\n');
        };

        self.askPermissionWriteExternalStorage = function () {
            // desktop always has permission
            self.permissionCallback(true);
        };

        self.fullscreen = function (aFullscreen) {
            console.log('requesting fullscreen mode ' + aFullscreen);
        };

        self.portrait = function () {
            console.log('requesting portrait mode');
        };

        self.landscape = function () {
            console.log('requesting landscape mode');
        };

        self.isReal = function () {
            // return false because this is not real android
            console.log('Android.isReal', false);
            return false;
        };

        self.loadUrl = function (aUrl) {
            // change webview url
            console.log('Android.loadUrl', aUrl);
            var relative = document.location.pathname.split('/').slice(0, -1).join('/'), u; // slice is shallow
            relative = relative || "";
            u = aUrl.toString().replace('file:///android_asset' + relative, '');
            if (u.substr(0, 1) === '/') {
                u = u.substr(1);
            }
            console.log('u=', u);
            u = u.replace('file:///android_asset/', '');
            console.log('u2=', u);
            document.location = u;
        };

        self.reload = function () {
            // change webview url
            console.log('Android.reload');
            document.location.reload();
        };

        self.getBuild = function () {
            // return unique build identifier (usually date)
            console.log('Android.getBuild', build);
            return build;
        };

        self.setUserAgent = function (aUserAgent) {
            // set location where to go when user press back button
            console.log('Android.setUserAgent', aUserAgent);
        };

        self.setBack = function (aUrl) {
            // set location where to go when user press back button
            console.log('Android.setBack', aUrl);
            back = aUrl;
        };

        self.getBack = function () {
            // return current url set on back button
            console.log('Android.getBack', back);
            return back;
        };

        self.setShared = function (aData) {
            // set shared data
            console.log('Android.setShared', aData);
            try {
                if (typeof localStorage === 'object') {                 // localStorageDelete
                    localStorage.setItem('Android.shared', aData);      // localStorageDelete
                }                                                       // localStorageDelete
            } catch (ignore) {
            }
        };

        self.getShared = function () {
            // get shared data
            try {
                if (typeof localStorage === 'object') {                 // localStorageDelete
                    var s = localStorage.getItem('Android.shared');     // localStorageDelete
                    console.log('Android.getShared', s);                // localStorageDelete
                    return s;                                           // localStorageDelete
                }                                                       // localStorageDelete
            } catch (ignore) {
            }
        };

        self.setData = function (aData) {
            // set callback data
            data = aData;
            console.log('Android.setData', aData.length);
            try {
                if (typeof localStorage === 'object') {                 // localStorageDelete
                    localStorage.setItem('Android.data', aData);        // localStorageDelete
                }                                                       // localStorageDelete
            } catch (ignore) {
            }
        };

        self.getData = function () {
            // get callback data
            try {
                if (typeof localStorage === 'object') {                 // localStorageDelete
                    var s = localStorage.getItem('Android.data');       // localStorageDelete
                    return s;                                           // localStorageDelete
                }                                                       // localStorageDelete
            } catch (ignore) {
            }
            console.log('Android.getData', data.length);
            return data;
        };

        self.showToast = function (aMessage) {
            // Show small piece of text at the bottom of screen
            console.log('Android.showToast', aMessage);
            var div, toast;
            div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.bottom = '1cm';
            div.style.left = '1cm';
            div.style.right = '1cm';
            div.style.bottom = '1cm';
            div.style.zIndex = 111;
            div.style.textAlign = 'center';
            div.style.pointerEvents = 'none';
            toast = document.createElement('div');
            toast.textContent = aMessage;
            toast.style.display = 'inline-block';
            toast.style.backgroundColor = 'rgba(0,0,0,0.7)';
            toast.style.color = 'white';
            toast.style.padding = '1ex';
            toast.style.borderRadius = '2ex';
            document.body.appendChild(div);
            setTimeout(function () {
                div.parentElement.removeChild(div);
            }, 5000);
            div.appendChild(toast);
        };

        self.keyboardShow = function () {
            // show soft keyboard
            console.log('Android.keyboardShow');
        };

        self.keyboardHide = function () {
            // hide soft keyboard
            console.log('Android.keyboardHide');
        };

        self.keyboardImplicit = function () {
            // show soft keyboard (version 2)
            console.log('Android.keyboardImplicit');
        };

        self.keyboardUnspecified = function () {
            // soft keyboard as is
            console.log('Android.keyboardUnspecified');
        };

        self.dataCallback = function () {
            // called when chooseFile is ready
            console.log('Android.dataCallback');
        };

        self.clearCache = function () {
            // clear webView cache
            console.log('Android.clearCache');
        };

        self.chooseFile = function (aFilter) {
            // let user choose file
            console.log('Android.chooseFile', aFilter);
            if (!DH || !DH.import) {
                var s = prompt('Paste file content here ' + aFilter, '');
                if (s) {
                    data = s;
                    localStorage.setItem('Android.data', data);
                    self.dataCallback();
                }
                return;
            }
            DH.import(function (aData) {
                data = aData;
                localStorage.setItem('Android.data', data);
                self.dataCallback();
            }, function () {
                data = '';
                localStorage.setItem('Android.data', data);
                self.dataCallback();
            });
        };

        self.getHistory = function () {
            return history.join('\n');
        };

        self.requests = function () {
            return ["http://localhost/", "http://example.com/", "http://example.com/favicon.ico"].join('\n');
        };

        self.historyPop = function () {
            return history.pop();
        };

        // speech

        self.internalSpeechInit = function () {
            console.log('Android.internalSpeechInit()');
            setTimeout(function () {
                if (self.internalSpeechInitCallback) {
                    self.internalSpeechInitCallback(true);
                }
            }, 1000);
        };

        self.internalSpeechFakeBuffer = [];

        self.internalSpeech = function (aMessage, aVoice) {
            self.internalSpeechFakeBuffer.push(aMessage);
            var dur = 1000 + aMessage.length * 200;
            console.log('Android.internalSpeech', aMessage, aVoice, dur + 'ms');
            setTimeout(function () {
                var s = self.internalSpeechFakeBuffer.shift();
                console.log('finished: ' + s, 'remaining', self.internalSpeechFakeBuffer.length);
                if (self.internalSpeechFakeBuffer.length <= 0) {
                    self.internalSpeechCallback();
                } else {
                    self.internalSpeechPartialCallback();
                }
                /*
                if (Android.internalSpeechUtteranceCompletedCallback) {
                    Android.internalSpeechUtteranceCompletedCallback();
                }
                if (Android.internalSpeechUtteranceCompletedCallback2) {
                    Android.internalSpeechUtteranceCompletedCallback2();
                }
                */
            }, dur);
        };

        self.internalSpeechPartialCallback = function () {
            console.log('internalSpeechPartialCallback');
        };

        self.internalSpeechRecognitionVoicesCallback = function () {
            console.log('internalSpeechRecognitionVoicesCallback');
        };
        self.internalSpeechRecognitionVoices = function () {
            self.internalSpeechRecognitionVoicesCallback('en-001\nen-GB\nen-US');
        };

        self.internalSpeechRecognitionAvailable = function () {
            return true;
        };

        self.internalSpeechRecognitionData = function () {
            return "Sample sentence";
        };

        self.internalSpeechRecognitionStart = function (aLanguage) {
            console.log('internalSpeechRecognitionStart ' + aLanguage);
            if (self.internalSpeechRecognitionCallback) {
                self.internalSpeechRecognitionCallback();
            }
        };

        self.internalSpeechRecognitionStop = function () {
            console.log('internalSpeechRecognitionStop');
        };

        self.internalSpeechRecognitionCancel = function () {
            console.log('internalSpeechRecognitionCancel');
        };

        self.internalSpeechRecognitionVoice = function (aVoice) {
            console.log('Speech recognition voice set to ' + aVoice);
        };

        self.internalSpeechPrefetchVoice = function (aVoice) {
            console.log('internalSpeechPrefetchVoice ' + aVoice);
        };

        self.internalSpeechRecognitionUserPressedMicButton = function () {
            console.log('internalSpeechRecognitionUserPressedMicButton');
        };

        self.micI = 0;

        self.internalPermissionRecordAudioAllowed = function () {
            self.micI++;
            return self.micI % 2 === 0;
        };

        self.internalPermissionRecordAudioRequest = function () {
            if (confirm('Should grant MIC permission?')) {
                self.internalPermissionCallback('RECORD_AUDIO');
            }
        };

        self.internalPlayStore = function (aPackage) {
            var a = document.createElement('a');
            a.target = '_blank';
            a.href = "https://play.google.com/store/apps/details?id=" + encodeURIComponent(aPackage);
            a.click();
        };

        return self;
    }());
}

Android.withPermissionWriteExternalStorage = function (aCallback, aCallbackData) {
    // run callback if user has write permission
    var b = Android.hasPermissionWriteExternalStorage();
    console.log('b', b, typeof b, typeof Android.hasPermissionWriteExternalStorage);
    if (b) {
        console.log('has permission on start');
        aCallback(aCallbackData);
        return;
    }
    Android.permissionCallback = function (aGranted) {
        console.log('granted', aGranted);
        if (aGranted) {
            aCallback(aCallbackData);
        } else {
            Android.showToast('No write permission!');
        }
    };
    Android.askPermissionWriteExternalStorage();
};

Android.getParam = function (aKey, aDefault) {
    // Passing variables between multiple pages using Android getShared/setShared
    var d = Android.getShared() || '{}';
    try {
        d = JSON.parse(d);
        return d.hasOwnProperty(aKey) ? d[aKey] : aDefault;
    } catch (e) {
        console.warn('DH.param.get ' + aKey + ': ' + e);
        return aDefault;
    }
};

Android.getParamInt = function (aKey, aDefault) {
    // Return param as number
    aDefault = aDefault || 0;
    var s = Android.getParam(aKey, aDefault);
    if (typeof s !== 'number') {
        return aDefault;
    }
    if (Number.isNaN(s)) {
        return aDefault;
    }
    return s;
};

Android.setParam = function (aKey, aValue) {
    // Passing variables between multiple pages using Android getShared/setShared
    var d = Android.getShared() || {};
    try {
        d = JSON.parse(d);
        d[aKey] = aValue;
        Android.setShared(JSON.stringify(d));
    } catch (e) {
        d = {};
        d[aKey] = aValue;
        Android.setShared(JSON.stringify(d));
    }
};

// Speech - Desktop fallback

Android.internalSpeechVoices = Android.internalSpeechVoices || function () {
    return ['de-de', 'cs-cz', 'da-dk', 'bn', 'en-AU-language', 'en-au-x-afh-local', 'en-au-x-afh-network', 'en-au-x-aua-local', 'en-US-language', 'en-us-x-sfg#female_1-local', 'en-us-x-sfg#female_2-local', 'sk', 'uk-ua'].join('\n');
};

Android.internalSpeechInit = Android.internalSpeechInit || function () {
    console.warn('fake Android.internalSpeechInit');
    setTimeout(function () {
        if (Android.internalSpeechInitCallback) {
            Android.internalSpeechInitCallback(true);
        }
    }, 1000);
};

// Speech - Nicer API

Android.speechReady = false;

Android.speechInstallVoices = function () {
    // Show window with voice installation
    Android.internalSpeechInstallVoices();
};

Android.speechMaxLength = function (aCallback) {
    // Detect max text length
    Android.internalSpeechMaxLengthCallback = aCallback;
    Android.internalSpeechMaxLength();
};

Android.speechInit = function (aCallback, aVoice) {
    // Initialize speech system
    if (Android.speechInitCalled) {
        console.warn('Another Android.speechInit already in progress');
        return;
    }
    Android.speechInitCalled = true;

    Android.internalSpeechInitCallback = function (aSuccess) {
        // check if voices are ready
        console.log('Speech ' + aSuccess);
        var voices = Android.internalSpeechVoices();
        // occasionally voices are not ready on startup, wait a little bit
        if (voices.length <= 1) {
            // Android.showToast('Waiting for voices...');
            setTimeout(function () {
                voices = Android.internalSpeechVoices();
                console.log(voices.split('\n').length + ' voices now');
                Android.speechReady = aSuccess;
                if (aCallback) {
                    aCallback(aSuccess);
                }
                if (aVoice) {
                    Android.internalSpeechPrefetchVoice(aVoice);
                }
            }, 1500);
        } else {
            Android.speechReady = aSuccess;
            console.log(voices.split('\n').length + ' voices ready');
            if (aCallback) {
                aCallback(aSuccess);
            }
            if (aVoice) {
                Android.internalSpeechPrefetchVoice(aVoice);
            }
        }
    };

    Android.internalSpeechInit();
};

Android.speechFinishedCallback = function () {
    console.warn('speechFinishedCallback');
};

/*
Android.internalSpeechUtteranceCompletedCallback2 = function () {
    //
    console.log('speech finished: ' + s + ' (remaining ' + Android.speechBuffer.join(';') + ')');
    var i = Android.speechBuffer.indexOf(aMessage);
    console.log('speech finished: ' + aMessage + ' (index ' + i + ')');
    if (Android.speechBuffer.indexOf(aMessage) >= 0) {
        Android.speechBuffer.splice(i, 1);
    }
    if (Android.speechBuffer.length <= 0) {
        Android.speechFinishedCallback();
    }
};
*/

Android.internalSpeechCallback = function () {
    // All speech finished
    console.log('Android.internalSpeechCallback()');
};

Android.speech = function (aMessage, aVoice) {
    // Say message using given voice
    try {
        if (!Android.speechInitCalled) {
            Android.speechInit(function (aSuccess) {
                if (aSuccess) {
                    Android.internalSpeech(aMessage || "Hello world!", aVoice || "en-US-language");
                    /*
                    if (aCallback) {
                        aCallback(aMessage, aVoice);
                    }
                    */
                }
            }, aVoice);
            return false;
        }
        if (!Android.speechReady) {
            console.warn('Speech not ready for: ' + aMessage);
            return;
        }
        Android.internalSpeech(aMessage || "Hello world!", aVoice || "en-US-language");
        /*
        if (aCallback) {
            aCallback(aMessage, aVoice);
        }
        */
    } catch (e) {
        console.error('Speech error: ' + e);
    }
};

Android.speechVoices = function () {
    // Return array of available voices
    return Android.internalSpeechVoices().trim().split('\n');
};

Android.speechVoiceName = function (aVoice) {
    // Human readable voice name, e.g. "cs-cz-x-jfs-network" --> "Czech network #2"
    var parts = aVoice.split('-'),
        one = parts.slice(0, 1).join('-').toLowerCase(), // en     // slice is shallow
        two = parts.slice(0, 2).join('-').toLowerCase(), // en-us  // slice is shallow
        net = aVoice.match('network') ? ' network' : '',
        sex = aVoice.match('female') ? ' female' : aVoice.match('male') ? ' male' : '',
        language = {
            "bn": "Bengali",
            "bn-bd": "Bengali (Bangladesh)",
            "bn-in": "Bengali (India)",
            "bs": "Bahamas",
            "ca": "Canada",
            "cmn-cn": "Chinese Mandarin (China)",
            "cmn-tw": "Chinese Mandarin (Taiwan)",
            "cs-cz": "Czech",
            "cy": "Cyprus",
            "da-dk": "Danish",
            "de-de": "German",
            "el-gr": "Greek",
            "en-au": "English (Australia)",
            "en-gb": "English (British)",
            "en-in": "English (India)",
            "en-us": "English (American)",
            "es-es": "Spanish (Spain)",
            "es-us": "Spanish (American)",
            "et-ee": "Estonian",
            "fi-fi": "Finnish",
            "fil-ph": "Filipino",
            "fr-ca": "French (Canada)",
            "fr-fr": "French (France)",
            "hi-in": "Hindi",
            "hr": "Croatian",
            "hu-hu": "Hungarian",
            "id-id": "Indonesian",
            "it-it": "Italian",
            "ja-jp": "Japanese",
            "jv-id": "Javanese",
            "km-kh": "Khmer",
            "ko-kr": "Korean",
            "ku": "Kurdish",
            "la": "Latin",
            "nb-no": "Norwegian",
            "ne-np": "Nepali",
            "nl-nl": "Dutch",
            "pl-pl": "Polish",
            "pt-br": "Portuguese (Brasil)",
            "pt-pt": "Portuguese (Portugal)",
            "ro-ro": "Romanian",
            "ru-ru": "Russian",
            "si-lk": "Sinhala (Sri Lanka)",
            "sk": "Slovak",
            "sk-sk": "Slovak",
            "sq": "Albanian",
            "sr": "Serbian",
            "su-id": "Sundanese (Indonesia)",
            "sv-se": "Swedish",
            "sw": "Swahili",
            "ta": "Tamil",
            "th-th": "Thai",
            "tr": "Turkish",
            "uk-ua": "Ukrainian",
            "vi-vn": "Vietnamese",
            "yue-hk": "Chinese Cantonese (Hong Kong)",
            "zh-cn": "Chinese Simplified",
            "zh-tw": "Chinese Traditional (Taiwan)",
            "zh-hk": "Chinese Traditional (Hong Kong)"
        };
    //console.warn('p', parts, 'o', one, 't', two, 'n', net);
    if (language[two]) {
        return language[two] + sex + net;
    }
    if (language[one]) {
        return language[one] + sex + net;
    }
    return aVoice;
};

Android.speechVoiceNames = function (aVoicesArray) {
    // Generate hashmap with unique human readable voice names for all voices
    var i, s, uni = {}, counter = {};
    for (i = 0; i < aVoicesArray.length; i++) {
        s = Android.speechVoiceName(aVoicesArray[i]);
        if (!counter.hasOwnProperty(s)) {
            counter[s] = 1;
        } else {
            counter[s]++;
            s += ' #' + counter[s];
        }
        uni[aVoicesArray[i]] = s;
    }
    return uni;
};

Android.speechVoicesToSelect = function (aSelectElement, aPrefillValue) {
    // Fill voices to select element
    var k, s, i, o, voices = Android.speechVoices(), names, arr = [];
    names = Android.speechVoiceNames(voices);

    // sort languages alphabetically by name
    for (k in names) {
        if (names.hasOwnProperty(k)) {
            arr.push({code: k, name: names[k]});
        }
    }
    arr.sort(function (a, b) {
        var ae = a.name.match(/english/i) ? 1 : 0,
            be = b.name.match(/english/i) ? 1 : 0;

        // if both english or both non-english sort by name
        if (ae === be) {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        }
        // if one is english that will always be first
        if (ae) {
            return -1;
        }
        if (be) {
            return 1;
        }
        return 0;
    });

    // add options to select
    s = typeof aSelectElement === 'string' ? document.getElementById(aSelectElement) : aSelectElement;
    s.textContent = '';

    o = document.createElement('option');
    o.value = '';
    o.textContent = 'None';
    s.appendChild(o);

    for (i = 0; i < arr.length; i++) {
        o = document.createElement('option');
        o.value = arr[i].code;
        o.textContent = arr[i].name;
        s.appendChild(o);
    }
    if (aPrefillValue) {
        s.value = aPrefillValue;
    }
    console.log(voices.length + ' voices loaded');
    return voices;
};

Android.speechRecognitionVoices = function (aCallback) {
    // Detect available speech recognition voices, pass them as array to callback
    Android.internalSpeechRecognitionVoicesCallback = function (aLanguages) {
        if (!aLanguages) {
            aLanguages = 'en-001\nen-US\nen-US-language';
        }
        aCallback(aLanguages.split('\n').sort());
    };
    Android.internalSpeechRecognitionVoices();
};

Android.speechRecognitionVoicesHuman = {
    // Human readable names for voice recognition voices
    "en-001": "English (World)",
    "en-AU": "English (Australia)",
    "en-CA": "English (Canada)",
    "en-GB": "English (Great Britain)",
    "en-GH": "English (Ghana)",
    "en-IE": "English (Ireland)",
    "en-IN": "English (India)",
    "en-KE": "English (Kenya)",
    "en-NG": "English (Nigeria)",
    "en-NZ": "English (New Zealand)",
    "en-PH": "English (Philippines)",
    "en-TZ": "English (Tanzania)",
    "en-US": "English (USA)",
    "en-US-language": "English (default)",
    "en-ZA": "English (South Africa)",
    "sk-SK": "Slovak"
};

Android.speechRecognitionVoicesSelect = function (aElementOrId, aPrefillValue) {
    // Fill voices to select element
    Android.speechRecognitionVoices(function (aVoices) {
        var o, i, e = typeof aElementOrId === 'string' ? document.getElementById(aElementOrId) : aElementOrId;
        e.innerHTML = '<option value="">none</option>';
        for (i = 0; i < aVoices.length; i++) {
            if (Android.speechRecognitionVoicesHuman.hasOwnProperty(aVoices[i])) {
                o = document.createElement('option');
                o.value = aVoices[i];
                o.textContent = Android.speechRecognitionVoicesHuman[aVoices[i]];
                e.appendChild(o);
            }
        }
        if (aPrefillValue) {
            e.value = aPrefillValue;
        }
    });
};

Android.speechRecognition = function (aCallback, aLanguage) {
    // Single voice recognition
    Android.internalSpeechRecognitionCallback = function () {
        aCallback(Android.internalSpeechRecognitionData());
    };
    Android.internalSpeechRecognitionStart(aLanguage || "en-US");
};

Android.voicePitch = Android.voicePitch || function (aPitch) {
    console.log('Voice pitch ' + aPitch);
};
