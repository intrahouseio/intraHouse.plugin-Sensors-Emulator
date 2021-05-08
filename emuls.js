/**
 * emuls.js
 */
const util = require("util");
// const fs = require("fs");

const plugin = require("ih-plugin-api")(); 
const myapp = require("./emulator"); 

myapp.start(plugin);
plugin.log("Emulator has started.");

sendProcessInfo();
setInterval(sendProcessInfo, 10000);

// const logfile = '/opt/intrahouse-c/log/emul.log';

// let stream = fs.createWriteStream(logfile, { flags: 'a', encoding: 'utf-8', mode: 0o666 });

plugin.params.get()
  .then(result => {
    myapp.params = result;
    myapp.getChannelsAndRun();
    // setInterval( sendOne, 1000);
  })
  .catch(e => {
    plugin.exit(8, "ERROR! " + util.inspect(e));
  });


  /**
 * Запросы от сервера - обработчик сообщений type:command
 * {type:"command", command:"..."}
 */
plugin.onCommand(message => {
  switch (message.command) {
    case "fileupload":
      return fileUpload(message);

    default:
      throw { message: "Unknown command in message:" + util.inspect(message) };
  }
});

function fileUpload(message) {
  plugin.log('fileUploaded file=' + message.file);
}

function sendProcessInfo() {
  const mu = process.memoryUsage();
  const memrss = Math.floor(mu.rss/1024)
  const memheap = Math.floor(mu.heapTotal/1024)
  const memhuse = Math.floor(mu.heapUsed/1024)
  process.send({type:'procinfo', data:{memrss,memheap, memhuse }});
}

/*
function sendOne() {
    for (var i=0; i<3000; i++) {
        let sobj = [{id:'I'+i, value: i/100}];
        plugin.sendData(sobj);
        stream.write(logstr(util.inspect(sobj)));
    }
}
*/
/*
function logstr(str) {
    let dt = new Date();
    return dt.getHours() +
    ':' +dt.getMinutes() +
    ':' +dt.getSeconds() +
    '.' +dt.getMilliseconds()+' '+str+ '\r\n';
}

process.on('exit', () => {
    stream.end();
})
*/

/** 
 // Можно строить цепочки промисов. 
plugin.params.get()
  .then(result => {
    myapp.params = result;
    return plugin.channels.get();
  })
  .then(result => {
    if (result && result.length > 0) {
        myapp.channels = result;

      // Запуск основного цикла
      myapp.run();
    } else {
      plugin.exit(7, "Missing channels! Stop plugin.");
    }
  })
  .catch(e => {
    plugin.exit(8, "ERROR! " + util.inspect(e));
  });
*/

// Можно подписку реализовать прямо здесь
// plugin.channels.onChange((data) => {
/*
plugin.onChange('channels',(data) => {
        plugin.log('CHANNELS OnChange event. data='+util.inspect(data));
        // this.getChannelsAndRun();
});
*/


