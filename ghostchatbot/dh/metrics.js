// Universal application metrics logging
// require: assert, cookie, request, storage, storage2, storage3, type, Android
"use strict";
// globals: document, window, Android, performance, setTimeout

var DH = window.DH || {};

DH.metrics = (function () {
    var self = {}, cookie, cookie3, key, app, version, url, pending = 0, abvalue = 0;
    self.verbose = false;
    self.errorLoggerEnabled = false;
    self.sessionId = -Math.abs(Math.random());
    self.sent = 0;
    self.ad = JSON.parse('{"version":1,"items":[{"videoVertical": "https://ghost.sk/metrics/image/vb-beach-vertical.mp4","app":"vb","title":"Virtual Boyfriend","message":"Check out my new cool game for android. You can chat with virtual boyfriend Sebastian, buy clothes, visit locations, play mini games and more: ghost.sk/vb","textColor":"white","textBackgroundColor":"#377bb5","backgroundColor":"black","backgroundImageVertical":"https://ghost.sk/metrics/image/vb-vertical.jpg","backgroundImageHorizontal":"https://ghost.sk/metrics/image/vb-horizontal.jpg","installText":"Install","installColor":"white","installBackgroundColor":"#00A86B","installPackage":"sk.ghost.virtualboyfriend","installLink":"https://play.google.com/store/apps/details?id=sk.ghost.virtualboyfriend&pcampaignid=VB1"},{"videoVertical": "https://ghost.sk/metrics/image/vb-beach-vertical.mp4","app":"vb","title":"Virtual Boyfriend","message":"Check out my new cool game for android. You can chat with virtual boyfriend Sebastian, buy clothes, visit locations, play mini games and more: ghost.sk/vb","textColor":"white","textBackgroundColor":"#377bb5","backgroundColor":"black","backgroundImageVertical":"https://ghost.sk/metrics/image/vb-restaurant-vertical.jpg","backgroundImageHorizontal":"https://ghost.sk/metrics/image/vb-restaurant-horizontal.jpg","installText":"Install","installColor":"white","installBackgroundColor":"#00A86B","installPackage":"sk.ghost.virtualboyfriend","installLink":"https://play.google.com/store/apps/details?id=sk.ghost.virtualboyfriend&pcampaignid=VB2"}]}');
    if (DH.storage) {
        self.ad = DH.storage.readObject('DH.metrics.ad', self.ad) || self.ad;
    }

    function abUpdate(aCookie) {
        // calculate value for A/B testing
        var i;
        abvalue = 0;
        for (i = 0; i < aCookie.length; i++) {
            abvalue += aCookie.charCodeAt(i);
        }
    }

    function cb(aValue) {
        // storage3 callback
        cookie3 = aValue;
        abUpdate(aValue || '');
    }
    cookie = DH.cookie(cb);
    cookie = cookie || cookie3;
    if (cookie) {
        abUpdate(cookie || '');
    }

    self.ab = function (aModulo) {
        // return value for A/B testing
        return abvalue % (aModulo || 2);
    };

    self.log = function (aEvent, aData, aLevel, aStars, aDuration) {
        // Log application event and data

        // main sequence
        try {
            if (!aStars) {
                if (window.hasOwnProperty('Android')) {
                    if (Android.hasOwnProperty('mainSequence')) {
                        aStars = Android.mainSequence();
                    }
                }
            }
        } catch (ignore) {
        }

        // if not duration given use session id (to detect crashes during billing)
        if (!aDuration) {
            aDuration = self.sessionId;
        }

        try {
            if (!app) {
                console.warn("DH.metrics not initialized");
                return;
            }
            if (pending >= 10) {
                console.log('DH.metrics.skipped', app, version, aEvent, aData, cookie, aLevel, aStars, aDuration);
                return;
            }
            if (self.verbose) {
                console.log('DH.metrics.log', app, version, aEvent, aData, cookie, aLevel, aStars, aDuration);
            }
            pending++;

            if (window.hasOwnProperty('Android')) {
                if (Android.hasOwnProperty('isConnectedWifi')) {
                    if (!Android.isConnectedWifi()) {
                        console.log('no wifi, no metrics');
                        return;
                    }
                }
            }

            if (self.extraPayload) {
                aData = aData || '';
                aData += ' (' + self.extraPayload + ')';
            }

            self.sent++;
            DH.request.post(url,
                'key=' + encodeURIComponent(key) +
                '&app=' + encodeURIComponent(app) +
                '&version=' + encodeURIComponent(version) +
                '&cookie=' + encodeURIComponent(cookie) +
                '&event=' + encodeURIComponent(aEvent) +
                '&data=' + encodeURIComponent(aData || '') +
                '&level=' + encodeURIComponent(aLevel || 0) +
                '&stars=' + encodeURIComponent(aStars || 0) +
                '&duration=' + encodeURIComponent(aDuration || 0) +
                '&perf=' + encodeURIComponent(performance.now() || 0) +
                '&local=' + encodeURIComponent((new Date()).toISOString()),
                function (aData2) {
                    pending--;
                    if (self.verbose) {
                        console.log('metrics', aData2);
                    }
                    // for metrics-init receive ads
                    if (aEvent === 'metrics-init' && aData2) {
                        try {
                            self.ad = JSON.parse(aData2);
                            console.log('metrics-init ad', self.ad);
                            DH.storage.writeObject('DH.metrics.ad', self.ad);
                        } catch (ignore) {
                        }
                    }
                }, null, false
                );
        } catch (e) {
            console.error('DH.metrics.log ' + e);
        }
    };

    self.init = function (aAppName, aAppVersion, aAppKey, aServer, aSkipFirstLog) {
        // Set application name, version and (optional) key and server
        app = aAppName;
        version = parseInt(aAppVersion, 10);
        key = aAppKey || 'default-app-key';
        url = aServer || 'https://ghost.sk/metrics/send2.php';
        if (!aSkipFirstLog) {
            self.log('metrics-init');
        }
    };

    self.errorLogger = function (aMaxErrors) {
        // enable error logger
        self.errorLoggerEnabled = true;
        self.errorsSent = 0;
        window.addEventListener('error', function (event) {
            self.errorEvent = event;
            self.errorsSent++;
            if (self.errorsSent <= (aMaxErrors || 10)) {
                try {
                    var o, f;
                    try {
                        f = event.filename.split('/').slice(-1)[0]; // slice is shallow
                    } catch (ignore2) {
                        f = event.filename;
                    }
                    o = f + ':' + event.lineno + ':' + event.colno + ': ' + event.message;
                    self.log('error', o);
                } catch (ignore) {
                }
            }
        });
    };

    self.showAd = function () {
        // Show ad
        if (!self.ad || self.ad.version !== 1) {
            return;
        }
        var i, cand = [], div, install, close, cur, img, p, video;
        // find ads for other apps
        for (i = 0; i < self.ad.items.length; i++) {
            if (self.ad.items[i].app !== app) {
                cand.push(self.ad.items[i]);
            }
        }
        // pick random ad
        if (cand.length <= 0) {
            return;
        }
        cur = cand[Math.floor(cand.length * Math.random())];
        // prepare elements
        function hide() {
            div.parentElement.removeChild(div);
        }
        // div
        div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.left = '0';
        div.style.top = '0';
        div.style.width = '100vw';
        div.style.height = '100vh';
        div.style.zIndex = '9999999';
        div.style.opacity = 0;
        div.style.transition = 'opacity 0.3s linear';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        setTimeout(function () {
            div.style.opacity = 1;
        }, 300);
        div.style.backgroundColor = cur.backgroundColor || 'black';
        //
        img = document.createElement('img');
        img.style.opacity = 0;
        img.onerror = function () {
            // On network error hide image and show some text ad
            img.style.display = 'none';
            var c = document.createElement('div'),
                h1 = document.createElement('h1');
            p = document.createElement('div');
            // container
            //c.style.border = '1px solid red';
            c.style.flex = 1;
            c.style.display = 'flex';
            c.style.flexDirection = 'column';
            c.style.alignItems = 'center';
            c.style.justifyContent = 'center';
            c.style.padding = '2em';
            c.style.fontFamily = 'sans-serif';
            c.style.fontSize = 'large';
            c.style.paddingBottom = '1cm';
            c.style.backgroundColor = cur.textBackgroundColor || 'white';
            div.appendChild(c);
            // title
            h1.textContent = cur.title;
            h1.style.color = cur.textColor || 'black';
            h1.style.margin = 0;
            c.appendChild(h1);
            // message
            p.textContent = cur.message;
            p.style.color = cur.textColor || 'black';
            p.style.fontSize = 'large';
            p.style.textAlign = 'center';
            p.onclick = install.onclick;
            c.appendChild(p);
        };

        if (window.innerWidth > window.innerHeight) {
            // landscape
            console.log('landscape', window.innerWidth / window.innerHeight, cur.aspectRatio);
            /*
            if (window.innerWidth / window.innerHeight > cur.aspectRatio) {
                console.log('a');
                div.style.flexDirection = 'column';
                img.style.height = '100vh';
            } else {
                console.log('b');
                div.style.flexDirection = 'column';
                img.style.height = '100vh';
                //img.style.width = '100vw';
            }
            */
            div.style.flexDirection = 'column';
            img.style.height = '100vh';
            img.src = cur.backgroundImageHorizontal;
        } else {
            // portrait
            console.log('portrait', window.innerWidth / window.innerHeight, cur.aspectRatio);
            /*
            if (window.innerHeight / window.innerWidth > cur.aspectRatio) {
                console.log('a');
                div.style.flexDirection = 'row';
                img.style.width = '100vw';
            } else {
            }
            */
            div.style.flexDirection = 'column';
            img.style.height = '100vh';
            img.src = cur.backgroundImageVertical;
        }
        div.appendChild(img);

        // video
        if (cur.videoVertical) {
            console.log('Showing video');
            video = document.createElement('video');
            video.style.opacity = 0;
            video.onloadeddata = function () {
                video.style.opacity = 1;
            };
            video.onerror = function (event) {
                console.error('video error', event);
            };
            video.onended = function () {
                console.log('video ended, show image');
                video.parentElement.removeChild(video);
            };
            video.style.left = 0;
            video.style.top = 0;
            video.style.width = '100vw';
            video.style.height = '100vh';
            video.style.objectFit = 'fill';
            video.disableRemotePlayback = true;
            //video.style.height = 'auto';
            video.style.position = 'fixed';
            //video.loop = true;
            video.style.zIndex = 999;
            video.src = cur.videoVertical;
            video.autoplay = true;
            video.onclick = function () {
                video.play();
            };
            div.appendChild(video);
            self.vi = video;
            video.play();
        }

        // show image after some time
        setTimeout(function () {
            img.style.opacity = 1;
        }, 3000);
/*
        if (window.innerWidth > window.innerHeight) {
            div.style.backgroundImage = 'url(' + cur.backgroundImageHorizontal + ')';
        } else {
            div.style.backgroundImage = 'url(' + cur.backgroundImageVertical + ')';
        }
        div.style.backgroundPosition = 'center';
        div.style.backgroundSize = 'contain';
        div.style.backgroundRepeat = 'no-repeat';
        */
        // close button
        close = document.createElement('button');
        close.textContent = 'X';
        close.style.position = 'fixed';
        close.style.right = '1ex';
        close.style.top = '1ex';
        close.style.backgroundColor = 'transparent';
        close.style.border = 'none';
        close.style.outline = 'none';
        close.style.boxShadow = 'none';
        close.style.color = 'red';
        close.style.textShadow = 'none';
        close.style.transition = 'opacity 0.3s';
        close.style.zIndex = 1000;
        close.onclick = function () {
            close.disabled = true;
            close.style.opacity = 0;
            hide();
            if (video) {
                video.pause();
            }
        };
        div.appendChild(close);
        // install button
        install = document.createElement('button');
        install.textContent = 'Install';
        install.style.fontSize = 'large';
        install.style.padding = '1ex';
        install.style.position = 'fixed';
        install.style.left = 'calc(50vw - 5em)';
        install.style.width = '10em';
        install.style.top = '80vh';
        install.style.color = cur.installColor || 'black';
        install.style.backgroundColor = cur.installBackgroundColor || 'lime';
        install.style.boxShadow = 'inset 1px 1px 0 0 rgba(255,255,255,0.5), 0 0 1ex black';
        install.style.border = '0px';
        install.style.opacity = 0;
        install.style.zIndex = 1000;
        install.style.transition = 'opacity 0.3s';
        setTimeout(function () {
            install.style.opacity = 1;
        }, 500);
        install.onclick = function () {
            //self.log('metrics-ad-click', cur.installLink);
            install.disabled = true;
            install.style.opacity = 0;
            hide();
            if (window.hasOwnProperty('Android') && cur.installPackage) {
                window.Android.internalPlayStore(cur.installPackage);
                return;
            }
            window.open(cur.installLink, '_blank');
        };
        div.appendChild(install);
        // show
        document.body.appendChild(div);
        return div;
    };

    self.adCounter = 0;
    self.showAdEvery = function (aPeriod) {
        // Show ad every given period
        self.adCounter++;
        if (self.adCounter >= aPeriod) {
            self.showAd();
            self.adCounter = 0;
        }
    };

    return self;
}());
