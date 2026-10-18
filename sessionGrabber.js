// Stores a session that remote-sli.de handed over (see handleSiteMessage in background.js)
function grabSession(session) {
    console.log("Session msg: " + JSON.stringify(session))
    chrome.storage.local.get(["session"], function (items) {
        var oldSession = items.session;

        session.sessionTime = new Date().valueOf();
        chrome.storage.local.set({"session": session});
        if (!oldSession || oldSession.session != session.session) {
            console.log("notification created")
            chrome.notifications.create('new-session-created-notification', {
                type: 'basic',
                iconUrl: 'img/logo-128.png',
                title: 'Session Updated',
                message: 'A new session has been created\n' +
                'Click the icon to start presenting!',
                contextMessage: session.session
            }, function (notificationId) {
            });
        }
    });
}
