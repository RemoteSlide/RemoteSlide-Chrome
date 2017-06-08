var app = angular.module("app", []);

app.controller("mainCtrl", function ($scope, $timeout) {
    $scope.controlActive = false;
    $scope.controlSite = undefined;
    $scope.session = {
        session: "",
        qr: "",
        bookmarkContent: "",
        refresh: function () {
            chrome.storage.local.get(["session"], function (items) {
                console.log(items)
                $timeout(function () {
                    if (items.session && items.session.sessionTime && (new Date().valueOf() - items.session.sessionTime < 3.6e+6)) {
                        $.extend($scope.session, items.session);
                    } else {
                        // session already expired
                        chrome.tabs.create({url: "https://remote-sli.de"});
                    }
                })
            });

            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "stateRequest"});
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
            // $("body").append("<script src='https://remote-sli.de/res/host-bookmark.js'></script>")
            // chrome.tabs.executeScript(null, {file: "lib/jquery.min.js"});
            // chrome.tabs.executeScript(null, {file: "lib/socket.io.js"});
            // $.get("https://remote-sli.de/res/host-bookmark.js", function (data) {
            //     chrome.tabs.executeScript(null, {code: data})
            // });

            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.executeScript(tab.id, {
                    file: "lib/jquery.min.js"
                });
                chrome.tabs.executeScript(tab.id, {
                    file: "lib/socket.io.js"
                });
                chrome.tabs.executeScript(tab.id, {
                    file: "lib/attrchange.js"
                })

                chrome.tabs.executeScript(tab.id, {
                    code: "remote_slide = " + JSON.stringify({
                        session: $scope.session.session,
                        injector: 'extension_chrome'
                    })
                });
                chrome.tabs.executeScript(tab.id, {
                    file: "inject/controller/pageController.js"
                });
                chrome.tabs.sendMessage(tab.id, {action: "inject_controller"}, function (response) {
                });

                chrome.storage.local.set({"controlledTab": tab.id}, function () {
                });
            });

        },
        reloadTab: function () {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.reload(tab.id);
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

    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
        console.log(msg)
        if (msg.action == 'controlUpdate') {
            $timeout(function () {
                $scope.controlActive = msg.active;
                $scope.controlSite = msg.site;

                chrome.storage.local.get(["controlledTab"], function (items) {
                    console.log(items)
                    if (items.controlledTab) {
                        if (msg.active) {
                            chrome.browserAction.setBadgeBackgroundColor({color: "#25bb25", tabId: items.controlledTab.id})
                        } else {
                            chrome.browserAction.setBadgeBackgroundColor({color: "blue", tabId: items.controlledTab.id})
                            chrome.browserAction.setBadgeText({text: "", tabId: items.controlledTab.id})
                        }
                    }
                });
            })
        }
    });

});

