// Once in a while ask a poll question
"use strict";
// globals: window, DH, GHOST, navigator

var GA = GA || {};

GA.pollId = 0;

GA.pollAsked = false;

GA.pollData = null;

GA.pollQuestions = [
    "Hmm... Do you like winter?",
    "Hmm... Do you like icecream?",
    "Hmm... Do you like broccoli?",
    "Hmm... Do you like pizza?",
    "Hmm... Do you work with computers?",
    "Hmm... Do you play computer games?",
    "Hmm... Do you know any programming languages?",
    "Hmm... Do you like peanut butter?"
];

GA.pollQuestion = null;
GA.pollQuestionScore = 0;
GA.pollQuestionScoreQ = '';

GA.poll = function (aQuestion, aAnswer, aTags) {
    // Once in a while ask a poll question
    var i, r, extra;
    // only once per session
    if (GA.pollAsked) {
        if (GA.pollQuestion) {
            extra = '';
            extra += ' (' + window.screen.availWidth + 'x' + window.screen.availHeight + ' ' + navigator.platform + ' sc:' + GA.pollQuestionScore + ')';
            extra += aTags ? ' ' + JSON.stringify(aTags) : '';
            console.log('poll result', GA.pollQuestion, '-->', aQuestion, ' tags:', aTags, 'extra:', extra);
            GA.report({q: 'poll:' + GA.pollQuestion, a: aQuestion + extra}, 'feedback');
            GA.pollQuestion = null;
        }
        return aAnswer;
    }
    // only if ghost does not know answer
    //if (GA.a.question) {
    //    return aAnswer;
    //}
    // on first question read poll data from storage
    if (!GA.pollData) {
        DH.storage2.read('GHOST_POLL', function (aValue) {
            if (aValue) {
                GA.pollData = JSON.parse(aValue);
            } else {
                GA.pollData = {};
            }
        });
        return aAnswer;
    }
    // not sooner than 10th question
    GA.pollId++;
    if (GA.pollId < 10) {
        return aAnswer;
    }
    // remember question's best score (this will later be used to postpone poll if score is high and only ask poll if answer is not very good)
    GA.pollQuestionScore = GHOST && GHOST.log && GHOST.log.bestScore && GHOST.log.bestScore.toFixed(3);
    // get random poll question
    r = null;
    for (i = 0; i < GA.pollQuestions.length; i++) {
        if (!GA.pollData.hasOwnProperty(GA.pollQuestions[i])) {
            r = GA.pollQuestions[i];
            break;
        }
    }
    // no available poll question
    if (!r) {
        return aAnswer;
    }
    // save question to pollData
    GA.pollQuestion = r;
    GA.pollData[r] = true;
    DH.storage2.write('GHOST_POLL', JSON.stringify(GA.pollData));
    console.log('poll', r, GA.pollData, GA.pollId);
    // never ask again in this session
    GA.pollAsked = true;
    return r;
};

