const message = document.getElementById("message");

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.scripting.executeScript(
            {
                target: {tabId: tabs[0].id},
                function: requestRemoteWorkContentScript,
            },
            (injectionResults) => {
                try {
                    for (const frameResult of injectionResults) {
                        const {frameId, result} = frameResult;
                        setMessage(result);
                    }
                } catch(e) {
                    setMessage("Not applicable");
                }
            });
    });
})();


function requestRemoteWorkContentScript() {
    let modalContent = document.getElementById('modal-content');
    if (modalContent === null) {
        return "No Target"
    }

    let widthLimitation = modalContent.parentElement;
    if (widthLimitation.clientWidth === 1280) {
        widthLimitation.style.maxWidth='unset';
        return "Widen Out"
    } else {
        widthLimitation.style.maxWidth='1280px';
        return "Restored"
    }

}

function setMessage(str) {
    message.textContent = str;
    message.hidden = false;
}
