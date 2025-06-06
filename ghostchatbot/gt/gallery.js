// Viewing images in gallery, also used for maps
"use strict";
// globals: document, window, Android

var GT = GT || {};

GT.gallery = function (aUrl, aTitle, aAuthor, aCallback, aTransparentBackground) {
    // Show one image in gallery

    // prevent multiple galleries opening
    if (GT.galleryOpen) {
        return false;
    }
    GT.pause = true;
    GT.galleryOpen = true;

    var div, figure, img, figcaption, title, author, tv = GT.touchpad.visible, hide, js;
    GT.touchpad.hide();

    // closing gallery with esc
    function onKeyDown(event) {
        if (event.keyCode === 27 || event.keyCode === 32 || event.keyCode === 13) {
            hide();
            event.preventDefault();
        }
    }
    window.addEventListener('keydown', onKeyDown, true);

    hide = function () {
        // close gallery
        window.removeEventListener('keydown', onKeyDown, true);
        if (div && div.parentElement) {
            div.parentElement.removeChild(div);
        }
        if (tv) {
            GT.touchpad.show();
        }
        GT.galleryOpen = false;
        GT.pause = false;
        if (aCallback) {
            aCallback();
        }
    };
    GT.galleryHide = hide;

    // background
    div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '0';
    div.style.right = '0';
    div.style.top = '0';
    div.style.bottom = '0';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    if (!aTransparentBackground) {
        div.style.backgroundImage = 'url(gallery/brick.png)';
    } else {
        div.style.backgroundColor = 'rgba(0,0,0,0.5)';
    }
    div.addEventListener('click', hide);

    // figure
    figure = document.createElement('figure');
    figure.style.margin = '0';
    figure.style.padding = '0';
    div.appendChild(figure);

    // image
    img = document.createElement('img');
    img.src = aUrl;
    img.style.minWidth = '220px';
    img.style.minHeight = '200px';
    img.style.maxWidth = '300px';
    img.style.maxHeight = '200px';
    if (!aTransparentBackground) {
        img.style.backgroundColor = 'white';
        img.style.border = '1ex solid white';
        img.style.boxShadow = '1ex 1ex 1ex rgba(0,0,0,0.3)';
    } else {
        img.style.filter = 'drop-shadow(1ex 1ex 1ex rgba(0,0,0,1))';
    }
    figure.appendChild(img);

    if (aTitle || aAuthor) {
        // caption
        figcaption = document.createElement('figcaption');
        figcaption.style.color = 'black';
        figcaption.style.backgroundColor = 'white';
        figcaption.style.display = 'block';
        figcaption.style.margin = 'auto';
        //figcaption.style.maxWidth = '50%';
        figcaption.style.fontFamily = 'sans-serif';
        figcaption.style.fontSize = 'small';
        figcaption.style.textAlign = 'center';
        figcaption.style.borderRadius = '0.5ex';
        figcaption.style.whiteSpace = 'nowrap';
        figcaption.style.marginTop = '1em';
        figcaption.style.boxShadow = '0.3ex 0.3ex 0.3ex rgba(0,0,0,0.3)';
        figure.appendChild(figcaption);

        // title
        title = document.createElement('div');
        title.innerText = aTitle.replace(/_/g, ' ');
        title.style.fontWeight = 'bold';
        figcaption.appendChild(title);

        // author
        author = document.createElement('div');
        author.innerText = aAuthor.replace(/_/g, ' ');
        figcaption.appendChild(author);
    }

    // show
    document.body.appendChild(div);

    // back will close gallery
    if (window.hasOwnProperty('Android')) {
        if (Android.isReal()) {
            js = "javascript";
            Android.setBack(js + ":GT.galleryHide();Android.setBack('file:///android_asset/android.html')");
        }
    }

    return div;
};

GT.galleryMap = function (aUrl, aDescription, aCallback) {
    // Use gallery to display map
    return GT.gallery(aUrl, aDescription || 'Map', '(tap to close)', aCallback, true);
};

GT.galleryItem = function (aTitle, aUrl, aCallback) {
    // Use gallery to display map
    return GT.gallery(aUrl, aTitle, '(tap to close)', aCallback, true);
};

