const sessionId = document.getElementById("sessionId");
const ajaxKey = document.getElementById("ajaxKey");
const go = document.getElementById("go");
const dateStart = document.getElementById("dateStart");
const message = document.getElementById("message");
const controlRow = document.getElementById("control-row");

var sid = '';
var akey = '';

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            let domain = url.hostname;

            const cookies = await chrome.cookies.getAll({domain});

            if (cookies.length === 0) {
                message.textContent = "Maybe not SuccessFactor..";
            } else {
                let jsessionIdObj = cookies.filter(obj => obj.name === 'JSESSIONID');
                if (jsessionIdObj !== undefined) {
                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === xhr.DONE) {
                            if (xhr.status === 200) {
                                const regex = /var ajaxSecKey="(.*)";var/g;
                                let result = regex.exec(xhr.responseText);

                                sid = jsessionIdObj[0].value;
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
                    message.textContent = "Maybe not SuccessFactor.";
                }
            }
        } catch {
            message.textContent = "Maybe error.";
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
        type: 'RemoteWork2-1',
        sessionId: sid,
        ajaxKey: akey
    };

    requestRemoteWork(param, function (response) {
        setMessage(response);
    });
}

function requestRemoteWork(param, callback) {

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === xhr.DONE) {
            callback(xhr.reponseText);
        }
    };

    // xhr.open('POST', 'https://hcm44.sapsf.com/xi/ajax/remoting/call/plaincall/tlmTime0ffControllerProxy.createAbsence.dwr');
    xhr.open('POST', 'http://localhost/');

    xhr.setRequestHeader('Cookie', `JSESSIONID=;${param.sessionId}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('x-ajax-token', param.ajaxKey);

    let data = `
callCount=1
page=/xi/ui/ect/pages/absence/timeOff.xhtml?_s.crb=SBCR3KQDbJx6WJsM5NEv3B7mlUdWI8tWZk9exA2NHO0%3d
httpSessionId=
scriptSessionId=80A8BD291A8E635A37D57F13E5D1F423568
c0-scriptName=tlmTimeOffControllerProxy
c0-methodName=createAbsence
c0-id=0
c0-e1=string:10218
c0-e2=string:RemoteWork2-1
c0-e3=string:${param.date.start}
c0-e4=string:${param.date.end}
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

    setMessage(data);
    xhr.send(data);
}

function setMessage(str) {
    message.textContent = str;
    message.hidden = false;
}

function clearMessage() {
    message.hidden = true;
    message.textContent = "";
}
