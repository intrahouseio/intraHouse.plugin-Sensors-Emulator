/**
 * app.js
 * Прикладная часть плагина
 *
 * Эмулирует дискретные и аналоговые датчики
 */
const util = require("util");

module.exports = {
  params: {},
  channels: [],

  timers: [],
  reqarr: [],

  start(plugin) {
    this.plugin = plugin;
    /*
    // При любом изменении таблицы
    plugin.channels.onChange((data) => {
        plugin.log('CHANNELS OnChange event. data='+util.inspect(data));
         this.getChannelsAndRun();
    });
    */

    plugin.channels.onAdd(data => {
      plugin.log("CHANNELS onAdd event. data=" + util.inspect(data));
      this.getChannelsAndRun();
    });

    plugin.channels.onUpdate(data => {
      plugin.log("CHANNELS onUpdate event. data=" + util.inspect(data));
      this.getChannelsAndRun();
    });

    plugin.channels.onDelete(data => {
      plugin.log("CHANNELSonDelete event. data=" + util.inspect(data));
      this.getChannelsAndRun();
    });

    // Завершение работы
    process.on("exit", () => {
      // Если нужно что-то закрыть или сохранить на прикладном уровне -делать здесь
      // listeners здесь уже не работают
    });
  },

  getChannelsAndRun() {
    this.plugin.channels
      .get()
      .then(result => {
        if (!result || !result.length)
          throw { message: "Missing channels! Stop plugin." };
        this.channels = result;
        this.run();
      })
      .catch(e => {
        this.plugin.exit(8, "ERROR! " + util.inspect(e));
      });
  },

  run() {
    if (this.interval) clearInterval(this.interval);

    this.formReq();
    this.formTimers();
    const plugin = this.plugin;

    this.interval = setInterval(() => {
      const item = this.getNextFromTimers();
      if (item && item.index != undefined && item.index < this.reqarr.length) {
        plugin.sendData(this.gen(item.index));
      }
    }, 500);
  },

  // Сформировать массив запросов с ненулевым периодом, установить начальное значение
  formReq() {
    this.reqarr = this.channels
      .filter(item => item.period > 0)
      .map(item => {
        item.value = item.desc == "DI" ? 1 : item.min;
        item.tick = Number(item.period) * 1000;
        return item;
      });
  },

  // Сформировать заново очередь на генерацию
  formTimers() {
    const curtime = Date.now();

    this.timers = [];
    for (var i = 0; i < this.reqarr.length; i++) {
      if (i == 0) {
        this.timers.push({ index: 0, qtime: curtime });
      } else {
        this.insertTimer({ index: i, qtime: 0 }, curtime);
      }
    }
  },

  // Включить запрос в очередь на генерацию
  insertTimer(item, curtime) {
    let i = 0;
    if (
      item &&
      item.index < this.reqarr.length &&
      this.reqarr[item.index].tick > 0
    ) {
      item.qtime = curtime + this.reqarr[item.index].tick;
      while (i < this.timers.length) {
        if (this.timers[i].qtime > item.qtime) {
          this.timers.splice(i, 0, item);
          return;
        }
        i++;
      }
      this.timers.push(item);
    }
  },

  // Получить элемент из очереди на генерацию. Очередь упорядочена по qtime
  getNextFromTimers() {
    if (this.timers.length > 0) {
      const curtime = Date.now();
      if (this.timers[0].qtime <= curtime) {
        let item = this.timers.shift();
        this.insertTimer(item, curtime);
        return item;
      }
    }
  },

  // Генерировать данные канала
  gen(index) {
    const item = this.reqarr[index];
    if (item.desc == "AI") {
      if (item.min >= item.value) {
        item.dir = "up";
      } else if (item.max <= item.value) {
        item.dir = "dn";
      }
      item.value += item.dir == "dn" ? -item.delta : item.delta;
    } else if (item.desc == "Meter") {
      item.value += 1 * item.weight;
    } else {
      item.value = item.value == 1 ? 0 : 1;
    }
    return [{ id: item.id, value: item.value }];
  }
};
