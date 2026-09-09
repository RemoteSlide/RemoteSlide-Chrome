var app = angular.module("app", []);

// chrome.tabs.getSelected is gone in MV3; the popup always belongs to the current window.
function withActiveTab(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs && tabs.length > 0) {
            callback(tabs[0]);
        }
    });
}

app.controller("mainCtrl", function ($scope, $timeout) {
    $scope.controlActive = false;
    $scope.controlSite = undefined;
    $scope.session = {
        loading: true,
        session: "",
        qr: "",
        bookmarkContent: "",
        refresh: function () {
            chrome.storage.local.get(["session"], function (items) {
                console.log(items)
                $timeout(function () {
                    if (items.session && items.session.sessionTime && (new Date().valueOf() - items.session.sessionTime < 3.6e+6)) {
                        $.extend($scope.session, items.session);
                        $scope.session.loading = false;
                    } else {
                        // session already expired
                        $scope.session.loading = true;
                        chrome.tabs.create({url: "https://remote-sli.de?sessionOnly", active: false});
                        $timeout(function () {
                            window.close();
                        }, 1500);
                    }
                })
            });

            withActiveTab(function (tab) {
                chrome.tabs.sendMessage(tab.id, {action: "stateRequest"}, function () {
                    // No controller on this tab yet - nothing to report
                    void chrome.runtime.lastError;
                });
            });

            console.info($scope.session)
        },
        toggleControl: function () {
            if ($scope.controlActive) {
                $scope.session.reloadTab();
            } else {
                $scope.session.injectBookmarkScript();
            }
        },
        injectBookmarkScript: function () {
            withActiveTab(function (tab) {
                var target = {tabId: tab.id};

                chrome.scripting.executeScript({
                    target: target,
                    files: [
                        "util/mv3-compat.js",
                        "lib/jquery.min.js",
                        "lib/socket.io.js",
                        "lib/attrchange.js"
                    ]
                }).then(function () {
                    // MV3 has no executeScript({code}), so hand the session over as an argument
                    return chrome.scripting.executeScript({
                        target: target,
                        func: function (remoteSlide) {
                            window.remote_slide = remoteSlide;
                        },
                        args: [{
                            session: $scope.session.session,
                            injector: 'extension_chrome'
                        }]
                    });
                }).then(function () {
                    return chrome.scripting.executeScript({
                        target: target,
                        files: ["inject/controller/pageController.js"]
                    });
                }).then(function () {
                    chrome.tabs.sendMessage(tab.id, {action: "inject_controller"}, function (response) {
                        void chrome.runtime.lastError;
                    });
                }).catch(function (err) {
                    console.error("Failed to inject the page controller: " + err);
                });

                chrome.storage.local.set({"controlledTab": tab.id}, function () {
                });
                chrome.storage.local.set({"controlledWindow": tab.windowId}, function () {
                });
            });

        },
        reloadTab: function () {
            withActiveTab(function (tab) {
                chrome.tabs.reload(tab.id);
                $timeout(function () {
                    window.close();
                }, 1500);
            });
        }
    }
    chrome.storage.onChanged.addListener(function (changes, area) {
        if (area == 'local') {
            console.log("changes: " + JSON.stringify(changes))
            if (changes.session) {
                if (changes.session.newValue) {
                    $.extend($scope.session, changes.session.newValue);
                } else {
                    $scope.session.session = "";
                }
            }
        }
    })

    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        console.log(msg)
        if (msg.action == 'controlUpdate') {
            $timeout(function () {
                $scope.controlActive = msg.active;
                $scope.controlSite = msg.site;

                console.log(msg.site)
                if ("Google Slides" === msg.site) {
                    // Workaround to fix Google Slide controls
                    withActiveTab(function (tab) {
                        console.log(tab)

                        var editUrlRegex = /https:\/\/docs\.google\.com\/presentation\/d\/(.+)\/edit(.*)/;
                        if (editUrlRegex.test(tab.url)) {
                            console.info("Detected Google Slides edit page. Redirecting to presentation page...");
                            var match = tab.url.match(editUrlRegex)
                            chrome.tabs.update(tab.id, {url: "https://docs.google.com/presentation/d/" + match[1] + "/present"});
                        }
                    });
                }

                chrome.storage.local.get(["controlledTab"], function (items) {
                    console.log(items)
                    if (typeof items.controlledTab === 'number') {
                        if (msg.active) {
                            chrome.action.setBadgeBackgroundColor({color: "#25bb25", tabId: items.controlledTab})
                        } else {
                            chrome.action.setBadgeBackgroundColor({color: "blue", tabId: items.controlledTab})
                            chrome.action.setBadgeText({text: "", tabId: items.controlledTab})
                        }
                    }
                });
            })
        }
    });

});
