// ==UserScript==
// @name         WTV Quality Selector Fix + Auto High Quality
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Forces playback quality to the highest available on w.tv
// @author       CycloneTM
// @match        *://*.w.tv/*
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix%20+%20Auto%20High%20Quality-1.3.user.js
// @downloadURL  https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix%20+%20Auto%20High%20Quality-1.3.user.js
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

    function hookIVSPlayer(player) {
        if (player.__wtvHooked) return;
        player.__wtvHooked = true;

        const _setQuality = player.setQuality.bind(player);

        // Replace setQuality with a wrapper that deproxies the argument
        player.setQuality = function (quality, skipLatency) {
            return _setQuality(deproxy(quality), skipLatency);
        };

        // Now try to apply the best quality
        tryBestQuality(player);

        // Also re-apply on quality list updates (e.g. adaptive stream changes)
        const tryEvents = ['QUALITIES_CHANGED', 'PLAYING'];
        const handler = () => tryBestQuality(player);
        tryEvents.forEach(ev => {
            try { player.addEventListener(ev, handler); } catch (_) {}
        });
    }

    function tryBestQuality(player) {
        try {
            const qualities = player.getQualities();
            if (!qualities || qualities.length === 0) return;
            // IVS returns qualities highest-bitrate first
            const best = deproxy(qualities[0]);
            player.setQuality(best, false);
            console.log('[WTV-Fix] Quality forced to', best.name || best.height + 'p');
        } catch (e) {
            console.warn('[WTV-Fix] tryBestQuality failed:', e);
        }
    }

    const HIGH_QUALITY_STORAGE = JSON.stringify({
        isMuted: false, volume: 50,
        quality: {
            name: "1080p60", group: "chunked",
            codecs: "avc1.64042A,mp4a.40.2",
            bitrate: 9038107, width: 1920, height: 1080,
            framerate: 60, isDefault: true,
        }
    });
    const _getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
        if (key === 'stream-settings') return HIGH_QUALITY_STORAGE;
        return _getItem.apply(this, arguments);
    };

    let pollCount = 0;
    const poll = setInterval(() => {
        pollCount++;
        for (const key of Object.keys(window)) {
            try {
                const val = window[key];
                if (val && typeof val.getQualities === 'function' && typeof val.setQuality === 'function') {
                    hookIVSPlayer(val);
                }
                if (val?.player && typeof val.player.setQuality === 'function') {
                    hookIVSPlayer(val.player);
                }
            } catch (_) {}
        }
        if (pollCount > 60) clearInterval(poll);
    }, 500);

})();
