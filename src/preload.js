// Electron 主进程 与 渲染进程 交互的桥梁
const { contextBridge, ipcRenderer } = require("electron");

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld("masuda", {
    sendData: (defaultText) =>
        ipcRenderer.invoke(
            "LiteLoader.masuda.sendData",
            defaultText
        ),
    onClientSendData: (callback) => ipcRenderer.on('client-sendData', callback)
})