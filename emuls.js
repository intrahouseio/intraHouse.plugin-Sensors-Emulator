/**
 * emuls.js
 */
const util = require("util");

const plugin = require("./lib/plugin")(); 
const myapp = require("./emulator"); 

myapp.start(plugin);
plugin.log("Emulator has started.");

plugin.params.get()
  .then(result => {
    myapp.params = result;
    myapp.getChannelsAndRun();
  })
  .catch(e => {
    plugin.exit(8, "ERROR! " + util.inspect(e));
  });



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
  
// Можно подписку реализовать прямо здесь
plugin.channels.onChange((data) => {
        plugin.log('CHANNELS OnChange event. data='+util.inspect(data));
         this.getChannelsAndRun();
});
*/
