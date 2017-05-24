console.log("Waiting for session message...")
chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
    if (msg.session) {
        console.log("Session msg: " + JSON.stringify(msg))
        chrome.storage.local.get(["session"], function (items) {
            var oldSession = items.session;

            msg.session.sessionTime = new Date().valueOf();
            chrome.storage.local.set({"session": msg.session}, function () {
                if (!oldSession || oldSession.session != msg.session.session) {
                    chrome.notifications.create('new-session-created-notification', {
                        type: 'basic',
                        iconUrl: 'logo-128.png',
                        title: 'Session Updated',
                        message: 'A new session has been created\n' +
                        'Click the icon to start presenting!',
                        contextMessage: msg.session.session
                    }, function (notificationId) {
                    });
                }
            });
        });
    }
});