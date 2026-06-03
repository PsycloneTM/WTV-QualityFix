// ==UserScript==
// @name         WTV Quality Selector Fix
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Fixes video quality selector crashes by handling Proxy cloning errors in structuredClone
// @author       CycloneTM
// @match        *://*.w.tv/*
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix.user.js
// @downloadURL  https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix.user.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    function deproxy(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return obj;
        }
    }

    const _clone = window.structuredClone;
    window.structuredClone = function (obj, opts) {
        try {
            return _clone(obj, opts);
        } catch (e) {
            return deproxy(obj);
        }
    };

    const _workerPostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (msg, transfer) {
        try {
            // Attempt the original call first (fast path for non-proxy objects)
            return _workerPostMessage.apply(this, arguments);
        } catch (e) {
            if (e instanceof DOMException) {
                // Sanitise and retry
                const clean = deproxy(msg);
                return _workerPostMessage.call(this, clean, transfer || []);
            }
            throw e;
        }
    };
})();
