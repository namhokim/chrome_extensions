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
                    sessionId.value = jsessionIdObj[0].value;
                } else {
                    sessionId.value = "Maybe not SuccessFactor.";
                }
            }
        } catch {
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() { // 요청에 대한 콜백함수
        if(xhr.readyState === xhr.DONE) { // 요청이 완료되면 실행
            if(xhr.status === 200 || xhr.status === 201) { // 응답 코드가 200 혹은 201
                const regex = /var ajaxSecKey="(.*)";var/g;
                let result = regex.exec(xhr.responseText);
                ajaxKey.value = result[1];
            } else {
                consol.error(xhr.reponseText);
            }
        }
    };
    xhr.open('GET', 'https://hcm44.sapsf.com/sf/start/'); // http 메서드와 URL설정
    xhr.send(); // 요청 전송
})();