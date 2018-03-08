/**
 * plugin.js
 */
const util = require("util");
const qr = require("querystring");


module.exports = {
  params: {
  },

  setParams(obj) {
    if (typeof obj == "object") {
      Object.keys(obj).forEach(param => {
        if (this.params[param] != undefined) this.params[param] = obj[param];
      });
    }
  },

  config: [],
  reqarr: [],
  setConfig (arr) {
    if (!arr || !util.isArray(arr)) return;
    this.config = arr;
     // Установить начальное значение в зависимости от типа
     // Если period = 0 => не включать
     this.reqarr = arr.filter(item => item.period>0).map(item => {
         item.value = (item.desc == 'DI') ? 1 : item.min;
         item.tick = Number(item.period);
         return item;
     });
     
  
     this.formTimers();
  },

  timers: [],
  formTimers()  {
    let curtime = Date.now();

    this.timers = [];
    for (var i = 0; i < this.reqarr.length; i++) {
      if (i == 0) {
        this.timers.push({ index: 0, qtime: curtime });
      } else {
        // нужно вставить с учетом сортировки, чтобы время было через интервал сразу
        this.resetTimer({ index: i, qtime: 0 }, curtime);
      }
    }
  },

   /** Включить запрос в массив таймеров снова, если есть интервал опроса 	**/
   resetTimer (item, curtime) {
    let i;
  
    if (item && item.index < this.reqarr.length && this.reqarr[item.index].tick > 0) {
      item.qtime = curtime + this.reqarr[item.index].tick * 1000;
      i = 0;
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

  getNextReq () {
    if (this.timers.length > 0) {
      let curtime = Date.now();
      if (this.timers[0].qtime <= curtime) {
        let item = this.timers.shift();
        this.resetTimer(item, curtime);
        return item;
      }
    }
  },

  genAndSendNext(titem) {
    if (titem.index != undefined && titem.index < this.reqarr.length) {
        item = this.reqarr[titem.index];
    if (item.desc == 'AI') {
        if (item.min >= item.value) {
            item.dir = 'up';
        } else if (item.max <= item.value) {
            item.dir = 'dn';
        }
        item.value += (item.dir == 'dn') ? -item.delta : item.delta; 
    } else {
        item.value = (item.value == 1) ? 0 : 1;
    }
    process.send({ type: "data", data:[{id:item.id, value:item.value}] });
}
  },

  sendToServer(type, data) {
    process.send({ type, data });
  },


  sendDataToServer(data) {
    if (!data) return;

    process.send({ type: "data", data });
  }
};
 
/**
 * Подготовка массива запросов, которые будут вызываться по таймеру
 */
function prepareOutReq(config) {
    let res = [];
  
    config.forEach(item => {
      if ( Number(item.period) > 0) {
        res.push(Object.assign({tick: Number(item.period)}, item));
      }
    });
    return res;
  }
