// ==UserScript==
// @name         Kowal Auto Submiter
// @namespace    http://www.google.com/search?q=mabakay
// @version      1.1
// @description  Allows to automaticaly parse and submit of scaned codes.
// @description:pl-PL Pozwala na automatyczne parsowanie i wysyłanie zeskanowanych kodów.
// @author       mabakay
// @copyright    2019, mabakay
// @date         16 may 2019
// @license      GPL-3.0
// @run-at       document-end
// @supportURL   https://github.com/mabakay/kowalAutoSubmitter
// @updateURL    https://github.com/mabakay/kowalAutoSubmitter/raw/master/kowalAutoSubmitter.user.js
// @downloadURL  https://github.com/mabakay/kowalAutoSubmitter/raw/master/kowalAutoSubmitter.user.js
// @match        https://portal-prod-pl.nmvs.eu/NMVS_PORTAL/sn/Serialnumber.xhtml*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var parsePaterns = [
        /^01(?<gtin>.+?)17(?<expiry>[0-9]{6}?)21(?<serialNr>.+?)10(?<lot>.+?)$/,
        /^01(?<gtin>.+?)21(?<serialNr>.+?)17(?<expiry>[0-9]{6}?)10(?<lot>.+?)$/,
        /^01(?<gtin>.+?)10(?<lot>.+?)17(?<expiry>[0-9]{6}?)21(?<serialNr>.+?)$/,
        /^01(?<gtin>.+?)17(?<expiry>[0-9]{6}?)10(?<lot>.+?)21(?<serialNr>.+?)$/,
        /^01(?<gtin>.+?)21(?<serialNr>.+?)10(?<lot>.+?)17(?<expiry>[0-9]{6}?)$/,
        /^01(?<gtin>.+?)10(?<lot>.+?)21(?<serialNr>.+?)17(?<expiry>[0-9]{6}?)$/
    ]

    // Validate site
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

    // Resize whole data table
    tableBlock.setAttribute('style', 'width: 100%');

    // inject extended fields
    formBlock.prepend(htmlToElement('<div class="ui-panel-content ui-widget-content"><div><div class="row"><div class="hidden-md col-xs-4"><label for="ex:kowal_paste">Kod produktu (<input id="ex:kowal_autosubmit" type="checkbox" checked="checked"><label for="ex:kowal_autosubmit">wysyłaj automatycznie</label>)</label></div><div class="hidden-md col-xs-8"><input id="ex:kowal_paste" type="text" placeholder="Zeskanuj lub przepisz kod..." class="ui-inputfield ui-inputtext ui-widget ui-state-default ui-corner-all"></div></div></div></div>'));
    formBlock.prepend(htmlToElement('<div class="ui-panel-titlebar ui-widget-header ui-helper-clearfix ui-corner-all"><span class="ui-panel-title">Automatyzacja wsadu</span></div>'));

    // Attach to events
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

                input.focus();
                input.select();
            }
        }
    });

    input.addEventListener("keydown", function (event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (!parse(input.value)) {
                alert('Nieprawidłowy kod produktu.');
            } else {
                if (checkbox.checked) {
                    executeButton.click();
                }

                input.focus();
                input.select();
            }
        }
    });

    // Methods
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

        for (var i = 0; i < parsePaterns.length; i++) {
            var match = code.match(parsePaterns[i]);
            if (match != null) {
                gtin = match.groups.gtin;
                expiry = match.groups.expiry;
                serialNr = match.groups.serialNr;
                lot = match.groups.lot;

                break;
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
