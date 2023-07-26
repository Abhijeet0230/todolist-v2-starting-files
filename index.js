require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const PORT = process.env.PORT || 3000

mongoose.set('strictQuery',true);
const connectDB= async ()=> {
  try{
    const conn = await mongoose.connect(process.env.MONGO_URI,{
      useUnifiedTopology: true,
      useNewUrlParser: true,
      
    });
    // console.log(process.env.MONGO_URI);
    console.log(`MongoDb Connected: ${conn.connection.host}`);
  }catch(error) {
    console.log(error);
    process.exit(1);
  }
}
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
////////////////////////
// mongoose.connect("mongodb+srv://admin-abhijeet:Test123@cluster0.ha05mtj.mongodb.net/todolistDB", { useNewUrlParser: true });
// console.log(process.env.MONGO_URI);
const itemsSchema = new mongoose.Schema({
  //created the first schema
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<--Hit this to delete a item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  //created a second schema for different routes other than the home route
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);
/////////////////////////////////

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Insert succesfull");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  })
});

app.get("/:customListName", (req, res) => {
  const customListName =_.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundName) => {
      if (foundName === null) {
        //agar list nahi thi too bana di aur save kar di
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        console.log("Title name not found, creating the todolist");
        return list.save();
      } else {
        //agar list thi pehle se to log kar dia ki list hai

        console.log("Title name found");
        return foundName;
      }
    })
    .then((saveItems) => {
      //dono hi case mei phir jo saved list hai usko render kar dia
      console.log(saveItems.items);

      console.log("locating to the todolist");
      res.render("list", {
        listTitle: customListName,
        newListItems: saveItems.items,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    Item.findByIdAndRemove({ _id: checkedItemId })
      .then(function () {
        console.log("Item has been successfully deleted");
      })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function () {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });
