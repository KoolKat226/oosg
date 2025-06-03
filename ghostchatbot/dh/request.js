// Asynchronous HTTP requests
// require: assert
"use strict";

var DH = window.DH || {};

DH.request = (function () {
    // asynchronous requests
    var self = {};
    self.requests = [];
    self.requestsMax = 20;
    self.failed = 0;
    self.time = {};
    self.pings = [];
    self.debugging = false;
    self.sent = 0;

    self.post = function (aUrl, aPostData, aCallback, aCallbackParams, aUseXml, aMethod) {
        // post request
        self.sent++;
        DH.assert(typeof aPostData !== 'function', 'Parameters should be (URL, data, callback, callback data, xml)');

        var r = {
            url: aUrl,
            start: new Date(),
            end: null,
            xhr: new XMLHttpRequest()
        };
        if (self.debugging) {
            console.log('DH.request.post', aUrl, aPostData);
        }

        r.xhr.onreadystatechange = function () {
            if (r.xhr.readyState === 4 && r.xhr.status === 200) {
                r.finished = true;
                r.end = new Date();
                if (aCallback) {
                    if (aUseXml) {
                        aCallback(r.xhr.responseXML, aCallbackParams, r.xhr.status, r.xhr.statusText);
                    } else {
                        aCallback(r.xhr.responseText, aCallbackParams, r.xhr.status, r.xhr.statusText);
                    }
                }
            }
            if (r.xhr.readyState === 4 && r.xhr.status !== 200) {
                self.failed++;
                r.finished = true;
                r.end = new Date();
                if (aCallback) {
                    aCallback(null, aCallbackParams, r.xhr.status, r.xhr.statusText);
                }
            }
        };

        self.requests.push(r);
        self.requests = self.requests.slice(-self.requestsMax);

        r.xhr.open(aMethod || "POST", aUrl, true);
        r.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
        //r.xhr.setRequestHeader("Content-length", aPostData.length);
        r.xhr.send(aPostData);

        return r;
    };

    self.stats = function () {
        // show requests stats
        var a = [], i, t, p = 0;
        for (i = 0; i < self.requests.length; i++) {
            t = self.requests[i].end - self.requests[i].start;
            p += t;
            a.push(('0000000' + t).substr(-8) + ' ' + self.requests[i].url);
        }
        a.sort();
        console.log('average ping', (p / self.requests.length).toFixed(1));
        return a;
    };

    self.abort = function () {
        // abort all requests
        var i;
        for (i = 0; i < self.requests.length; i++) {
            if (!self.requests[i].xhr.finished) {
                console.warn('abort', self.requests[i].url);
                self.requests[i].xhr.abort();
            }
        }
        self.requests = [];
    };

    return self;
}());

