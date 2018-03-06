/**
 * emuls.js
 */
const util = require("util");

const logger = require("./lib/logger");
const plugin = require("./lib/plugin");

let step = 0;
plugin.unitId = process.argv[2];

logger.log("Plugin " + plugin.unitId + " has started.", "connect");
next();

function next() {
  switch (step) {
    case 0:
      // Запрос на получение параметров
      getTable("params");
      step = 1;
      break;
    case 1:
      // Запрос на получение каналов
      getTable("config");
      step = 2;
      break;
    case 2:
      // Запуск Основного цикла опроса - 100 мс
      setInterval(runOutReq, 100);
      step = 3;
      break;
    default:
  }
}

function getTable(name) {
  process.send({ type: "get", tablename: name + "/" + plugin.unitId });
}

function runOutReq() {
  let item = plugin.getNextReq();
  if (item) {
    plugin.genAndSendNext(item);
  }
}

/******************************** Входящие от IH ****************************************************/
process.on("message", function(message) {
  if (!message) return;
  if (typeof message == "string") {
    if (message == "SIGTERM") {
      agent.stop();
      process.exit();
    }
  }
  if (typeof message == "object" && message.type) {
    parseMessageFromServer(message);
  }
});

function parseMessageFromServer(message) {
  switch (message.type) {
    case "get":
      if (message.params) {
        plugin.setParams(message.params);
        if (message.params.debug) logger.setDebug(message.params.debug);
        next();
      }
      if (message.config) {
        logger.log('config '+JSON.stringify(message.config));
        plugin.setConfig(message.config);
        
        logger.log('this.reqarr '+JSON.stringify(plugin.reqarr));

        next();
      }
      break;

    case "debug":
      if (message.mode) logger.setDebug(message.mode);
      break;

    default:
  }
}

process.on("uncaughtException", function(err) {
  var text = "ERR (uncaughtException): " + util.inspect(err);
  logger.log(text);
});
