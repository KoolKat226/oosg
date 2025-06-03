// Report questions, answers and edits back to server (I include usable data in next versions)
"use strict";
// globals: DH, navigator, Android, window

var GA = GA || {};

GA.appName = 'ga';
GA.appVersion = '201';
GA.channel = GA.channel || 'ga201';

GA.reportLast = null;

GA.reportEnabled = DH.storage.readBoolean('GA.reportEnabled', true);
if (Math.random() > 0.1) {
    console.log('report randomly disabled');
    GA.reportEnabled = false;
}

GA.report = function (aQuestion, aAnswer, aWho, aOriginal) {
    // send report to the server, version 2 used on android
    if (window.hasOwnProperty('Android') && Android.hasOwnProperty('isConnectedWifi') && !Android.isConnectedWifi()) {
        console.log("no wifi, no report");
    }
    try {
        if (navigator.onLine && GA.reportEnabled) {
            DH.request.post(
                'https://ghost.sk/ghost/online.php',
                'question=' + encodeURIComponent(aQuestion) +
                    '&answer=' + encodeURIComponent(aAnswer) +
                    '&who=' + encodeURIComponent(aWho || GA.channel) +
                    '&original=' + encodeURIComponent(aOriginal || aQuestion),
                function (aReply) {
                        GA.reportLast = aReply;
                    }
            );
        } else {
            console.info('offline', navigator.onLine);
        }
    } catch (e) {
        console.warn(e);
    }
};
