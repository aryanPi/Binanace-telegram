
const fs = require("fs");
const path = require("path");

class Database {
  constructor() {
    this.checkAndCreateFile();
  }
  checkAndCreateFile = () => {
    try {
      if (!fs.existsSync("database.json"))
        fs.writeFileSync(path.resolve(__dirname, "database.json"), "[]");
    } catch (er) {
      fs.writeFileSync(path.resolve(__dirname, "database.json"), "[]");
    }
  };
  clearFile = async (cb) => {
    await fs.writeFile(path.resolve(__dirname, "database.json"), "[]");
    if (cb) cb();
  };
  read = async (cb) => {
    fs.readFile(
      path.resolve(__dirname, "database.json"),
      "utf-8",
      (err, data) => {
        if (cb) cb(JSON.parse(data));
      }
    );
  };
  append = async (data, cb) => {
    this.read((dataInner) => {
      dataInner.push(data);
      this.write(dataInner, cb);
    });
  };
  remove = async (name, cb) => {
    this.read((dataInner) => {
      for (var i = 0; i < dataInner.length; i++) {
        if (dataInner[i].name == name) {
          dataInner.splice(i, 1);
          break;
        }
      }
      this.write(dataInner, cb);
    });
    if (cb) cb();
  };
  write = (data, cb) => {
    fs.writeFile(
      path.resolve(__dirname, "database.json"),
      JSON.stringify(data),
      cb == undefined ? () => {} : cb
    );
  };
  get = (filterName, cb) => {
    this.read((dataInner) => {
      for (var i = 0; i < dataInner.length; i++) {
        if (dataInner[i].name == filterName) {
          cb(dataInner[i]);
          break;
        }
      }
    });
  };
}

module.exports.Database = Database