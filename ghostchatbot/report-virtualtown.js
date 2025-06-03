// Report questions, answers and edits back to server (I include usable data in next versions)
"use strict";
// globals: DH, navigator, Android, window

var VT = VT || {};

VT.appName = 'virtualtown';
VT.appVersion = '201';
VT.channel = VT.channel || 'virtualtown201';

VT.reportLast = null;

VT.reportEnabled = DH.storage.readBoolean('VT.reportEnabled', true);

VT.report = function (aQuestion, aAnswer, aWho, aOriginal) {
    // send report to the server, version 2 used on android
    if (window.hasOwnProperty('Android') && Android.hasOwnProperty('isConnectedWifi') && !Android.isConnectedWifi()) {
        console.log("no wifi, no report");
    }
    try {
        if (navigator.onLine && VT.reportEnabled) {
            DH.request.post(
                'https://ghost.sk/ghost/online.php',
                'question=' + encodeURIComponent(aQuestion) +
                    '&answer=' + encodeURIComponent(aAnswer) +
                    '&who=' + encodeURIComponent(aWho || VT.channel) +
                    '&original=' + encodeURIComponent(aOriginal || aQuestion),
                function (aReply) {
                        VT.reportLast = aReply;
                        // increment gold
                        VT.gold++;
                        if (VT.gold % 10 === 0) {
                            DH.storage.writeNumber('VT.gold', VT.gold);
                        }
                    }
            );
        } else {
            VT.gold++;
            console.info('offline', navigator.onLine);
        }
    } catch (e) {
        console.warn(e);
    }
};
