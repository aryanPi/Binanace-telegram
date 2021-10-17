const socket = io();
var r = document.querySelector(":root");
var createNewData = {};

document.querySelector(".fab-btn").onclick = () => {
  document.getElementById("next-1").innerHTML = "Next";
  createNewData = {};
  document.getElementById("con-1").style.display = "flex";
  document.getElementById("con-2").style.display = "none";
  document.getElementById(
    "con-1"
  ).innerHTML = `<input type="text" class="inp" id='name-inp' placeholder="Name" />
          <input type="text" class="inp" id='lookup-inp' placeholder="Lookup Candles" />
          <input type="number" class="inp" id='change-inp' placeholder="% Change" />
          <select name="timeframe" id="timeframe">
            <option value="1M">1M</option>
            <option value="5M">5M</option>
            <option value="15M">15M</option>
            <option value="30M">30M</option>
            <option value="1H">1H</option>
            <option value="4H">4H</option>
            <option value="1D">1D</option>
          </select>`;
  r.style.setProperty("--bg-blur", "10px");
  document.querySelectorAll(".dialog")[0].style.display = "flex";
  document.querySelectorAll(".dialog")[0].classList.remove("fade-out");
  document.querySelectorAll(".dialog")[0].classList.add("fade-in");
  document.getElementsByTagName("body")[0].classList.add("body-blur");
  document.getElementById("next-1").onclick = () => {
    var lookup = document.getElementById("lookup-inp");
    var name = document.getElementById("name-inp");
    var change = document.getElementById("change-inp");
    var allDone = true;
    if (!lookup.value) {
      lookup.classList.add("inp-error");
      allDone = false;
    } else {
      lookup.classList.remove("inp-error");
    }
    if (!change.value) {
      change.classList.add("inp-error");
      allDone = false;
    } else {
      change.classList.remove("inp-error");
    }
    if (!name.value) {
      name.classList.add("inp-error");
      allDone = false;
    } else {
      name.classList.remove("inp-error");
    }
    if (allDone) {
      createNewData.name = name.value;
      createNewData.change = change.value;
      createNewData.lookup = lookup.value;
      createNewData.timeframe = document.getElementById("timeframe").value;

      document.getElementById("title-dialog").innerHTML = "Select Symbols";
      document.getElementById("con-1").innerHTML = `
     <select name="market" id="market" style='width:250px'>
            <option value="future">Futures</option>
            <option value="spot">Spot</option>
     </select>
       `;
      document.getElementById("next-1").onclick = () => {
        if (document.getElementById("market").value == "future") {
          socket.emit("get", { type: "future-list" });
        } else if (document.getElementById("market").value == "spot") {
          socket.emit("get", { type: "spot-list" });
        }
      };
    }
  };
};

function createNow() {
  createNewData.pairs = [];
  for (var i of Object.keys(listData)) {
    if (document.getElementById(i).children[3].checked) {
      createNewData.pairs.push(i);
    }
  }
  socket.emit("action", { type: "create", data: createNewData });
}

function setTableData(data) {
  document.getElementById("next-1").onclick = () => {
    createNow();
  };
  document.getElementById("next-1").innerHTML = "Create";
  document.getElementById("con-1").style.display = "none";
  document.getElementById("con-2").style.display = "flex";
  var d = document.getElementById("list-modal");
  d.innerHTML = "";
  var count = 1;
  listData = data;
  for (var i of Object.keys(data)) {
    var div = document.createElement("div");
    div.className = "row";
    div.id = i;
    div.innerHTML = `<div  class='col'>${count++}</div><div class='col'>${i}</div><div class='col'>${
      data[i]
    }</div><input    type='checkbox'/>`;
    d.appendChild(div);
  }

  document.getElementById("filter").addEventListener("input", () => {
    var PATTERN = document.getElementById("filter").value.toUpperCase(),
      filtered = Object.keys(listData).filter(function (str) {
        return str.includes(PATTERN);
      });
    for (var i of Object.keys(listData)) {
      if (document.getElementById(i))
        document.getElementById(i).classList.add("hide-2");
    }
    for (var i of filtered) {
      document.getElementById(i).classList.remove("hide-2");
    }
  });
}
var listData;
socket.on("done", () => {
  document.getElementById("cancel-1").click();
  //socket.emit("get", { type: "all" });
});
var globalData;
socket.on("get", (data) => {
  switch (data.type) {
    case "future-list":
      createNewData.market = "future";
      setTableData(data.data);
      break;
    case "spot-list":
      createNewData.market = "spot";
      setTableData(data.data);
      break;
    case "all":
      globalData = data.data;
      var table = document.querySelector(".table");
      table.innerHTML = `<div class="table-head"><div class="row"><div class="col">#</div><div class="col">Name</div><div class="col">Timeframe</div><div class="col">%change</div><div class="col">Symbols</div><div class="col">Action</div></div></div>`;
      var count = 1;
      for (var i of data.data) {
        var div = document.createElement("div");
        div.className = "table-content";
        div.innerHTML = `<div class="row">
            <div class="col">${count++}</div>
            <div class="col">${i.name}</div>
            <div class="col">${i.timeframe}</div>
            <div class="col">${i.change}%</div>
            <div class="col">${i.pairs.length}</div>
            <div class="col">
              <button onclick='view("${
                i.name
              }")' class="btn btn-warning">View</button
              ><button onclick='del("${
                i.name
              }")' class="btn btn-danger">Delete</button>
            </div>
          </div>`;
        table.appendChild(div);
      }
      break;
  }
});
function del(name) {
  socket.emit("action", { type: "delete", name: name });
}
function view(name) {
  r.style.setProperty("--bg-blur", "10px");
  var dialog = document.querySelectorAll(".dialog")[1];
  dialog.style.display = "flex";
  dialog.classList.remove("fade-out");
  dialog.classList.add("fade-in");
  document.getElementsByTagName("body")[0].classList.add("body-blur");
document.getElementById("title-dialog-2").innerHTML=`View (${name})`
    var d;
    for(var i of globalData){
        if(i.name==name){
            d=i;
            break;
        }
    }
    document.getElementById("list-view").innerHTML=''
    for(var i of d.pairs){
        document.getElementById("list-view").innerHTML += `<div class="row">
              <div class="col">${i}</div>
            </div>`;
    }
    document.getElementById("timeframe-view").innerHTML=`Timeframe : ${d.timeframe}`
    document.getElementById(
      "change-view"
    ).innerHTML = `Timeframe : ${d.change}`;
    document.getElementById(
      "market-view"
    ).innerHTML = `Market : ${d.market}`;
}

function ONLOAD() {
  socket.emit("get", { type: "all" });
}

document.getElementById("cancel-1").onclick = () => {
  var dialog = document.querySelectorAll(".dialog")[0];
  document.getElementsByTagName("body")[0].classList.add("blur-out");
  dialog.classList.remove("fade-in");
  dialog.classList.add("fade-out");
  setTimeout(() => {
    document.getElementsByTagName("body")[0].classList.remove("body-blur");
    dialog.style.display = "none";
  }, 150);
  r.style.setProperty("--bg-blur", "0px");
};

document.getElementById("cancel-2").onclick = () => {
  var dialog = document.querySelectorAll(".dialog")[1];
  document.getElementsByTagName("body")[0].classList.add("blur-out");
  dialog.classList.remove("fade-in");
  dialog.classList.add("fade-out");
  setTimeout(() => {
    document.getElementsByTagName("body")[0].classList.remove("body-blur");
    dialog.style.display = "none";
  }, 150);
  r.style.setProperty("--bg-blur", "0px");
};

$(".dialog").click(function (event) {
  if (
    !$(event.target).closest(".dialog-body").length &&
    !$(event.target).is(".dialog-body")
  ) {
    var dialogs = document.querySelectorAll(".dialog");
    document.getElementsByTagName("body")[0].classList.add("blur-out");
    dialogs[0].classList.remove("fade-in");
    dialogs[0].classList.add("fade-out");
    dialogs[1].classList.remove("fade-in");
    dialogs[1].classList.add("fade-out");
    setTimeout(() => {
      document.getElementsByTagName("body")[0].classList.remove("body-blur");
      dialogs[0].style.display = "none";
      dialogs[1].style.display = "none";
    }, 150);
    r.style.setProperty("--bg-blur", "0px");
  }
});
