// Simplified json request
"use strict";
// globals: document, window, XMLHttpRequest

var DH = window.DH || {};

DH.jsonFailedAjaxAsWarningNotError = false;

DH.json = function (aUrl, aParams, aCallback) {
    // Simplified ajax request with JSON response
    // Example: DH.json("http://example.com/divide/", {a: 22, b: 7}, function (aOk, aResponse) { if (aOk) { alert(aResponse); } );
    var k, p = [], xhr;

    // params
    try {
        for (k in aParams) {
            if (aParams.hasOwnProperty(k)) {
                p.push(encodeURIComponent(k) + '=' + encodeURIComponent(aParams[k]));
            }
        }
    } catch (e) {
        if (aCallback) {
            aCallback(false, 'ajax: invalid params - ' + e);
        }
    }

    // request
    try {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                if (aCallback) {
                    try {
                        var o = JSON.parse(xhr.responseText);
                    } catch (e) {
                        console.error(e, xhr.responseText);
                        if (aCallback) {
                            aCallback(false, e);
                        }
                        return;
                    }
                    if (aCallback) {
                        aCallback(true, o, aParams);
                    }
                }
            }
            if (xhr.readyState === 4 && xhr.status !== 200) {
                if (DH.jsonFailedAjaxAsWarningNotError) {
                    console.warn('ajax failed: #' + xhr.status + ' - ' + xhr.statusText + ' url ' + aUrl);
                } else {
                    console.error('ajax failed: #' + xhr.status + ' - ' + xhr.statusText + ' url ' + aUrl);
                }
                if (aCallback) {
                    aCallback(false, 'ajax failed: #' + xhr.status + " " + xhr.statusText + ' url ' + aUrl);
                }
            }
        };
        //aUrl += (aUrl.match('\?') ? '&' : '?') + 'ajax_cache_timestampt=' + Date.now();
        xhr.open("POST", aUrl, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
        xhr.send(p.join('&'));
    } catch (e) {
        console.error('ajax: ' + e);
        if (aCallback) {
            aCallback(false, 'ajax: ' + e);
        }
    }
};

