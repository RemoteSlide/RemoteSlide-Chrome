importScripts("sessionGrabber.js");

chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
    if (msg.ping && msg.ping == 'hello') {
        sendResponse({pong: "hello"});
    }
});

// The badge belongs to the tab the controller runs in. Messages from the injected
// pageController carry that tab in sender.tab; anything else (e.g. the popup) falls
// back to the active tab of the last focused window.
function resolveTabId(sender) {
    if (sender && sender.tab && typeof sender.tab.id === 'number') {
        return Promise.resolve(sender.tab.id);
    }
    return chrome.tabs.query({active: true, lastFocusedWindow: true}).then(function (tabs) {
        return tabs.length > 0 ? tabs[0].id : undefined;
    });
}

function setRemoteCountBadge(sender, data) {
    resolveTabId(sender).then(function (tabId) {
        if (tabId === undefined) return;
        chrome.action.setBadgeText({text: data.info.remotes.length.toString(), tabId: tabId});
    });
}

// Handle messages from the pageController script
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action == 'socketEvent') {
        var event = msg.event;
        var data = msg.data;

        if (event == 'init') {
            if (data.state == 'success') {
                setRemoteCountBadge(sender, data);
            }
        }

        if (event == 'info') {
            if (data.type == 'client_connected' || data.type == 'client_disconnected') {
                setRemoteCountBadge(sender, data);
            }
        }
    }
    if (msg.action == "sessionUpdate") {
        chrome.storage.local.get(["session"], function (items) {
            console.log(items)
            if (items && items.session) {
                Object.assign(msg.session, items.session);
            }
            chrome.storage.local.set({"session": msg.session}, function () {
            });
        });
    }
    if (msg.action == 'controlUpdate') {//TODO: properly handle disconnect event
        resolveTabId(sender).then(function (tabId) {
            if (tabId === undefined) return;
            if (msg.active) {
                chrome.action.setBadgeBackgroundColor({color: "#25bb25", tabId: tabId})
            } else {
                chrome.action.setBadgeBackgroundColor({color: "blue", tabId: tabId})
                chrome.action.setBadgeText({text: "", tabId: tabId})
            }
        })
    }
    if (msg.action == "takeScreenshot") {
        takeScreenshot().then(function (image) {
            sendResponse({image: image});
        }).catch(function (err) {
            console.warn("Failed to take screenshot: " + err);
            sendResponse({});
        });
    }

    return true;
})

chrome.storage.onChanged.addListener(function (changes, area) {
    if (area == 'local') {
        console.log("changes: " + JSON.stringify(changes))
        if (changes.session) {

        }
    }
})


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log(changeInfo.status)
    console.log(tab.url);
});

function takeScreenshot() {
    var tStart = Date.now();
    return chrome.storage.local.get(["controlledWindow"]).then(function (items) {
        var options = {format: "jpeg", quality: 50};
        return typeof items.controlledWindow === 'number'
            ? chrome.tabs.captureVisibleTab(items.controlledWindow, options)
            : chrome.tabs.captureVisibleTab(options);
    }).then(function (image) {
        var tTime = Date.now() - tStart;
        var rStart = Date.now();
        console.log("Take Screenshot time: " + tTime);
        return resizeImage(image, 0.4).then(function (dataUrl) {
            var rTime = Date.now() - rStart;
            console.log("Resize time: " + rTime);
            console.log("Total time: " + (Date.now() - tStart));
            // Strip the "data:image/png;base64," header, the remote only wants the payload
            var img = dataUrl.substring(dataUrl.indexOf(",") + 1);
            var imgFileSize = Math.round((img.length) * 3 / 4);
            console.info("Screenshot File Size: " + (imgFileSize / (1024)).toFixed(2) + "KB")
            return img;
        });
    });
}

// Service workers have no DOM, so the resize runs on an OffscreenCanvas
// instead of an <img> plus a detached <canvas>.
function resizeImage(url, percent) {
    return fetch(url).then(function (response) {
        return response.blob();
    }).then(function (blob) {
        return createImageBitmap(blob);
    }).then(function (bitmap) {
        var canvas = new OffscreenCanvas(
            Math.max(1, Math.round(bitmap.width * percent)),
            Math.max(1, Math.round(bitmap.height * percent)));

        console.info(canvas.width + "x" + canvas.height)

        // Scale and draw the source image to the canvas
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        // Convert the canvas to a data URL in PNG format
        return canvas.convertToBlob({type: "image/png"});
    }).then(blobToDataUrl);
}

function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () {
            resolve(String(reader.result));
        };
        reader.onerror = function () {
            reject(reader.error);
        };
        reader.readAsDataURL(blob);
    });
}
