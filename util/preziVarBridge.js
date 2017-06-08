console.info("Prezi Variable Bridge active");
console.log(window);
console.log(window.preziPlayerJS)

var script = document.createElement("script");
script.setAttribute("type", "text/plain");
script.setAttribute("id", "rs-prezi-var-bridge");
script.setAttribute("data-ready", "false");
document.body.appendChild(script);

var prevIndex = 0;
var prevSize = 0;
var prevActionIndex = 0;
var prevActionSize = 0;

setInterval(function () {
    if (window.preziPlayerJS && window.preziPlayerJS.playerUI && window.preziPlayerJS.playerUI.playback) {
        var index = window.preziPlayerJS.playerUI.playback.getCurrentStepIndex();
        var size = window.preziPlayerJS.playerUI.playback.getStepCount();
        var actionIndex = window.preziPlayerJS.playerUI.playback.getCurrentActionIndex(index);
        var actionSize = window.preziPlayerJS.playerUI.playback.getCurrentActionCount(index);
        if (index == prevIndex && size == prevSize && actionIndex == prevActionIndex && actionSize == prevActionSize)return;
        script.setAttribute("data-ready", "true");
        var obj = {
            index: prevIndex = index,
            size: prevSize = size,
            actionIndex: prevActionIndex = actionIndex,
            actionSize: prevActionSize = actionSize
        };
        script.innerHTML = JSON.stringify(obj);
        script.dispatchEvent(new Event("change"));
    }
}, 1000);