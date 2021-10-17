const { Database } = require("./database");
var binance = undefined;
var { TIMEFRAME_TIMEOUT } = require("./constants");
const { Telegraf } = require("telegraf");
const token =  process.env.BOT_TOKEN || "none";
const GROUP_ID = process.env.TELEGRAM_GROUPID || 0;
const bot = new Telegraf(token, { polling: true });
bot.launch();

class SingleGroupFunction {
  constructor(data) {
    this.data = data;
    this.parseData();
    this.initInterval();
  }
  parseData = () => {
    this.market = this.data.market;
    this.pairs = this.data.pairs;
    this.lookup = this.data.lookup;
    this.name = this.data.name;
    this.timeframe = this.data.timeframe;
    this.change = this.data.change;
    this.interval = undefined;
  };
  run = async () => {
    var dataToSend = "";
    for (var i of this.pairs) {
      if (this.market == "future")
        var candelInfo = await binance.futuresCandles(
          i,
          this.timeframe.toLowerCase()
        );
      else if (this.market == "spot")
        var candelInfo = await binance.candlesticks(
          i,
          this.timeframe.toLowerCase()
        );

      var changeArray = [];
      changeArray.push(
        candelInfo[candelInfo.length - 2][1],
        candelInfo[candelInfo.length - 2][4],
        candelInfo[candelInfo.length - 2 - this.lookup][1],
        candelInfo[candelInfo.length - 2 - this.lookup][4]
      );
      var change = Math.max(...changeArray) - Math.min(...changeArray);
      change = (change / candelInfo[candelInfo.length - 1][4]) * 100;

      if (change >= this.change) {
        dataToSend += `\n${i} : ${change.toFixed(2)}% (${
          candelInfo[candelInfo.length - 1][4]
        })`;
      }
    }
    if (dataToSend != "") {
      bot.telegram.sendMessage(
        GROUP_ID,
        `
        ${this.name.toUpperCase()} (${this.timeframe}) ${this.change}% 
        ${this.market.toUpperCase()}
        ${dataToSend}
        `
      );
    }
    if (this.interval == undefined) {
      setTimeout(() => {
        this.interval = setInterval(() => {
          this.run();
        }, TIMEFRAME_TIMEOUT[this.timeframe.toUpperCase()]);
      }, candelInfo[candelInfo.length - 1][7] - new Date().getTime());
    }
  };
  initInterval = async () => {
    this.run();
  };
  terminateNow = () => {
    if (this.interval != undefined) clearInterval(this.interval);
  };
}

const database = new Database();

var listClassesRunning = [];

function startAgain() {
  for (var i of listClassesRunning) {
    i.terminateNow();
    i = null;
  }
  listClassesRunning = [];
  database.read((data) => {
    for (var i of data) listClassesRunning.push(new SingleGroupFunction(i));
  });
}

function newDataAdded(data, socket) {
  database.append(data, () => {
    database.read((data) => {
      socket.emit("get", { type: "all", data: data });
    });
  });
  startAgain();
}
function getAllData(callback) {
  database.read(callback);
}

function deleteData(name, socket) {
  database.remove(name, () => {
    database.read((data) => {
      socket.emit("get", { type: "all", data: data });
    });
  });
  startAgain();
}

function setBinanace(b) {
  binance = b;
}

module.exports.setBinanace = setBinanace;
module.exports.startAgain = startAgain;
module.exports.newDataAdded = newDataAdded;
module.exports.getAllData = getAllData;
module.exports.deleteData = deleteData;
module.exports.startAgain = startAgain;
