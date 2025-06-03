// Let user choose local files for upload and then process them
// require: type, meter, assert
"use strict";

var DH = window.DH || {};

DH.uploadInput = null;

DH.upload = function (aDoneCallback, aProgressCallback) {
    // Client-side multiple file upload (or parsing)
    DH.assert(event, 'DH.upload only works when called from user actions');
    DH.type.isFunction(aDoneCallback, 'DH.upload: aDoneCallback is undefined');
    var form, input, doneFiles = [], filesDone, filesTotal, meter;

    // input
    form = document.createElement('form');
    form.method = 'post';
    input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.required = true;
    input.style.display = 'block';
    input.style.border = '1px solid red';
    input.style.boxSizing = 'border-box';
    input.style.width = '100%';
    DH.uploadInput = input;

    function readerOnLoad() {
        // single file loaded
        event.target.myFile.data = event.target.result;
        doneFiles.push(event.target.myFile);
        if (aProgressCallback) {
            aProgressCallback(filesDone, filesTotal, event.loaded, event.total);
        }
        if ((event.loaded === event.total) && (doneFiles.length === event.target.myCount)) {
            if (aDoneCallback) {
                aDoneCallback(doneFiles);
            }
            doneFiles = [];
        }
    }

    function readerOnProgress(aProgressEvent) {
        // progress callback on each files
        var p = (100 * filesDone / filesTotal) + (100 / filesTotal) * (aProgressEvent.loaded / aProgressEvent.total);
        if (!meter) {
            meter = DH.meter();
        }
        meter.update(p);
        if (aProgressEvent.loaded >= aProgressEvent.total) {
            filesDone++;
        }
    }

    input.addEventListener('change', function (event) {
        // start files uploading
        var i, reader, file, files;
        files = event.target.files;
        filesDone = 0;
        filesTotal = files.length;
        for (i = 0; i < files.length; i++) {
            file = files[i];
            // Only pics
            //if (!file.type.match("image")) {
            //    continue;
            //}
            // read each file content
            reader = new FileReader();
            reader.addEventListener("progress", readerOnProgress);
            reader.addEventListener("load", readerOnLoad);
            reader.myFile = file;
            reader.myName = file.name;
            reader.myCount = files.length;
            reader.readAsBinaryString(file);
        }
    });

    // add input to form and click on it to start upload
    form.appendChild(input);
    input.click();
};

