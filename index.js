const socketIO = require("socket.io");
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const functions = require("./functions");
const server = http.createServer(app);
const copy = require("copy-paste");
const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: process.env.API_KEY || "",
  APISECRET: process.env.API_SECRET || "",
});

functions.setBinanace(binance);

async function run() {
  var data = await binance.prices();
  var data2 = await binance.futuresPrices();
  var selected = [];
  for (var i of Object.keys(data)) {
    if (i.includes("BTC") || i.includes("USDT")) {
      selected.push(i);
    }
  }
  for (var i of Object.keys(data2)) {
    if (i.includes("BTC") || i.includes("USDT")) {
      selected.push(i);
    }
  }
  console.info(Object.entries(data).length + Object.entries(data2).length);
  //console.log(selected.length);
}

//run()

async function run2() {
  var data = await binance.futuresCandles("TRXUSDT", "5m");
  console.log(data[0], data[1]);
  copy.copy(JSON.stringify(data));
}
//run2();

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "public", "index.html"));
});

const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("new connection");
  socket.on("get", async (data) => {
    switch (data.type) {
      case "future-list":
        var data = await binance.futuresPrices();
        socket.emit("get", { type: "future-list", data: data });
        break;
      case "spot-list":
        var data = await binance.prices();
        socket.emit("get", { type: "spot-list", data: data });
        break;
      case "all":
        functions.getAllData((data) => {
          socket.emit("get", { type: "all", data: data });
        });
        break;
    }
  });
  socket.on("action", (data) => {
    if (data.type == "create") {
      functions.newDataAdded(data.data, socket);
      socket.emit("done");
    } else if (data.type == "delete") {
      functions.deleteData(data.name, socket);
    }
  });
});
server.listen(process.env.PORT || 80, (res) => {
  console.log("Running");
  functions.startAgain();
});
