chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
    if (msg.ping && msg.ping == 'hello') {
        sendResponse({pong: "hello"});
    }
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action == 'socketEvent') {
        var event = msg.event;
        var data = msg.data;

        if (event == 'init') {
            if (data.state == 'success') {
                chrome.browserAction.setBadgeText({text: data.info.remotes.toString()})
            }
        }

        if (event == 'info') {
            if (data.type == 'client_connected' || data.type == 'client_disconnected') {
                chrome.browserAction.setBadgeText({text: data.info.remotes.toString()})
            }
        }
    }
    if (msg.action == "sessionUpdate") {
        chrome.storage.local.get(["session"], function (items) {
            console.log(items)
            if (items && items.session) {
                $.extend(msg.session, items.session);
            }
            chrome.storage.local.set({"session": msg.session}, function () {
            });
        });
    }
    if (msg.action == 'controlUpdate') {
        if (msg.active) {
            chrome.browserAction.setBadgeBackgroundColor({color: "lime"})
        } else {
            chrome.browserAction.setBadgeBackgroundColor({color: "blue"})
            chrome.browserAction.setBadgeText({text: ""})
        }
    }
})

chrome.storage.onChanged.addListener(function (changes, area) {
    if (area == 'local') {
        console.log("changes: " + JSON.stringify(changes))
        if (changes.session) {

        }
    }
})