// ==UserScript==
// @name         Kowal Auto Submiter
// @namespace    http://www.google.com/search?q=mabakay
// @version      1.0
// @description  Allows to automaticaly parse and submit of scaned codes.
// @description:pl-PL Pozwala na automatyczne parsowanie i wysyłanie zeskanowanych kodów.
// @author       mabakay
// @copyright    2019, mabakay
// @date         12 may 2019
// @license      GPL-3.0
// @run-at       document-end
// @supportURL   https://github.com/mabakay/kowalAutoSubmitter
// @match        https://portal-prod-pl.nmvs.eu/NMVS_PORTAL/sn/Serialnumber.xhtml*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var formBlock = document.getElementById('serialnumberForm:snPrcessPanel');
    if (formBlock == null) {
        fail();
    }

    var tableBlock = document.getElementById('serialnumberForm:j_id_27');
    if (tableBlock == null) {
        fail();
    }

    var gtinInput = document.getElementById('serialnumberForm:gtin')
    var serialNrInput = document.getElementById('serialnumberForm:serialNr')
    var lotInput = document.getElementById('serialnumberForm:lot')
    var expiryInput = document.getElementById('serialnumberForm:expiry')
    var executeButton = document.getElementById('serialnumberForm:execute')

    if (gtinInput == null || serialNrInput == null || lotInput == null || expiryInput == null || executeButton == null) {
        fail();
    }

    tableBlock.setAttribute('style', 'width: 100%');


    formBlock.prepend(htmlToElement('<div class="ui-panel-content ui-widget-content"><div><div class="row"><div class="hidden-md col-xs-4"><label for="ex:kowal_paste">Kod produktu (<input id="ex:kowal_autosubmit" type="checkbox" checked="checked"><label for="ex:kowal_autosubmit">wysyłaj automatycznie</label>)</label></div><div class="hidden-md col-xs-8"><input id="ex:kowal_paste" type="text" placeholder="Zeskanuj lub przepisz kod..." class="ui-inputfield ui-inputtext ui-widget ui-state-default ui-corner-all"></div></div></div></div>'));
    formBlock.prepend(htmlToElement('<div class="ui-panel-titlebar ui-widget-header ui-helper-clearfix ui-corner-all"><span class="ui-panel-title">Automatyzacja wsadu</span></div>'));

    var checkbox = document.getElementById('ex:kowal_autosubmit');
    var input = document.getElementById('ex:kowal_paste');

    input.addEventListener('paste', function (event) {
        // Get pasted data via clipboard API
        var clipboardData = event.clipboardData || window.clipboardData;
        var pastedData = clipboardData.getData('Text');

        if (pastedData.length >= 2 && pastedData.substr(pastedData.length - 2) == '\r\n') {
            event.stopPropagation();
            event.preventDefault();

            input.value = pastedData;

            if (parse(pastedData.substr(0, pastedData.length - 2))) {
                if (checkbox.checked) {
                    executeButton.click();
                }
            }
        }
    });

    input.addEventListener("keydown", function (event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            if (!parse(input.value)) {
                event.preventDefault();
                event.stopPropagation();

                alert('Nieprawidłowy kod produktu.');
            }
        }
    });

    function fail() {
        alert('Struktura strony uległa zmianie. Brak możliwości aktywowania rozszerzenia.');
    }

    function htmlToElement(html) {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    function parse(code) {
        if (code.length < 2) {
            return false;
        }

        var gtin = null;
        var serialNr = null;
        var lot = null;
        var expiry = null;

        var match = code.match(/^01(.+?)17(.+?)21(.+?)10(.+?)$/);
        if (match != null) {
            gtin = match[1];
            expiry = match[2];
            serialNr = match[3];
            lot = match[4];
        } else {
            match = code.match(/^01(.+?)17(.+?)10(.+?)21(.+?)$/);
            if (match != null) {
                gtin = match[1];
                expiry = match[2];
                lot = match[3];
                serialNr = match[4];
            }
        }

        if (gtin != null && serialNr != null && lot != null && expiry != null) {
            gtinInput.value = gtin;
            serialNrInput.value = serialNr;
            lotInput.value = lot;
            expiryInput.value = expiry;

            return true;
        }

        return false;
    }
})();
