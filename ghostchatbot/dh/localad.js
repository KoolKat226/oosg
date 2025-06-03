// Show local ad
// require: metrics, storage
"use strict";
// globals: document, window

var DH = window.DH || {};

DH.localAdVisible = false;

DH.localAd = function () {
    // Show ad
    if (!DH.localAdData || DH.localAdData.version !== 1 || !DH.localAdData.items || DH.localAdData.items.length <= 0) {
        console.warn('DH.localAdData missing');
        return;
    }
    var div, install, close, cur, img, video, adlabel, counter = DH.storage.inc('DH.localAdCounter', 0);

    // pick random ad
    //cur = DH.localAdData.items[Math.floor(DH.localAdData.items.length * Math.random())];
    cur = DH.localAdData.items[counter % DH.localAdData.items.length];

    function hide() {
        // hide ad
        DH.localAdVisible = false;
        div.parentElement.removeChild(div);
    }
    DH.localAdVisible = true;

    // main div
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

    // image
    img = document.createElement('img');
    img.style.opacity = 0;
    img.style.width = '100vw';
    img.style.height = '100vh';
    img.src = cur.backgroundImage;
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
            console.error('Video error', event);
            video.parentElement.removeChild(video);
            img.style.opacity = 1;
        };
        video.onended = function () {
            console.log('Video ended, show image');
            video.parentElement.removeChild(video);
            img.style.opacity = 1;
        };
        video.style.left = 0;
        video.style.top = 0;
        video.style.width = '100vw';
        video.style.height = '100vh';
        video.style.objectFit = 'fill';
        video.disableRemotePlayback = true;
        video.style.position = 'fixed';
        video.style.zIndex = 999;
        video.src = cur.videoVertical;
        video.autoplay = true;
        video.onclick = function () {
            video.play();
        };
        div.appendChild(video);
    }

    // ad label
    adlabel = document.createElement('span');
    adlabel.textContent = 'Advertisement';
    adlabel.style.position = 'fixed';
    adlabel.style.left = '1ex';
    adlabel.style.top = '1ex';
    adlabel.style.backgroundColor = 'transparent';
    adlabel.style.color = 'silver';
    adlabel.style.zIndex = 1001;
    adlabel.style.opacity = 0.5;
    adlabel.style.fontSize = 'small';
    adlabel.style.fontFamily = 'sans-serif';
    div.appendChild(adlabel);

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
    if (cur.installBottom) {
        install.style.bottom = cur.installBottom || '20vh';
    } else {
        install.style.top = cur.installTop || '80vh';
    }
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
    install.focus();
    return div;
};

