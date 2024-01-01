// 运行在 Electron 渲染进程 下的页面脚本


// 页面加载完成时触发
function onLoad() {
    let waitForLogin = setInterval(() => {
        if (window.location?.href?.includes("#/main/message")) {
            clearInterval(waitForLogin);
            initMonitor();
        }
    }, 3000);
}


// 打开设置界面时触发
function onConfigView(view) {

}


// 这两个函数都是可选的
export {
    onLoad,
    onConfigView
}

async function initMonitor() {
    window.testPromise = (p) =>
        p.then((res) => console.log(res)).catch((res) => console.error(res));

    let accountInfo = await LLAPI.getAccountInfo();

    masuda.onClientSendData((event, data) => {
        let message = JSON.parse(data);

        // return;
        switch (message.t) {
            case "SendGroupMessage":
                LLAPI.sendMessage(
                    { "uid": message.d.target, "guildId": "", "chatType": "group" }, message.d.content);
                break;
            case "SendFriendMessage":
                    LLAPI.sendMessage(
                        { "uid": message.d.target, "guildId": "", "chatType": "friend" }, message.d.content);
                    break;
            case "ReplyGroupMessage":
                break;
            case "ForwardMessage":
                LLAPI.sendMessage(
                    { "uid": message.d.source, "guildId": "", "chatType": message.d.sourceType }, 
                    { "uid": message.d.target, "guildId": "", "chatType": message.d.targetType }, 
                    message.d.content);
            
            case "GetUserInfo":
                masuda.sendData("test")
                LLAPI.getUserInfo(message.d.uid).then((res) => {
                    masuda.sendData(JSON.stringify(
                        {
                            t: "GetUserInfo",
                            d: res
                        }
                    ))
                })
                break;
            case "GetAccountInfo":
                LLAPI.getAccountInfo().then((res) => {
                    masuda.sendData(JSON.stringify(
                        {
                            t: "GetAccountInfo",
                            d: res
                        }
                    ))
                })
                break;
            case "GetFriendsList":
                LLAPI.getFriendsList(message.d.forced).then((res) => {
                    masuda.sendData(JSON.stringify(
                        {
                            t: "GetFriendsList",
                            d: res
                        }
                    ))
                })
                break;
            case "GetGroupList":
                LLAPI.getGroupsList(message.d.forced).then((res) => {
                    masuda.sendData(JSON.stringify(
                        {
                            t: "GetGroupList",
                            d: res
                        }
                    ))
                })
                break;
            case "GetPreviousMessage":
                LLAPI.getPreviousMessage(message.d.peer, message.d.count, message.d.msgId).then((res) => {
                    masuda.sendData(JSON.stringify(
                        {
                            t: "GetPreviousMessage",
                            d: res
                        }
                    ))
                })
                break;
            case "GetPeer":
                LLAPI.getPeer().then((res) => {
                    masuda.sendData(JSON.stringify(
                        {
                            t: "GetPeer",
                            d: res
                        }
                    ))
                })
                break;
                

        }
    });

    LLAPI.on("new-messages", (messages) => {
        try {
            messages.forEach((message) => {
                if (message.sender.uid != accountInfo.uid || false) {
                    masuda.sendData(JSON.stringify(
                        {
                            t: "Message",
                            d: {
                                sender: message.sender,
                                peer: message.peer,
                                msgId: message.raw.msgId,
                                msgSeq: message.raw.msgSeq,
                                msgTime: message.raw.msgTime,
                                content: message .elements?.map((element) => {
                                    let e = { ...element };
                                    // delete e.raw
                                    return e;
                                }),
                            }
                        }

                    ))
                }
            });
        } catch (error) {
            // masuda.writeLog(`new messages error: ${error.message}}`);
        }
    });
}  