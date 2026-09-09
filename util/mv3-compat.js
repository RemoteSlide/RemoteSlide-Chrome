// Compatibility shim for the bundled RemoteSlide-Controller (inject/controller), which
// still calls the chrome.extension.* APIs that Manifest V3 removed. It is injected right
// before pageController.js so those calls keep resolving to their chrome.runtime.*
// equivalents. Drop this file once the controller submodule targets MV3 itself.
(function () {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        return;
    }
    try {
        if (!chrome.extension) {
            chrome.extension = {};
        }
        if (!chrome.extension.onMessage) {
            chrome.extension.onMessage = chrome.runtime.onMessage;
        }
        if (!chrome.extension.sendMessage) {
            chrome.extension.sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
        }
        if (!chrome.extension.getURL) {
            chrome.extension.getURL = chrome.runtime.getURL.bind(chrome.runtime);
        }
    } catch (e) {
        console.warn("Could not install the chrome.extension compatibility shim: " + e);
    }
})();
