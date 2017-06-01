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
                chrome.tabs.getSelected(null, function (tab) {
                    chrome.browserAction.setBadgeText({text: data.info.remotes.length.toString(), tabId: tab.id})
                })
            }
        }

        if (event == 'info') {
            if (data.type == 'client_connected' || data.type == 'client_disconnected') {
                chrome.tabs.getSelected(null, function (tab) {
                    chrome.browserAction.setBadgeText({text: data.info.remotes.length.toString(), tabId: tab.id})
                })
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
    if (msg.action == 'controlUpdate') {//TODO: properly handle disconnect event
        chrome.tabs.getSelected(null, function (tab) {
            if (msg.active) {
                chrome.browserAction.setBadgeBackgroundColor({color: "#25bb25", tabId: tab.id})
            } else {
                chrome.browserAction.setBadgeBackgroundColor({color: "blue", tabId: tab.id})
                chrome.browserAction.setBadgeText({text: "", tabId: tab.id})
            }
        })
    }
})

chrome.storage.onChanged.addListener(function (changes, area) {
    if (area == 'local') {
        console.log("changes: " + JSON.stringify(changes))
        if (changes.session) {

        }
    }
})