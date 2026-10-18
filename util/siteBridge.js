// Firefox has no externally_connectable, so remote-sli.de can't message the
// extension the way it does in Chrome. Instead it posts the same messages to its
// own window, and this relays them to the background and posts the answers back:
//   page -> {channel: "remoteslide", direction: "to-extension", id, message}
//   page <- {channel: "remoteslide", direction: "to-page", id, response}
window.addEventListener("message", function (event) {
    var data = event.data;
    if (event.source !== window || !data || data.channel !== "remoteslide" || data.direction !== "to-extension") {
        return;
    }
    chrome.runtime.sendMessage({action: "siteMessage", message: data.message}, function (response) {
        void chrome.runtime.lastError;
        window.postMessage({
            channel: "remoteslide",
            direction: "to-page",
            id: data.id,
            response: response
        }, window.location.origin);
    });
});
