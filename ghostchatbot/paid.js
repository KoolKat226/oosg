// Paid features (profile photos change, color theme)
"use strict";
// globals: document, window, Android, DH, Billing

var GA = GA || {};

GA.paidOptions = DH.storage.readObject('GHOST_PAID_OPTIONS', {icon: {user: '', ghost: ''}, theme: 'light', voice: '', voiceRecognition: ''});

GA.paidOptionsSave = function () {
    // Save paid options to storage
    DH.storage.writeObject('GHOST_PAID_OPTIONS', GA.paidOptions);
};

GA.profilePictureUpload = function (aWhich, aSuccessCallback) {
    // Upload profile picture (for user or ghost)
    var path;

    // fallback on desktop
    if (!Android.isReal()) {
        path = prompt(aWhich + ' icon URL', GA.paidOptions.icon[aWhich] || 'http://');
        if (path) {
            aSuccessCallback(aWhich, path);
        }
        return;
    }

    // android
    try {
        path = Android.filesDir() + '/internal/';
        Android.setReadBytes(true);

        Android.fileInternalSaveBytesCallback = function () {
            var mime = Android.getBytesMimeType();
            Android.clearCache();
            if (mime === 'image/png') {
                aSuccessCallback(aWhich, path + aWhich + '.png');
            } else if (mime === 'image/gif') {
                aSuccessCallback(aWhich, path + aWhich + '.gif');
            } else if (mime === 'image/jpeg') {
                aSuccessCallback(aWhich, path + aWhich + '.jpg');
            }
        };

        Android.dataCallback = function () {
            var mime = Android.getBytesMimeType();
            console.log('mime ' + typeof mime + ' (' + mime + ')');
            if (!mime) {
                if (GA.paidOptions.icon[aWhich]) {
                    if (confirm('Do you want to restore to original icon?')) {
                        aSuccessCallback(aWhich, '');
                    }
                }
            } else if (mime === 'image/png') {
                Android.fileInternalSaveBytes(aWhich + '.png');
            } else if (mime === 'image/gif') {
                Android.fileInternalSaveBytes(aWhich + '.gif');
            } else if (mime === 'image/jpeg') {
                Android.fileInternalSaveBytes(aWhich + '.jpg');
            } else {
                alert('Only JPG, GIF and PNG images are supported (' + mime + ')');
            }
        };

        Android.chooseFile('image/*');
    } catch (e) {
        alert(e);
    }
};

GA.humanSku = function (aSku) {
    // Human readable purchase SKU name
    var human = {
        "ghost_unlock_icon": "Icons",
        "ghost_unlock_theme_dark": "Dark theme",
        "ghost_unlock_theme_pink": "Pink theme",
        "ghost_unlock_virtual_town": "Virtual town",
        "ghost_unlock_mountains": "Ghost mountains",
        "ghost_unlock_trash": "Trash everything",
        "ghost_unlock_ads": "No ads"
    };
    return human.hasOwnProperty(aSku) ? human[aSku] : aSku;
};

GA.feedbackPurchases = function () {
    // open feedback form + add purchases
    DH.focus.pop();
    var pu = Billing.purchases(), f;
    f = DH.feedback('https://ghost.sk/feedback/send.php', GA.channel || 'android', JSON.stringify(pu), function (aSent, aResponse) {
        DH.focus.push('question');
        if (aSent) {
            if (aResponse) {
                DH.alert(aResponse, true, false).green();
            } else {
                DH.alert('Something went wrong, the feedback could not be sent. You must be online to send feedback message...', true, false);
            }
        }
    }, true);

    function purchasesToText() {
        var sku, a = [];
        for (sku in pu) {
            if (pu.hasOwnProperty(sku)) {
                a.push(GA.humanSku(sku) + ': ' + pu[sku].orderId);
            }
        }
        return a.join('\n');
    }

    f.textarea.value = 'You made following purchases:\n\n' + purchasesToText() + '\n\n' + 'Add your email in the input below and send this feedback message.';
    f.emailInput.required = true;
};

