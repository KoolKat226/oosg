// Shop where player can buy stuff
// linter: lint-js2
/*globals document, window */

var GT = window.GT || {};

GT.allGoods = function () {
    // All tiles except characters
    "use strict";
    var k;
    var o = {};
    for (k in GT.tiles) {
        if (GT.tiles.hasOwnProperty(k)) {
            if (k.match(/^(invisible|boy|girl|ghost|spider|slime|frog|rat|skeleton|bat|nw_)/)) {
                continue;
            }
            if (k.match(/^t[0-9]+$/)) {
                continue;
            }
            if (k.match(/^sls[0-9]+$/)) {
                continue;
            }
            if (GT.goods.hasOwnProperty(k)) {
                o[k] = GT.goods[k];
            } else {
                o[k] = JSON.parse(JSON.stringify(GT.tiles[k]));
                o[k].title = k;
                o[k].description = k;
                o[k].price = 1;
                o[k].tile = k;
            }
        }
    }
    return o;
};

GT.shop = function (aTitle, aGoods, aInventory, aPriceCoef) {
    // render one goods table
    "use strict";
    var g;
    var table;
    var tr;
    var td;
    var btn;
    var r;
    var buyPrice;
    var sellPrice;
    var amount = {};
    var buy = {};
    var sell = {};
    var first;
    var rows;
    var div;
    var updateButtons;
    aPriceCoef = aPriceCoef || 1;

    function hide() {
        // hide shop
        div.parentElement.removeChild(div);
    }

    // div
    div = document.body.appendChild(document.createElement("div"));
    div.innerHTML = `
        <div class="gt_shop">
            <nav>
                <span></span>
                <h1></h1>
                <button>X</button>
            </nav>
            <div class="items">
            </div>
        <div>
    `;
    var gold = div.querySelector("span");
    div.querySelector("h1").textContent = aTitle;
    div.querySelector("button").onclick = hide;

    // sort goods by title
    rows = [];
    for (g in aGoods) {
        if (aGoods.hasOwnProperty(g)) {
            // no tags
            if (!g.match(":") && g !== "gold") {
                aGoods[g].tile = g;
                rows.push(aGoods[g]);
            }
        }
    }
    rows.sort(function (a, b) {
        if (a.title < b.title) {
            return -1;
        }
        if (a.title > b.title) {
            return 1;
        }
        return 0;
    });

    function onBuy(event) {
        // buy item
        var tile = event.target.data;
        //console.log("buy", tile);
        if (tile.price * aPriceCoef > aInventory.amount("gold")) {
            alert("You need $" + tile.price * aPriceCoef + " but only have " + aInventory.amount("gold"));
            return;
        }
        aInventory.remove("gold", tile.price * aPriceCoef);
        aInventory.add(tile.tile, 1);
        updateButtons(tile.tile);
    }

    function onSell(event) {
        // sell item
        var tile = event.target.data;
        //console.log("sell", tile);
        if (aInventory[tile.tile] <= 0) {
            alert("You don't have " + tile.tile);
            return;
        }
        aInventory.add("gold", Math.ceil(tile.price * aPriceCoef / 2));
        aInventory.remove(tile.tile, 1);
        updateButtons(event.target.data.tile);
    }

    // table
    table = document.createElement("table");
    for (r = 0; r < rows.length; r++) {
        // row
        tr = document.createElement("tr");
        table.appendChild(tr);

        buyPrice = parseInt(rows[r].price * aPriceCoef, 10);
        sellPrice = Math.ceil(buyPrice / 2);

        // tile
        td = document.createElement("td");
        GT.standAloneTile(td, [rows[r].tile], 2, GT.size);
        tr.appendChild(td);

        // description
        td = document.createElement("td");
        td.className = "description";
        td.textContent = rows[r].description;
        tr.appendChild(td);

        // player"s amount
        td = document.createElement("td");
        tr.appendChild(td);
        amount[rows[r].tile] = td;

        // buy button
        td = document.createElement("td");
        btn = document.createElement("button");
        btn.innerHTML = "Buy<br>" + parseFloat(buyPrice) + ",-";
        btn.onclick = onBuy;
        btn.data = rows[r];
        td.appendChild(btn);
        tr.appendChild(td);
        buy[rows[r].tile] = btn;
        if (r === 0) {
            first = btn;
        }

        // sell button
        td = document.createElement("td");
        btn = document.createElement("button");
        btn.innerHTML = "Sell<br>" + parseFloat(sellPrice) + ",-";
        btn.onclick = onSell;
        btn.data = rows[r];
        td.appendChild(btn);
        tr.appendChild(td);
        sell[rows[r].tile] = btn;
    }
    div.querySelector(".items").appendChild(table);

    updateButtons = function (aTile) {
        // update price and availability of buttons
        var k;
        var go = aInventory.amount("gold");
        var a;
        gold.textContent = "$" + go;
        if (table) {
            for (k in amount) {
                if (amount.hasOwnProperty(k)) {
                    a = aInventory.amount(k);
                    buy[k].disabled = go < aGoods[k].price * aPriceCoef;
                    sell[k].disabled = a <= 0;
                    amount[k].textContent = a ? a + "x" : "";
                }
            }
        }
    };
    updateButtons();

    return { div: div, h1: div.querySelector("h1"), table: table, amount: amount, buy: buy, sell: sell, first: first };
};

