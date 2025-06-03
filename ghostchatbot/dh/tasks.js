// Runing multiple tasks at once
// require: type
"use strict";
// globals: document, setTimeout

var DH = window.DH || {};

DH.tasks = function (aData, aCallback, aMaxThreads, aCallbackDone) {
    // Run multiple tasks at once (aCallback must have attributes (aData, aNextCallback) and call aNextCallback() when done)
    DH.type.isFunction(aCallback);
    DH.type.isArray(aData);
    DH.type.isInteger(aMaxThreads);
    if (aMaxThreads < 1) {
        throw "aMaxThreads < 1";
    }

    // split data into equal parts
    var dlen = aData.length,
        bsize = Math.ceil(aData.length / aMaxThreads),
        done = [],
        block;
    console.log('threads', aMaxThreads, 'block size', bsize, 'data size', aData.length);

    function process(aCallback, aBlock) {
        // recursively process one block
        var d = aBlock.pop();
        if (!d) {
            return;
        }
        aCallback(d, function () {
            process(aCallback, aBlock);
            done.push(d);
            if (done.length === dlen) {
                aCallbackDone(done);
            }
        });
    }

    while (aData.length > 0) {
        block = aData.splice(0, bsize);
        if (block.length > 0) {
            //console.log('block', block.length, 'remaining', aData.length);
            process(aCallback, block.slice());
        }
    }
};

