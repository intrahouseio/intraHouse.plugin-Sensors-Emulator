/*
 * Copyright (c) 2019 Intra LLC
 * MIT LICENSE
 *
 * Агент локального плагина
 */

const util = require("util");

module.exports = Agent;

/**
 * Constructor
 * @param {Object} params - optional
 */
function Agent(params) {
  if (!(this instanceof Agent)) return new Agent(params);

  if (typeof params == "object") {
    this.params = params;
  } else this.params = {};

  let that = this;

  process.on("message", message => {
    that.parseMessage(message);
  });

  process.on("uncaughtException", err => {
    that.emit("error", "ERR: uncaughtException " + util.inspect(err));
  });

  process.on("unhandledRejection", (reason, promise) => {
    const txt =
      "Reason " + util.inspect(reason) + ". Promise " + util.inspect(promise);
    that.emit("error", "ERR: unhandledRejection! " + txt);
  });
}
util.inherits(Agent, require("events").EventEmitter);

Agent.prototype.send = function(message) {
    console.log('!!!AGENT send '+util.inspect(message))  
  process.send(message);
};

/**
 *
 * @param {Object} message
 */
Agent.prototype.parseMessage = function(message) {
    console.log('AGENT GET from server '+util.inspect(message))  
  if (typeof message != "object") return;

  switch (message.type) {
    case "get":
    case "sub":
    case "command":
    case "debug":
      this.emit(message.type, message);
      break;

    default:
      this.emit("error", "Unknown message type: " + message.type);
  }
};
