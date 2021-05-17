const input = document.getElementById("input");

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            let domain = url.hostname;

            const cookies = await chrome.cookies.getAll({domain});

            if (cookies.length === 0) {
                input.value = "Maybe not SuccessFactor..";
            } else {
                let jsessionIdObj = cookies.filter(obj => obj.name === 'JSESSIONID');
                if (jsessionIdObj !== undefined) {
                    input.value = jsessionIdObj[0].value;
                } else {
                    input.value = "Maybe not SuccessFactor.";
                }
            }
        } catch {
        }
    }
})();