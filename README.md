# W.tv Quality Selector Fix

An unofficial userscript that fixes video quality selector crashes on W.tv caused by Vue/Nuxt Proxy objects failing to clone inside the Amazon IVS Player.

## Problem

W.tv uses Amazon IVS Player embedded in a Nuxt/Vue app. When changing or auto-selecting video quality, the player internally calls `postMessage` to communicate with its Web Worker. The structured clone algorithm used by `postMessage` cannot handle Vue reactive Proxy objects, causing:

```
Uncaught DOMException: Proxy object could not be cloned.
```

This crashes the quality selector entirely, leaving users stuck on whatever quality was loaded initially.

## Solution

The script applies fixes at multiple layers to ensure Proxy objects are stripped before they reach any cloning boundary:

1. **`structuredClone` wrapper** — catches clone failures and falls back to a JSON round-trip (`JSON.parse(JSON.stringify())`) that produces a guaranteed plain object
2. **IVS worker intercept** — patches `postMessage` on the IVS worker instance directly; upgrades any quality the site tries to set on initial load and retries with a sanitised message on `DOMException`
3. **Quality drift correction** — listens for worker messages and corrects any ABR-driven quality changes back to the highest available, until the user manually selects a quality
4. **`localStorage` spoof** — dynamically returns the best known quality for the `stream-settings` key so pre-player code paths also read the correct value; all other fields (volume, mute state, etc.) are passed through untouched from the site's own storage

## Installation

### Prerequisites

A userscript manager extension:
- [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
- [Greasemonkey](https://www.greasespot.net/) (Firefox)
- [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

### Steps

1. Install a userscript manager (if you haven't already)
2. Click one of the following to install:
   - [Version 1.2 - Quality Fix Only](https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix.user.js)
   - [Version 1.6 - Quality Fix + Auto High Quality](https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix%20+%20Auto%20High%20Quality.user.js)
3. Click "Install" when prompted

## Usage

Once installed, the script runs automatically on all `*.w.tv` pages. You should now be able to:

- Select video quality without crashes
- Have quality automatically set to the highest available on load *(Auto High Quality version)*
- Manually change quality at any time and have your selection respected *(Auto High Quality version)*

## Technical Details

- **Runs at**: `document-start` (before page loads, ensuring patches are in place before IVS initialises)
- **Permissions**: None required (`@grant none`)
- **Matches**: All W.tv domains (`*://*.w.tv/*`)
- **License**: MIT

## Compatibility

- ✅ Firefox
- ✅ Chrome/Chromium browsers
- ✅ Edge
- ✅ Safari (with Tampermonkey)

## How It Works

### Root cause

The crash originates deep inside IVS Player's worker bridge:

```
setQuality → internal postMessage → Web Worker
                                        ↑
                          Vue Proxy can't be cloned here
                          → DOMException thrown
```

### Fix layer 1 — `structuredClone`

```javascript
window.structuredClone = function(obj, options) {
    try {
        return originalStructuredClone(obj, options);
    } catch (e) {
        return JSON.parse(JSON.stringify(obj)); // strips Proxy wrappers
    }
};
```

### Fix layer 2 — IVS worker intercept

`postMessage` is patched on the IVS worker instance directly. Any `setQuality` call is upgraded to the highest quality until the user makes a manual selection. On `DOMException`, the message is sanitised and retried:

```javascript
worker.postMessage = function(msg, transfer) {
    try {
        const clean = deproxy(msg);
        if (clean?.funcName === "setQuality" && !userSelected) clean.args[0] = bestQuality;
        return originalPostMessage(clean, transfer || []);
    } catch (e) {
        if (e instanceof DOMException) return originalPostMessage(deproxy(msg), transfer || []);
        throw e;
    }
};
```

### Fix layer 3 — Quality drift correction

Worker messages are monitored for quality change events. If the player drifts away from the best quality via ABR before the user has made a manual selection, the script immediately corrects it:

```javascript
worker.addEventListener("message", (evt) => {
    const { key, value } = evt.data.arg ?? {};
    if (key === "quality" && !userSelected && value.name !== bestQuality.name) {
        worker.postMessage({ id: 0, funcName: "setQuality", args: [bestQuality, false] });
    }
});
```

Once the user manually changes quality via the selector, `userSelected` is set to `true` and drift correction stops, leaving full control to the user.

## Troubleshooting

**Script not working?**
- Ensure your userscript manager is enabled
- Check the script is enabled in your userscript manager's dashboard
- Verify you're on a `*.w.tv` domain
- Hard refresh the page (`Ctrl+Shift+R` / `Cmd+Shift+R`)
- Open the browser console (`F12`) and check for errors

**Still having issues?**
- Open the browser console (`F12`)
- Look for any messages related to `DOMException` or `Proxy`
- [Report an issue](https://github.com/PsycloneTM/WTV-QualityFix/issues) and include the full console output

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**CycloneTM**

## Changelog

### v1.6
- Fixed audio bug where volume and mute state were being overwritten on load
- `localStorage` spoof now only patches the `quality` field; all other settings (volume, mute state, etc.) are left entirely to the site's own logic

### v1.5
- Auto high quality now only applies on initial load — manual quality changes via the selector are fully respected and no longer overridden
- Drift correction disabled once the user has made a manual quality selection

### v1.4
- Replaced `Worker.prototype.postMessage` patching with a per-instance IVS worker intercept for more targeted and reliable interception
- Added IVS worker message listener to detect quality list and drift events, auto-correcting any ABR quality changes back to the highest available
- Added polling on `load` to request qualities from the worker if not yet received, with a 15 s timeout to avoid indefinite polling
- Updated `localStorage` spoof to dynamically reflect the best known quality rather than a hardcoded preset
- Removed all console logging for a cleaner, release-ready build

### v1.3
- Added `Worker.prototype.postMessage` interception to fix the root crash path (`setQuality → postMessage → DOMException`)
- Added `player.setQuality` wrapper in Auto High Quality version to deproxy quality objects before they enter IVS
- Added IVS player instance polling (Auto High Quality version) to handle async Nuxt initialisation
- Improved `structuredClone` fallback with a final `return obj` safety net

### v1.2
- Refactored `deproxy` helper for reuse across all fix layers
- Extended `structuredClone` wrapper with additional fallback

### v1.1
- Added auto high quality feature
- Forces highest available playback quality by default

### v1.0
- Initial release
- Basic Proxy clone error fix via `structuredClone` wrapper

---

**Disclaimer**: This is an unofficial userscript and is not affiliated with or endorsed by W.tv.
