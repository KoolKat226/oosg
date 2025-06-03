// Animated spinner that indicate work in progress
"use strict";
// globals: document, window, setInterval, clearInterval, setTimeout
// require: none

var DH = window.DH || {};

DH.spinnerError = 'before-init';

DH.spinner = function (aHideAfter) {
    // Spinner
    aHideAfter = aHideAfter || 10;
    var div = document.createElement('div'), angle = 0, interval, hide;
    try {
        div.style.position = 'fixed';
        div.style.left = 'calc(50% - 0.5em)';
        div.style.top = 'calc(50% - 0.5em)';
        div.style.width = '1em';
        div.style.height = '1em';
        div.style.fontSize = 'xx-large';
        div.style.borderTop = '0.1em solid red';
        div.style.borderRight = '0.1em solid green';
        div.style.borderBottom = '0.1em solid yellow';
        div.style.borderLeft = '0.1em solid blue';
        div.style.borderRadius = '50%';
        div.style.transform = 'rotate(0deg)';
        div.style.boxShadow = '0 0 1ex black inset, 0 0 1ex rgba(0,0,0,0.3)';
        div.style.zIndex = 999;
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.2s linear';

        function rotate() {
            angle += 20;
            div.style.transform = 'rotate(' + angle + 'deg)';
            aHideAfter -= 0.15;
            if (aHideAfter <= 0) {
                hide();
            }
        }

        interval = setInterval(rotate, 150);

        hide = function () {
            try {
                div.style.opacity = 0;
                clearInterval(interval);
                setTimeout(function () {
                    if (div && div.parentElement) {
                        div.parentElement.removeChild(div);
                    }
                }, 300);
            } catch (e) {
                console.error(e);
            }
        };
        div.addEventListener('click', hide);

        document.body.appendChild(div);
        setTimeout(function () {
            div.style.opacity = 1;
        }, 1);
    } catch (e) {
        DH.spinnerError = e;
        console.error(e);
    }

    return {div: div, hide: hide};
};
