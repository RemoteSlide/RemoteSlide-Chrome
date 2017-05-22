var app = angular.module("app", []);

app.controller("mainCtrl", function ($scope, $timeout, $http) {
    $scope.session = {
        session: "",
        qr: "",
        bookmarkContent: "",
        initialized: false,
        refresh: function () {
            chrome.storage.local.get(["session"], function (items) {
                console.log(items)
                $timeout(function () {
                    if (items.session && items.session.sessionTime && (new Date().valueOf() - items.session.sessionTime < 3.6e+6)) {
                        $scope.session.session = items.session.session;
                        $scope.session.qr = items.session.qr;
                    } else {
                        // session already expired
                        chrome.tabs.create({url: "https://remote-sli.de"});
                    }
                })
            });
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "state_request"}, function (response) {
                });
            });
        },
        injectBookmarkScript: function () {
            // $("body").append("<script src='https://remote-sli.de/res/host-bookmark.js'></script>")
            // chrome.tabs.executeScript(null, {file: "lib/jquery.min.js"});
            // chrome.tabs.executeScript(null, {file: "lib/socket.io.js"});
            // $.get("https://remote-sli.de/res/host-bookmark.js", function (data) {
            //     chrome.tabs.executeScript(null, {code: data})
            // });

            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.executeScript(tabs[0].id, {
                    file: "lib/jquery.min.js"
                });
                chrome.tabs.executeScript(tabs[0].id, {
                    file: "lib/socket.io.js"
                });

                chrome.tabs.executeScript(tabs[0].id, {
                    code: "remote_slide = { session: '" + $scope.session.session + "' }"
                });
                chrome.tabs.executeScript(tabs[0].id, {
                    file: "inject/res/pageController.js"
                });
                chrome.tabs.sendMessage(tabs[0].id, {action: "inject_controller"}, function (response) {
                });
            });
        }
    }

    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.action == 'session_initialized') {
            $timeout(function () {
                $scope.session.initialized = true;
            })
        }
    });

});

