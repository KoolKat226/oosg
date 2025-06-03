// Sort table rows by clicking on column header
// require: none
"use strict";

var DH = window.DH || {};

DH.tableSort = function (aTable, aColumn, aKind) {
    // sort table by nth column with asc/desc kind
    var table = typeof aTable === 'string' ? document.getElementById(aTable) : aTable,
        tr = table.getElementsByTagName('tr'),
        td,
        sorted = [],
        val,
        y;

    // for each row find "aColumn"-th td
    for (y = 1; y < tr.length; y++) {
        td = tr[y].getElementsByTagName('td');
        val = parseFloat(td[aColumn].textContent || "0");
        if (isNaN(val)) {
            val = td[aColumn].textContent;
        }
        sorted.push({value: val, tr: tr[y]});
    }

    // sort tr by sorting value
    sorted.sort(function (a, b) {
        switch (aKind) {
        case 'desc':
            return a.value === b.value ? 0 : a.value < b.value ? 1 : -1;
        case 'asc':
            return a.value === b.value ? 0 : a.value < b.value ? -1 : 1;
        default:
            return 0;
        }
    });

    // removing previous rows
    for (y = tr.length - 1; y >= 1; y--) {
        tr[y].parentElement.removeChild(tr[y]);
    }
    // render table with new sorting order
    for (y = 0; y < sorted.length; y++) {
        table.appendChild(sorted[y].tr);
    }

    return sorted;
};

DH.table = function (aTable) {
    // Make table sortable by clicking on column header
    var table = typeof aTable === 'string' ? document.getElementById(aTable) : aTable,
        th = table.getElementsByTagName('th'),
        i;

    function onClickTh(event) {
        // click on TH element
        var s = event.target.textContent, kind, j, column;

        // change sorting order sign
        if (s.match('🔽')) {
            s = s.replace('🔽', '🔼');
            kind = 'asc';
        } else if (s.match('🔼')) {
            s = s.replace('🔼', '🔽');
            kind = 'desc';
        } else {
            s = s + '🔽';
            kind = 'desc';
        }
        for (j = 0; j < th.length; j++) {
            th[j].textContent = th[j].textContent.replace(/[🔼🔽]+/g, '');
        }
        event.target.textContent = s;

        // find column index
        for (j = 0; j < event.target.parentElement.childNodes.length; j++) {
            if (event.target === event.target.parentElement.childNodes[j]) {
                column = j;
            }
        }

        // sort table
        DH.tableSort(aTable, column, kind);
    }

    // add click listeners
    for (i = 0; i < th.length; i++) {
        th[i].style.color = 'blue';
        th[i].addEventListener('click', onClickTh, true);
    }

    return table;
};

