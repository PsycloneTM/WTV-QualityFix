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
})();
