// Next gen spinner
"use strict";
// globals: document, window, setInterval, clearInterval, setTimeout

var DH = window.DH || {};

DH.spinnerError = 'before-init';

DH.spinnerShow = function (aHideAfterSeconds) {
    // Show spinner
    if (DH.spinnerDiv) {
        return;
    }
    DH.spinnerDiv = document.createElement('div');
    DH.spinnerDiv.style.position = 'fixed';
    DH.spinnerDiv.style.left = 'calc(50% - 0.5em)';
    DH.spinnerDiv.style.top = 'calc(50% - 0.5em)';
    DH.spinnerDiv.style.width = '1em';
    DH.spinnerDiv.style.height = '1em';
    DH.spinnerDiv.style.fontSize = 'xx-large';
    DH.spinnerDiv.style.borderTop = '0.1em solid red';
    DH.spinnerDiv.style.borderRight = '0.1em solid green';
    DH.spinnerDiv.style.borderBottom = '0.1em solid yellow';
    DH.spinnerDiv.style.borderLeft = '0.1em solid blue';
    DH.spinnerDiv.style.borderRadius = '50%';
    DH.spinnerDiv.style.transform = 'rotate(0deg)';
    DH.spinnerDiv.style.boxShadow = '0 0 1ex black inset, 0 0 1ex rgba(0,0,0,0.3)';
    DH.spinnerDiv.style.zIndex = 999;
    DH.spinnerDiv.style.opacity = '0';
    DH.spinnerDiv.style.transition = 'opacity 0.2s linear';
    document.body.appendChild(DH.spinnerDiv);

    // rotation
    DH.spinnerDiv.angle = 0;
    DH.spinnerDiv.time = (aHideAfterSeconds || 10) * 1000;
    function rotate() {
        if (!DH.spinnerDiv) {
            return;
        }
        DH.spinnerDiv.angle += 20;
        DH.spinnerDiv.style.transform = 'rotate(' + DH.spinnerDiv.angle + 'deg)';
        DH.spinnerDiv.time -= 150;
        if (DH.spinnerDiv.time <= 0) {
            DH.spinnerHide();
        }
    }
    DH.spinnerDiv.interval = setInterval(rotate, 150);

    // show it now
    setTimeout(function () {
        if (DH.spinnerDiv) {
            DH.spinnerDiv.style.opacity = 1;
        }
    }, 1);

    DH.spinnerDiv.addEventListener('click', DH.spinnerHide);
};

DH.spinnerHide = function () {
    // Hide spiner
    if (DH.spinnerDiv) {
        try {
            clearInterval(DH.spinnerDiv.interval);
            DH.spinnerDiv.style.opacity = 0;
            setTimeout(function () {
                if (DH.spinnerDiv && DH.spinnerDiv.parentElement) {
                    DH.spinnerDiv.parentElement.removeChild(DH.spinnerDiv);
                    DH.spinnerDiv = undefined;
                }
            }, 300);
        } catch (e) {
            console.error('Spinner error: ' + e);
        }
    }
};

DH.spinner = function (aHideAfterSeconds) {
    // Compatibility with old spinner
    DH.spinnerShow(aHideAfterSeconds);
    return {
        hide: DH.spinnerHide
    };
};
