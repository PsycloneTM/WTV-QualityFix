# W.tv Quality Selector Fix

A userscript that fixes video quality selector crashes on W.tv by handling `structuredClone` Proxy cloning errors.

## Problem

When attempting to change video quality on W.tv, the site's video player (likely using Amazon IVS) encounters a crash due to `structuredClone` failing when trying to clone Proxy objects. This prevents users from selecting their desired video quality.

## Solution

This userscript intercepts calls to `window.structuredClone` and provides robust error handling with multiple fallback strategies:

1. **Primary**: Attempts the native `structuredClone` operation
2. **Fallback 1**: Uses JSON serialization (`JSON.parse(JSON.stringify())`) if native cloning fails
3. **Fallback 2**: Returns the original object if both methods fail

## Installation

### Prerequisites
- A userscript manager extension:
  - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
  - [Greasemonkey](https://www.greasespot.net/) (Firefox)
  - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

### Steps
1. Install [Tampermonkey](https://www.tampermonkey.net/) for your web browser
2. Click [here](https://github.com/PsycloneTM/WTV-QualityFix/raw/refs/heads/main/WTV%20Quality%20Selector%20Fix-1.0.user.js) to open the userscript in the Tampermonkey dashboard, which will prompt you to install
3. Click "Install"

## Usage

Once installed, the script runs automatically on all `*.w.tv` pages. You should now be able to:
- Select video quality without crashes
- Change quality settings smoothly
- Use the quality selector as intended

## Technical Details

- **Runs at**: `document-start` (before page loads, ensuring the fix is in place early)
- **Permissions**: None required (`@grant none`)
- **Matches**: All W.tv domains (`*://*.w.tv/*`)
- **Version**: 1.0
- **License**: MIT

## Compatibility

- ✅ Firefox
- ✅ Chrome/Chromium browsers
- ✅ Edge
- ✅ Safari (with Tampermonkey)

## How It Works

The script overrides the native `structuredClone` function with a wrapped version that catches errors:
```javascript
window.structuredClone = function(obj, options) {
    try {
        return originalStructuredClone(obj, options);
    } catch (cloneError) {
        // Fallback to JSON serialization
        return JSON.parse(JSON.stringify(obj));
    }
}
```

This prevents the player from crashing when encountering objects that can't be cloned normally (such as Proxies).

## Troubleshooting

**Script not working?**
- Ensure your userscript manager is enabled
- Check that the script is enabled in your userscript manager
- Verify you're on a `*.w.tv` domain
- Try refreshing the page (Ctrl+R or Cmd+R)
- Check browser console (F12) for any error messages

**Still having issues?**
- Open browser console (F12)
- Look for messages starting with "W.tv Fix:"
- Report issues with console output included

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

**CycloneTM**

## Changelog

### v1.0
- Initial release
- Basic Proxy clone error fix

---

**Disclaimer**: This is an unofficial userscript and is not affiliated with or endorsed by W.tv.
