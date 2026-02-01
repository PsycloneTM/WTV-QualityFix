// ==UserScript==
// @name         WTV Quality Selector Fix + Auto High Quality
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Forces playback quality to the highest available on w.tv
// @author       CycloneTM
// @match        *://*.w.tv/*
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix%20+%20Auto%20High%20Quality-1.1.user.js
// @downloadURL  https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix%20+%20Auto%20High%20Quality-1.1.user.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const HIGH_QUALITY_VALUE = JSON.stringify({
        "isMuted": false,
        "volume": 50,
        "quality": {
            "name": "1080p60",
            "group": "chunked",
            "codecs": "avc1.64042A,mp4a.40.2",
            "bitrate": 9038107,
            "width": 1920,
            "height": 1080,
            "framerate": 60,
            "isDefault": true,
            "variantSource": "source",
            "variantId": "",
            "attributes": { "Pipeline": "", "SourceType": "" },
            "sourceGroups": []
        }
    });

    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
        if (key === 'stream-settings') return HIGH_QUALITY_VALUE;
        return originalGetItem.apply(this, arguments);
    };

    const originalStructuredClone = window.structuredClone;
    window.structuredClone = function(obj, options) {
        try { return originalStructuredClone(obj, options); }
        catch (e) { return JSON.parse(JSON.stringify(obj)); }
    };
})();