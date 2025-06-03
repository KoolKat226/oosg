// Billing functions for free version of ghost
"use strict";
// globals: document, window, DH, Billing

var GA = window.GA || {};

Billing.server = 'https://ghost.sk/billing/';

Billing.allowed = [
    'ghost_unlock_theme_dark',
    'ghost_unlock_theme_pink',
    'ghost_unlock_trash',
    'ghost_unlock_icon',
    'ghost_unlock_mountains',
    'ghost_unlock_virtual_town',
    'ghost_unlock_ads'
];

Billing.onPurchase = function (aSku) {
    // User made a purchase
    // dark theme
    if (aSku === 'ghost_unlock_theme_dark') {
        GA.applyTheme('dark');
        return true;
    }
    // pink theme
    if (aSku === 'ghost_unlock_theme_pink') {
        GA.applyTheme('pink');
        if (GA.nagging) {
            GA.nagging.blinkMenu();
        }
        return true;
    }
    // icons
    if (aSku === 'ghost_unlock_icon') {
        DH.lip("You can now change your and Ghost's icon in options", null, 30);
        if (GA.nagging) {
            GA.nagging.blinkMenu();
        }
        return true;
    }
    // mountains
    if (aSku === 'ghost_unlock_mountains') {
        DH.lip("You can now change your and Ghost's icon in options", null, 30);
        if (GA.nagging) {
            GA.nagging.blinkMenu();
        }
        return true;
    }
    // virtual town
    if (aSku === 'ghost_unlock_virtual_town') {
        DH.lip("You can now visit virtual town in menu", null, 30);
        if (GA.nagging) {
            GA.nagging.blinkMenu();
        }
        return true;
    }
    // virtual town
    if (aSku === 'ghost_unlock_virtual_town') {
        DH.lip("You can now play \"Trash everything\" minigame from the menu", null, 30);
        if (GA.nagging) {
            GA.nagging.blinkMenu();
        }
        return true;
    }
    // ads
    if (aSku === 'ghost_unlock_ads') {
        DH.lip("No more ads", null, 30);
        return true;
    }
    // trash
    if (aSku === 'ghost_unlock_trash') {
        DH.lip("You can now play 'Trash everything' minigame", null, 30);
        return true;
    }
};

Billing.onStore = function () {
    // Extra data stored on server
    return {
        version: 1
    };
};

Billing.onRestore = function (aData) {
    // Restore extra data after phone reinstall
    console.warn('Billing.onRestore', aData);
};

window.addEventListener('DOMContentLoaded', function () {
    console.log('Billing.init');
    if (window.hasOwnProperty('Billing') && Billing.init) {
        Billing.init(function () {
            console.log('Billing.init done, available=' + Billing.isAvailable());
        });
    }
});
