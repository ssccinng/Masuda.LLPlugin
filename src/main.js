// 运行在 Electron 主进程 下的插件入口
const { ipcMain, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { HttpProxyAgent } = require("http-proxy-agent");

const WebSocket = require('ws');


// 加载插件时触发
function onLoad(plugin) {
  const wss = new WebSocket.Server({ port: 8080 });
  wss.on('connection', ws => {
    ws.on('message', message => {

      BrowserWindow.getAllWindows().forEach((window) => {

        window.webContents.send('client-sendData', message.toLocaleString());
      });

    });

  });

  let endFlag = "[end]";

  ipcMain.handle(
    "LiteLoader.masuda.sendData",
    (event, defaultText) => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(defaultText + endFlag);
        }
      });
    }
  );




  function getFullUrl(url, base) {
    return url.includes("://") ? url : base + url;
  }

  function tryDataPath(d) {
    let p = d ? path.join(plugin.path.data, d) : plugin.path.data;
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  }

  function readDataFile(file, defaultText = "") {
    tryDataPath();
    let p = path.join(plugin.path.data, file);
    if (!fs.existsSync(p))
      fs.writeFileSync(p, String(defaultText || ""), "utf-8");
    let data = fs.readFileSync(p, "utf-8");
    data = data.replace(/\r\n/g, "\n").trim();
    return data;
  }
  function writeDataFile(file, text) {
    tryDataPath();
    let p = path.join(plugin.path.data, file);
    fs.writeFileSync(p, String(text), "utf-8");
  }

  function getConfig() {
    let configText = readDataFile("config.json", "{}");
    let pluginConfig = JSON.parse(configText);
    pluginConfig.monitors.forEach((item) => {
      if (item.configKey)
        Object.assign(item, pluginConfig.configDic[item.configKey]);
    });
    return pluginConfig;
  }

  function writeLog(log) {
    console.log(log);
    tryDataPath();
    let logPath = path.join(plugin.path.data, "log.txt");
    if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "", "utf-8");
    fs.appendFileSync(
      logPath,
      `\n[${moment().format("YYYY-MM-DD HH:mm:ss")}] ${log}\n`,
      "utf-8"
    );
  }

  function createAxiosConfig(config) {
    return {
      ...createProxyAgent(config.proxy),
      headers: config.headers,
      timeout: config.timeout ?? 30000,
    };
  }

  function createProxyAgent(proxy) {
    if (!proxy) return {};
    return {
      proxy: false,
      httpAgent: proxy.http?.match(/socks5:\/\//)
        ? new SocksProxyAgent(proxy.http)
        : proxy.http?.match(/https:\/\//)
          ? new HttpsProxyAgent(proxy.http)
          : proxy.http?.match(/http:\/\//)
            ? new HttpProxyAgent(proxy.http)
            : undefined,
      httpsAgent: proxy.https?.match(/socks5:\/\//)
        ? new SocksProxyAgent(proxy.https)
        : proxy.https?.match(/https:\/\//)
          ? new HttpsProxyAgent(proxy.https)
          : proxy.https?.match(/http:\/\//)
            ? new HttpProxyAgent(proxy.https)
            : undefined,
    };
  }

  async function downloadFileSync(url, proxy) {
    tryDataPath("downloads");
    try {
      let res = await axios.get(url, {
        responseType: "arraybuffer",
        ...createProxyAgent(proxy),
      });
      let fileName = "";
      if (url.match(/([^\/\\\?]+)(\?.+)?$/))
        fileName = url.match(/([^\/\\\?]+)(\?.+)?$/)[1];
      fileName = `${moment().format("YYYYMMDDHHmmssSS")}_${fileName}`;
      if (!fileName.includes(".")) fileName += ".jpg";
      let filePath = path.join(plugin.path.data, "downloads", fileName);
      fs.writeFileSync(filePath, res.data, "binary");
      return { fileName, filePath };
    } catch (error) {
      writeLog(`downloadFileSync error: ${error.message}`);
    }
  }
}


// 创建窗口时触发
function onBrowserWindowCreated(window, plugin) {

}


// 这两个函数都是可选的
module.exports = {
  onLoad,
  onBrowserWindowCreated
}