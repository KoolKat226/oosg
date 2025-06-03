// Small subset of unit tests run before every release
"use strict";
// globals: GHOST

var GA = GA || {};

GA.release = function (aQuestion) {
    // Small subset of unit tests run before every release
    console.clear();
    console.log('Release version 2017-03-14 14:38:00');
    var test, k, e = 0, s, n, nr, i, inv, t1, t2, c, a, p, pi, qcu = {}, old_user = JSON.parse(JSON.stringify(GA.user));
    t1 = new Date();
    try {

        GA.user.params['$nick;'] = 'Ghost';
        GA.user.params['$age;'] = '12';
        GA.user.params['$sex;'] = 'man';
        GA.user.data = { "hello": [ "Hello from user character" ] };

        // test normalize
        n = GHOST.normalize('And **** hey,you you! international (bracket) what\'s "YOUR" name');
        nr = ["and", "*", "*", "*", "*", "hey", ",", "you", "you", "!", "international", "(", "bracket", ")", "what", "is", "\"", "your", "\"", "name"];
        for (i = 0; i < n.length; i++) {
            if (n[i] !== nr[i]) {
                console.error(n[i], nr[i], 'normalizer changed');
            }
        }
        n = GHOST.normalize("Are u an A.I. made in U.S.A.?");
        nr = "are you an ai made in usa ?";
        if (n.join(' ') !== nr) {
            console.error(n.join(' '), '!==', nr, '(normalizer changed)');
        }

        if (aQuestion) {
            // warn about character
            if (aQuestion.match('\u0000')) {
                console.warn('Zero character \\0 in question!');
            }
            s = GHOST.normalize(aQuestion);
            console.log('normalized', s);
            s = s.join(' ');
            if (GA.characters[0].data.hasOwnProperty(s)) {
                console.info('exact match: ', s);
            }
            a = GHOST.askChain(GA.characters, aQuestion, [0.001, 0.01, 0.02, 0.05, 0.1, 0.5, 0.9, 1]);
            console.log(GHOST.log);
            console.table(GHOST.recentCandidates);
            console.info(aQuestion, '-->', a.answer);
            return;
        }

        // walk all questions
        for (c = 0; c < GA.characters.length; c++) {
            for (k in GA.characters[c].data) {
                if (GA.characters[c].data.hasOwnProperty(k)) {
                    n = GHOST.normalize(k);
                    qcu[n] = true;

                    // not normalized question
                    if (k !== n.join(' ')) {
                        console.error('not normalized question', k);
                        e++;
                    }

                    // invisible characters
                    inv = k.replace(/[a-zA-Z0-9\=\ \,\.\!\-\?\'\>\\<\:\$\;\(\)\@\+\\\/ *]/g, ''); // '
                    if (inv !== "") {
                        console.warn('invisible characters ' + inv + ' in:', k);
                        e++;
                    }

                    // zero character too
                    if (k.match('\u0000')) {
                        console.warn('zero character \\0 in:', k);
                        e++;
                    }

                    // questions with input params will not be reachable
                    p = k.match(/\$[a-zA-Z_0-9]+\;/);
                    if (p) {
                        for (pi = 0; pi < p.length; pi++) {
                            if (!GA.characters[c].params.hasOwnProperty(p[pi])) {
                                if (["$month;", "$year;", "$placeholder;"].indexOf(p[pi]) < 0) {
                                    console.error('unknown param:', p[pi]);
                                    e++;
                                }
                            }
                        }
                    }

                    // values must not be strings
                    if (typeof GA.characters[c] === 'string') {
                        console.error('answer is string:', k);
                        e++;
                    }
                }
            }
        }

        test = function (aQuestion, aAllowedAnswers) {
            var z = GHOST.askChain(GA.characters, aQuestion, [0.001, 0.01, 0.02, 0.05, 0.1, 0.5, 0.9, 1]);
            if (aAllowedAnswers.indexOf(z.answer) < 0) {
                console.warn('unexpected answer', aQuestion, '-->', z.answer);
                e++;
            }
        };

        // few testing questions
        test("Hello", ["Hello from user character"]);
        test("What is your name", ["My name is Ghost", "Hello, my name is Ghost", "My real name is Ghost"]);
        test("You are stupid", ["I am not stupid", "I am quite stupid but I learn every day", "I am not stupid!"]);
        test("Why and not but yeah", []);
        test("What is another anime you like?", ["Cowboy Bebop is good anime", "Bakemonogatari is good anime", "Tenshi no tamago is good anime", "There is plenty of good anime out there"]);
        test("dfaklsjdhfl", []);
        test("Are you a man?", ["I am a man", "Sure, I can be your man", "I am 12 year old man"]);
        test("U WAT", []);
        test("what's 1 + 2?", ["I suck at math", "No math please!", "It was 2001"]);
        test("what is sqrt of 9", ["I suck at math", "No math please!", "It was 2001", "I am 12"]);
        test("Are u an A.I. made in U.S.A.?", ["I cannot travel", "I live in Slovakia, central Europe"]);
        t2 = new Date();
        console.log(Object.keys(qcu).length + ' sentences (' + Object.keys(GA.characters[GA.characters.length - 1].data).length + ' in user), ' + e + ' errors, time=' + (t2 - t1) + 'ms');
    } catch (err) {
        console.error(err);
    }
    GA.user = old_user;
};

