/*
 * Copyright (c) 2019 Intra LLC
 * MIT LICENSE
 *
 * IntraHouse plugin barebone
 */

const util = require("util");

const baseagent = require("./agent/base");

const mainapi = require("./api/mainapi");

const MAX_TRANSACTIONS = 2048;

module.exports = Plugin;

/**
 * Plugin constructor
 *
 * @param {Object} params - optional
 */
function Plugin(params, agent) {
  if (!agent) agent = baseagent;  
  if (!(this instanceof Plugin)) return new Plugin(params, agent);

  this.loglevel = 1;
  this.debug = 0;
  this.subs = {};
  this.lastId = 0;

  this.agent = agent(params);

  // Добавляем api прикладного уровня
  mainapi(this);

  // Обработка сообщений, которые инициализированы сервером
  const that = this;

  this.agent.on("command", message => {
    // Выполнить
    that.sendResponse(message, 1);
  });

  this.agent.on("action", message => {
    // Выполнить
    that.sendResponse(message, 1);
  });

  this.agent.on("service", message => {
    // Выполнить
    that.sendResponse(message, 1);
  });

  this.agent.on("sub", message => {
    // Пришли данные по подписке
    that.processSubResponse(message);
  });

  this.agent.on("debug", message => {
    this.setDebug(message.mode);
    that.sendResponse(message, 1);
  });

  // Обработка ошибок агента
  this.agent.on("error", message => {
    that.exit(message, 1);
  });
}
util.inherits(Plugin, require("events").EventEmitter);


Plugin.prototype.setDebug = function(mode) {
  this.debug = mode == "on" ? 1 : 0;
};

// loglevel=0 - Low (только старт-стоп и ошибки), 1 - middle, 2 - hight (все сообщ)
Plugin.prototype.log = function(txt, level) {
  if (!txt || this.loglevel < level) return;
  const type = this.debug ? "debug" : "log";
  this.agent.send({ type, txt });
};

Plugin.prototype.sendRequest = function(type, data) {
  const id = getNextId(this.lastId);
  this.lastId = id;
  const agent = this.agent;
  const sobj = util.isArray(data)
    ? { id, type, data }
    : Object.assign({ id, type }, data);

  agent.send(sobj);
  console.log("PLUGIN sendRequest id=" + id+" type "+type + util.inspect(data), 2);
  return new Promise(resolve => {
    agent.on(type, message => {
      if (message.id == id) resolve(message.data || []);
    });
  });
};

//Отправляет данные каналов, ответа не ждет
Plugin.prototype.sendData = function(data) {
  this.agent.send({ type: "data", data });
  this.log("Send  data " + util.inspect(data), 2);
};

Plugin.prototype.subscribe = function(event, filter, cb) {
  this.lastId = getNextId(this.lastId);
  const id = this.lastId; 
  this.agent.send({ id, type: "sub", event, filter });
  if (cb) this.subs[id] = { cb };
};

Plugin.prototype.sendResponse = function(message, response) {
    this.agent.send(Object.assign({ response }, message));
};

Plugin.prototype.processSubResponse = function(message) {
  const id = message.id;
  try {
    if (!id) throw "Expected id!";

    if (!this.subs[id]) throw "Not found subs!";
    this.subs[id].cb(message.data);
  } catch (e) {
    this.log(e.message + " " + util.inspect(message));
  }
};

Plugin.prototype.exit = function(errcode = 0, txt = "") {
  if (txt) this.log(txt);

  setTimeout(() => {
    // Это событие можно перехватить в process.on('exit')
    process.exit(errcode);
  }, 300);
};

/**
 * API базового уровня. Используется API на прикладном уровне
 *  get
 *  set
 *  onChange
 *  onAdd
 *  onDelete
 *  onUpdate
 */
Plugin.prototype.get = function(name, filter) {
  return this.sendRequest("get", { name, filter });
};

Plugin.prototype.onChange = function(name, filter, cb) {  
    if (typeof filter == 'function') {
       cb = filter;
        filter = '';
     } 
  this.subscribe("tableupdated", { tablename: name, filter}, cb);
};

Plugin.prototype.onAdd = function(name, filter, cb) {  
    if (typeof filter == 'function') {
        cb = filter;
         filter = '';
    }  
    this.subscribe("tableupdated", { tablename: name, op:'add', filter}, cb);
};

Plugin.prototype.onDelete = function(name, filter, cb) {  
    if (typeof filter == 'function') {
        cb = filter;
         filter = '';
    }  
    this.subscribe("tableupdated", { tablename: name, op:'delete', filter}, cb);
};

Plugin.prototype.oUpdate = function(name, filter, cb) {  
    if (typeof filter == 'function') {
        cb = filter;
        filter = '';
    }  
    this.subscribe("tableupdated", { tablename: name, op:'update', filter}, cb);
};

// ////////////////////////////
/*
function getAgent(params) {
  const agentType = params.agent;
  delete params.agent;

  switch (agentType) {
    case "base":
    default:
      return baseagent(params);
  }
}
*/


function getNextId(id) {
  return (id + 1) % MAX_TRANSACTIONS;
}
