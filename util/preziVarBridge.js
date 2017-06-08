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

setInterval(function () {
    if (window.preziPlayerJS && window.preziPlayerJS.playerUI && window.preziPlayerJS.playerUI.playback) {
        var index = window.preziPlayerJS.playerUI.playback.getCurrentStepIndex();
        var size = window.preziPlayerJS.playerUI.playback.getStepCount();
        if (index == prevIndex && size == prevSize)return;
        script.setAttribute("data-ready", "true");
        var obj = {
            index: prevIndex = index,
            size: prevSize = size
        };
        script.innerHTML = JSON.stringify(obj);
        script.dispatchEvent(new Event("change"));
    }
}, 1000);