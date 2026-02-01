// ==UserScript==
// @name         WTV Quality Selector Fix
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fixes video quality selector crashes by handling Proxy cloning errors in structuredClone
// @author       CycloneTM
// @match        *://*.w.tv/*
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix-1.0.user.js
// @downloadURL  https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix-1.0.user.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    const originalStructuredClone = window.structuredClone;
    window.structuredClone = function(obj, options) {
        try {
            return originalStructuredClone(obj, options);
        } catch (cloneError) {
            console.warn("W.tv Fix: structuredClone failed, using JSON fallback.", cloneError);
            try {
                return JSON.parse(JSON.stringify(obj));
            } catch (jsonError) {
                console.error("W.tv Fix: JSON fallback also failed, returning original object.", jsonError);
                return obj; // Last resort: return original
            }
        }
    }
})();
