const sessionId = document.getElementById("sessionId");
const ajaxKey = document.getElementById("ajaxKey");
// action
const go = document.getElementById("go");
// input
const remoteType = document.getElementById("remoteType");
const dateStart = document.getElementById("dateStart");
// output
const message = document.getElementById("message");
const controlRow = document.getElementById("control-row");

var akey = '';

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
    initDatePicker();

    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (tab?.url) {
        let url = new URL(tab.url);
        let domain = url.hostname;

        if (!domain.startsWith('hcm44.sapsf.com') || !url.pathname.toLowerCase().includes('timeoff')) {
            createNewTabForRemoteWork();
            return;
        }

        const cookies = await chrome.cookies.getAll({domain});
        if (cookies.length === 0) {
            createNewTabForRemoteWork();
        } else {
            let jsessionIdObj = cookies.filter(obj => obj.name === 'JSESSIONID');
            if (jsessionIdObj !== undefined && jsessionIdObj.length > 0) {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === xhr.DONE) {
                        if (xhr.status === 200) {
                            const regex = /var ajaxSecKey="(.*)";var/g;
                            let result = regex.exec(xhr.responseText);
                            akey = result[1];

                            setMessage("Ready for work!");
                            controlRow.hidden = false;
                        } else {
                            consol.error(xhr.reponseText);
                        }
                    }
                };
                xhr.open('GET', 'https://hcm44.sapsf.com/sf/start/');
                xhr.send();
            } else {
                createNewTabForRemoteWork();
            }
        }
    }
})();

go.addEventListener("click", handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault();

    clearMessage();

    let param = {
        date: {
            start: dateStart.value,
            end: dateStart.value
        },
        type: remoteType.value,
        ajaxKey: akey
    };

    requestRemoteWork(param, function (response) {
        setMessage(response);
    });
}

function initDatePicker() {
    dateStart.value = getToday();
}

function getToday(){
    var date = new Date();
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + "-" + month + "-" + day;
}


function requestRemoteWorkContentScript() {
    let userId = document.getElementById("paramsUserIdField").value;

    chrome.storage.local.get(['ajaxKey', 'startDate', 'endDate', 'remoteType'], function (result) {

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === xhr.DONE ) {
                let response = xhr.responseText;
                if (response.indexOf('success') === -1) {
                    console.log(response);
                    let msg = response.match(/"failure";\W+s\d\[0\]="(.+)\\n"/)[1];

                    const regexUnicode = /\\u([\d\w]{4})/gi;
                    let unicodeString = msg.replace(regexUnicode, function (match, grp) {
                        return String.fromCharCode(parseInt(grp, 16));
                    });
                    alert(unescape(unicodeString));
                } else {
                    alert('성공!');
                }
            }
        };

        xhr.open('POST', 'https://hcm44.sapsf.com/xi/ajax/remoting/call/plaincall/tlmTime0ffControllerProxy.createAbsence.dwr');
        xhr.setRequestHeader('x-ajax-token', result['ajaxKey']);

        let data = `
callCount=1
page=/xi/ui/ect/pages/absence/timeOff.xhtml?_s.crb=SBCR3KQDbJx6WJsM5NEv3B7mlUdWI8tWZk9exA2NHO0%3d
httpSessionId=
scriptSessionId=80A8BD291A8E635A37D57F13E5D1F423568
c0-scriptName=tlmTimeOffControllerProxy
c0-methodName=createAbsence
c0-id=0
c0-e1=string:${userId}
c0-e2=string:${result['remoteType']}
c0-e3=string:${result['startDate']}
c0-e4=string:${result['endDate']}
c0-e5=null:null
c0-e6=null:null
c0-e7=string:
c0-e10=string:cust_Attachment
c0-e11=string:
c0-e9=Object_Object:{id:reference:c0-e10, value:reference:c0-e11}
c0-e13=string:cust_Attachment2
c0-e14=string:
c0-e12=Object_Object:{id:reference:c0-e13, value:reference:c0-e14}
c0-e8=Array:[reference:c0-e9,reference:c0-e12]
c0-e15=null:null
c0-e16=boolean:false
c0-e17=null:null
c0-e18=null:null
c0-e19=null:null
c0-e20=null:null
c0-e21=string:ESS
c0-e22=null:null
c0-e23=boolean:false
c0-param0=Object_Object:{userId:reference:c0-e1, timeTypeCode:reference:c0-e2, startDate:reference:c0-e3, endDate:reference:c0-e4, startTime:reference:c0-e5, endTime:reference:c0-e6, comment:reference:c0-e7, customFieldValues:reference:c0-e8, fraction:reference:c0-e15, undeterminedEndDate:reference:c0-e16, externalCode:reference:c0-e17, expReturn:reference:c0-e18, actReturn:reference:c0-e19, countryExtension:reference:c0-e20, transactionType:reference:c0-e21, linkAbsenceBean:reference:c0-e22, essLegacyMode:reference:c0-e23}
batchId=154`;
        xhr.send(data);
    });
}

function requestRemoteWork(param, callback) {

    chrome.storage.local.set({
        ajaxKey: param.ajaxKey,
        startDate: param.date.start,
        endDate: param.date.end,
        remoteType: param.type
    }, function () {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.scripting.executeScript(
                {
                    target: {tabId: tabs[0].id},
                    function: requestRemoteWorkContentScript,
                },
                (injectionResults) => {
                    callback('Triggered!');
                });
        });
    });
}

function setMessage(str) {
    message.textContent = str;
    message.hidden = false;
}

function clearMessage() {
    message.hidden = true;
    message.textContent = "";
}


function createNewTabForRemoteWork() {
    chrome.tabs.create({
        url: 'https://hcm44.sapsf.com/sf/timeoff'
    });
}
