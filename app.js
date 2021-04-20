require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // we're connected!
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To Do List",
});

const item2 = new Item({
  name: "Hit + to add new task to the list",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item from list",
});

const defaultItems = [item1, item2, item3];

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listsSchema);

app.get("/", (req, res) => {
  console.log("Server is up and running");

  //const day = date.getDate();

  Item.find({}, function (err, foundItems) {
    if (err) console.log(err);
    else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) console.log(err);
          else console.log("Successfully added default items to the database");
        });
        res.redirect("/");
      } else
        res.render("list", { listTitle: "Today", addNewItems: foundItems });
    }
  });
});

app.post("/", (req, res) => {
  const addItem = new Item({
    name: req.body.newItem,
  });
  const listName = req.body.list;
  //const day = date.getDate();

  if (listName === "Today") {
    addItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (err) console.log(err);
      else {
        foundList.items.push(addItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const id = req.body.checkbox;
  const listName = req.body.listName;
  //const day = date.getDate();

  if (listName === "Today") {
    Item.findByIdAndRemove(id, function (err) {
      if (err) console.log(err);
      else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: id } } },
      function (err, foundList) {
        if (err) console.log(err);
        else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) console.log(err);
    else {
      if (!foundList) {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          addNewItems: foundList.items,
        });
      }
    }
  });
});

app.post("/:customListName", (req, res) => {
  const customListName = req.params.customListName;
  workItems.push(req.body.newItem);
  res.redirect("/" + customListName);
});

app.listen(process.env.PORT || 3000, (err) => {
  if (err) console.log(err);
  console.log("Server started running");
});
