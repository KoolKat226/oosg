// Show dialog for sending feedback
// require: request, assert
"use strict";

var DH = window.DH || {};

DH.chromeVersion = function (aUserAgent) {
    // extract chrome version from user agent, 0 on error
    var m, ua = aUserAgent || navigator.userAgent;
    m = ua.toString().match(/Chrome\/([0-9]+)/);
    if (m) {
        m = parseInt(m[1], 10);
        return m;
    }
    return 0;
};

DH.feedback = function (aUrl, aChannel, aExtraData, aCallback, aShowEmail) {
    // show feedback form
    var div, h1, textarea, ua, uadiv, bottom, send, cancel, emailDiv, emailLabel, emailInput;

    div = document.createElement('div');
    div.className = 'dh_feedback';
    div.style.position = 'fixed';
    div.style.left = 0;
    div.style.top = 0;
    div.style.right = 0;
    div.style.bottom = 0;
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.backgroundColor = 'inherit';
    div.style.color = 'inherit';
    div.style.padding = '1ex';
    div.style.zIndex = 108;

    h1 = document.createElement('h1');
    h1.textContent = 'Feedback';
    h1.style.margin = '0';
    h1.style.padding = '0';
    h1.style.fontSize = 'large';
    div.appendChild(h1);

    textarea = document.createElement('textarea');
    textarea.placeholder = 'Please type your feedback message here';
    textarea.style.display = 'block';
    textarea.style.width = "100%";
    textarea.style.flex = "1";
    textarea.style.boxSizing = 'border-box';
    textarea.style.resize = 'none';
    div.appendChild(textarea);

    // warn about very old chrome/webview
    try {
        ua = DH.chromeVersion();
        if (ua > 0 && ua < 55) {
            uadiv = document.createElement('div');
            uadiv.style.opacity = 0.7;
            uadiv.style.fontSize = 'x-small';
            uadiv.textContent = 'Note: Your Chrome/WebView is very old (your is ' + ua + ', current version is 70+). If you are reporting bug it is probably because of that. Please update your Chrome or WebView component, it may resolve the issue.';
            div.appendChild(uadiv);
        }
    } catch (ignore) {
    }

    emailDiv = document.createElement('div');
    emailDiv.style.display = 'block';
    emailDiv.style.width = "100%";
    //emaildiv.style.flex = "1";
    emailDiv.style.boxSizing = 'border-box';
    emailDiv.style.marginTop = '1ex';

    emailLabel = document.createElement('label');
    emailLabel.textContent = 'Email ';

    emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.style.display = 'block';
    emailInput.style.width = '100%';
    emailInput.style.boxSizing = 'border-box';

    emailInput.placeholder = 'Type your email address here if you want answer';

    if (aShowEmail) {
        div.appendChild(emailDiv);
        emailDiv.appendChild(emailLabel);
        emailDiv.appendChild(emailInput);
    }

    bottom = document.createElement('div');
    bottom.style.paddingTop = '1ex';
    div.appendChild(bottom);

    send = document.createElement('button');
    send.style.marginRight = '1ex';
    send.textContent = 'Send';
    bottom.appendChild(send);
    send.onclick = function () {
        // message cannot be empty
        if (textarea.value.length <= 0) {
            textarea.placeholder = 'Message cannot be empty!';
            textarea.focus();
            return;
        }
        // post feedback
        DH.request.post(aUrl, 'channel=' + encodeURIComponent(aChannel || 'feedback') + '&message=' + encodeURIComponent(textarea.value + '\n' + 'EMAIL=' + emailInput.value) + '&extra=' + encodeURIComponent(aExtraData),
            function (aData) {
                console.log(aData);
                if (div && div.parentElement) {
                    div.parentElement.removeChild(div);
                }
                aCallback(true, aData);
            });
        send.disabled = true;
    };

    cancel = document.createElement('button');
    cancel.style.marginRight = '1ex';
    cancel.textContent = 'Cancel';
    bottom.appendChild(cancel);
    cancel.onclick = function () {
        div.parentElement.removeChild(div);
        aCallback(false);
    };

    document.body.appendChild(div);
    textarea.focus();

    return {div: div, h1: h1, textarea: textarea, emailDiv: emailDiv, emailLabel: emailLabel, emailInput: emailInput, bottom: bottom, send: send, cancel: cancel };
};

DH.feedbackElements = function (aTextArea, aSendButton, aClearButton, aUrl, aChannel, aExtraData, aCallback) {
    // Add feedback form functionality to existing components
    aTextArea = typeof aTextArea === 'string' ? document.getElementById(aTextArea) : aTextArea;
    aSendButton = typeof aSendButton === 'string' ? document.getElementById(aSendButton) : aSendButton;
    aClearButton = typeof aClearButton === 'string' ? document.getElementById(aClearButton) : aClearButton;

    var send, clear;

    send = function () {
        // message cannot be empty
        if (aTextArea.value.length <= 0) {
            aTextArea.placeholder = 'Message cannot be empty!';
            aTextArea.focus();
            return;
        }
        // post feedback
        DH.request.post(aUrl, 'channel=' + encodeURIComponent(aChannel || 'feedback') + '&message=' + encodeURIComponent(aTextArea.value) + '&extra=' + encodeURIComponent(aExtraData),
            function (aData) {
                if (aCallback) {
                    aSendButton.removeEventListener('click', send);
                    aClearButton.removeEventListener('click', clear);
                    aCallback(true, aData);
                } else {
                    aTextArea.value = aData;
                }
            });
    };

    clear = function () {
        // clear message
        aTextArea.value = '';
        aSendButton.removeEventListener('click', send);
        aClearButton.removeEventListener('click', clear);
        aCallback(false);
    };

    aSendButton.addEventListener('click', send);
    aClearButton.addEventListener('click', clear);
};
