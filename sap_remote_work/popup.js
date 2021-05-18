const sessionId = document.getElementById("sessionId");
const ajaxKey = document.getElementById("ajaxKey");

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            let domain = url.hostname;

            const cookies = await chrome.cookies.getAll({domain});

            if (cookies.length === 0) {
                sessionId.value = "Maybe not SuccessFactor..";
            } else {
                let jsessionIdObj = cookies.filter(obj => obj.name === 'JSESSIONID');
                if (jsessionIdObj !== undefined) {
                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === xhr.DONE) {
                            if (xhr.status === 200) {
                                const regex = /var ajaxSecKey="(.*)";var/g;
                                let result = regex.exec(xhr.responseText);

                                sessionId.value = jsessionIdObj[0].value;
                                ajaxKey.value = result[1];
                            } else {
                                consol.error(xhr.reponseText);
                            }
                        }
                    };
                    xhr.open('GET', 'https://hcm44.sapsf.com/sf/start/');
                    xhr.send();


                } else {
                    sessionId.value = "Maybe not SuccessFactor.";
                }
            }
        } catch {
        }
    }


})();