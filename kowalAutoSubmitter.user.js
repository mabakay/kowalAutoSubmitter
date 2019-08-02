// ==UserScript==
// @name         Kowal Auto Submiter
// @namespace    http://www.google.com/search?q=mabakay
// @version      1.22
// @description  Allows to automaticaly parse and submit of scaned codes.
// @description:pl-PL Pozwala na automatyczne parsowanie i wysyłanie zeskanowanych kodów.
// @author       mabakay
// @copyright    2019, mabakay
// @date         01 July 2019
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
        /^01(?<gtin>.{14}?)17(?<expiry>[0-9]{6}?)21(?<serialNr>.{1,20}?)10(?<lot>.{1,20}?)$/,
        /^01(?<gtin>.{14}?)21(?<serialNr>.{1,20}?)17(?<expiry>[0-9]{6}?)10(?<lot>.{1,20}?)$/,
        /^01(?<gtin>.{14}?)10(?<lot>.{1,20}?)17(?<expiry>[0-9]{6}?)21(?<serialNr>.{1,20}?)$/,
        /^01(?<gtin>.{14}?)17(?<expiry>[0-9]{6}?)10(?<lot>.{1,20}?)21(?<serialNr>.{1,20}?)$/,
        /^01(?<gtin>.{14}?)21(?<serialNr>.{1,20}?)10(?<lot>.{1,20}?)17(?<expiry>[0-9]{6}?)$/,
        /^01(?<gtin>.{14}?)10(?<lot>.{1,20}?)21(?<serialNr>.{1,20}?)17(?<expiry>[0-9]{6}?)$/
    ]

    // Validate site
    var formBlock = document.getElementById('serialnumberForm:snProcessPanel');
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

    // Inject extended fields
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

    // Detect result table change
    var resetButtonClicked = false;

    var resetButton = document.getElementById('serialnumberForm:resetDataTable');
    if (resetButton != null) {
        resetButton.addEventListener('click', function () {
            resetButtonClicked = true;
        });
    }

    var resultTable = document.getElementById('serialnumberForm:snListPanel');

    var callback = function (mutations, observer) {
        if (resetButtonClicked) {
            resetButtonClicked = false;
            return;
        }

        for (var m = 0; m < mutations.length; ++m) {
            if (mutations[m].type == 'childList' && mutations[m].addedNodes.length > 0) {
                for (var i = 0; i < mutations[m].addedNodes.length; ++i) {
                    if (mutations[m].addedNodes[i].id == "serialnumberForm:dataTable") {
                        var table = mutations[m].addedNodes[i].getElementsByTagName('table')[0];

                        if (table.rows.length > 0) {
                            var lastRow = table.rows[table.rows.length - 1];

                            if (table.rows.length == 2 && lastRow.getElementsByTagName('td').length == 1) {
                                return;
                            }

                            // Check if last row has failed status
                            if (lastRow.getElementsByClassName('snRowStyleFailed').length > 0) {
                                console.log('fail');
                                playSound('fail');
                            } else {
                                console.log('success');
                                playSound('success');
                            }
                        }
                    }
                }
            }
        }
    };

    var observer = new MutationObserver(callback);
    observer.observe(resultTable, { attributes: false, childList: true, subtree: false });

    // Sound functionality
    var sounds = {
        "fail": {
            url: "https://www.bogusz.it/sounds/sound.php?s=fail"
        },
        "success": {
            url: "https://www.bogusz.it/sounds/sound.php?s=success"
        }
    };

    var soundContext = new AudioContext();

    for (var key in sounds) {
        loadSound(key);
    }

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

    function loadSound(name) {
        var sound = sounds[name];

        var url = sound.url;
        var buffer = sound.buffer;

        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        request.onload = function () {
            soundContext.decodeAudioData(request.response, function (newBuffer) {
                sound.buffer = newBuffer;
            });
        }

        request.send();
    }

    function playSound(name, options) {
        var sound = sounds[name];
        var soundVolume = sounds[name].volume || 1;

        var buffer = sound.buffer;
        if (buffer) {
            var source = soundContext.createBufferSource();
            source.buffer = buffer;

            var volume = soundContext.createGain();

            if (options) {
                if (options.volume) {
                    volume.gain.value = soundVolume * options.volume;
                }
            } else {
                volume.gain.value = soundVolume;
            }

            volume.connect(soundContext.destination);
            source.connect(volume);
            source.start(0);
        }
    }
})();
