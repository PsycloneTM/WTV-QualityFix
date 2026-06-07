// ==UserScript==
// @name         WTV Quality Selector Fix + Auto High Quality
// @namespace    http://tampermonkey.net/
// @version      1.8
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

  let bestQuality = null;
  const _getItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key) {
    if (key !== "stream-settings" || !bestQuality)
      return _getItem.apply(this, arguments);
    try {
      const raw = _getItem.call(this, key);
      const existing = raw ? JSON.parse(raw) : {};
      return JSON.stringify({
        volume: 50,
        isMuted: false,
        quality: bestQuality,
      });
    } catch {
      return _getItem.call(this, key);
    }
  };

  const _Worker = window.Worker;
  window.Worker = function (url, opts) {
    const w = new _Worker(url, opts);
    if (typeof url !== "string" || !url.includes("ivs")) return w;
    const _post = w.postMessage.bind(w);
    let qualities = [],
      sent = false,
      userSelected = false;
    function sendBest() {
      if (!qualities.length) return;
      bestQuality = deproxy(qualities[0]);
      sent = true;
      _post({ id: 0, funcName: "setQuality", args: [bestQuality, false] });
    }
    w.addEventListener("message", (evt) => {
      try {
        const data = deproxy(evt.data);
        if (data?.type !== 12) return;
        const { key, value } = data.arg ?? {};
        if (key === "qualities" && Array.isArray(value) && value.length) {
          qualities = value;
          sendBest();
        }
        if (
          key === "quality" &&
          value?.name &&
          bestQuality &&
          !userSelected &&
          value.name !== bestQuality.name
        )
          sendBest();
      } catch {}
    });

    w.postMessage = function (msg, transfer) {
      try {
        const clean = deproxy(msg);
        if (clean?.funcName === "setQuality" && qualities.length) {
          if (sent) userSelected = true;
          else clean.args[0] = deproxy(qualities[0]);
        }
        if (clean?.funcName === "load") {
          const t = setInterval(() => {
            if (sent) return clearInterval(t);
            qualities.length
              ? (sendBest(), clearInterval(t))
              : _post({ id: 0, funcName: "getQualities" });
          }, 500);
          setTimeout(() => clearInterval(t), 15000);
        }
        return _post(clean, transfer || []);
      } catch (e) {
        if (e instanceof DOMException)
          return _post(deproxy(msg), transfer || []);
        throw e;
      }
    };
    return w;
  };
})();
