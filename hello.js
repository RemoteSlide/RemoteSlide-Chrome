chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
    if (msg.ping && msg.ping == 'hello') {
        sendResponse({pong: "hello"});
    }
});