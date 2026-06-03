// ==UserScript==
// @name         WTV Quality Selector Fix + Auto High Quality
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Forces playback quality to the highest available on w.tv
// @author       CycloneTM
// @match        *://*.w.tv/*
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix%20+%20Auto%20High%20Quality.user.js
// @downloadURL  https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix%20+%20Auto%20High%20Quality.user.js
// @license      MIT
// ==/UserScript==

(function () {
   "use strict";

  const deproxy = (obj) => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  };

  const _clone = window.structuredClone;
  window.structuredClone = (obj, opts) => {
    try {
      return _clone(obj, opts);
    } catch {
      return deproxy(obj);
    }
  };

  const _post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (msg, transfer) {
    try {
      return _post.apply(this, arguments);
    } catch (e) {
      if (e instanceof DOMException)
        return _post.call(this, deproxy(msg), transfer || []);
      throw e;
    }
  };

  const QUALITY_SETTING = JSON.stringify({
    isMuted: false,
    volume: 50,
    quality: {
      name: "1080p60",
      group: "chunked",
      codecs: "avc1.64042A,mp4a.40.2",
      bitrate: 9038107,
      width: 1920,
      height: 1080,
      framerate: 60,
      isDefault: true,
    },
  });
  const _getItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key) {
    return key === "stream-settings"
      ? QUALITY_SETTING
      : _getItem.apply(this, arguments);
  };

  function hookPlayer(player) {
    if (player.__wtvHooked) return;
    player.__wtvHooked = true;

    const _setQuality = player.setQuality.bind(player);
    player.setQuality = (quality, skipLatency) =>
      _setQuality(deproxy(quality), skipLatency);

    const applyBest = () => {
      try {
        const qualities = player.getQualities();
        if (qualities?.length) {
          player.setQuality(qualities[0], false);
        }
      } catch (e) {
        console.warn("[WTV-Fix] applyBest failed:", e);
      }
    };

    applyBest();
    ["QUALITIES_CHANGED", "PLAYING"].forEach((ev) => {
      try {
        player.addEventListener(ev, applyBest);
      } catch {}
    });
  }

  let ticks = 0;
  const poll = setInterval(() => {
    if (++ticks > 60) return clearInterval(poll);
    for (const val of Object.values(window)) {
      try {
        if (
          typeof val?.setQuality === "function" &&
          typeof val?.getQualities === "function"
        )
          hookPlayer(val);
        if (typeof val?.player?.setQuality === "function")
          hookPlayer(val.player);
      } catch {}
    }
  }, 500);
})();
