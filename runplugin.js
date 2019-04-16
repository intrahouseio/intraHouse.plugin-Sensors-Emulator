const child = require("child_process");

let ps = child.fork("./emuls.js");

ps.on("message", mes => {
  console.log("Message: " + JSON.stringify(mes));
  if (mes.type == "get") {
    if (mes.tablename == "params") ps.send({ type: "get", params: {} });
    if (mes.tablename == "config") ps.send({ type: "get", config: [{id:"DI1", "desc":"DI", "period":1}] });
  }
});

ps.on("close", code => {
  console.log("PLUGIN CLOSED. code=" + code);
});
