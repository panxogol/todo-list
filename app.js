// ----- IMPORTS -----
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const _ = require("lodash");

// DOTENV CONFIG
dotenv.config();

// CONSTANTS ENVIRONMENT (configure in a ".env" file)
const port = process.env.PORT;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

// EXPRESS CONFIGS
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


// MONGOSE CONFIGS
const dbName = "todolistDB";
const url = `mongodb://${dbUser}:${dbPass}@localhost:27017`;
mongoose.connect(`${url}/${dbName}`, {
    authSource: "admin",
}).then(() => {
    console.log("Succesfully connected to database");
}).catch(e => { console.log(e) });

// SCHEMA
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
    }
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});

// MODEL
const Item = mongoose.model("item", itemsSchema);
const List = mongoose.model("list", listSchema);


// Create example items
const first = new Item({ name: "Welcome to your To Do list!" });
const second = new Item({ name: "Hit the + button o add an item." });
const third = new Item({ name: "<-- Hit this to delete the item." });

const defaultItems = [first, second, third];


// --- PAGES ---

// HOME PAGE
app.get("/", (req, res) => {
    const items = [];

    // GET THE ITEMS FROM DB
    Item.find({}, (err, results) => {
        if (err) {
            console.log(err);
            items.push("Error: " + err);
        } else if (results.length === 0) {
            Item.insertMany(defaultItems, e => {
                if (e) {
                    console.log(e);
                } else {
                    console.log("Default items added to database.");
                }
            });
            res.redirect("/");
        } else {
            results.forEach((item) => {
                items.push(item);
            });
        };

        const context = {
            listTitle: "Today",
            itemList: items,
        };
        res.render("index", context);
    });
});

app.get("/about", (req, res) => {
    res.render("about");
});

// MORE LISTS
app.get("/:listTitle", (req, res) => {

    const listTitle = _.capitalize(req.params.listTitle);

    const items = [];

    List.findOne({ name: listTitle }, (err, results) => {
        if (err) {
            console.log(`Error: ${err}.`);
        } else {
            if (results) {
                console.log(`List ${listTitle} already exists.`)
                // Save existing list items
                results.items.forEach((item) => {
                    items.push(item);
                });
            } else {
                console.log(`List ${listTitle} not found.`);
                console.log(`Creating default list with name ${listTitle}.`);
                // Make new collection and add a list
                const list = new List({
                    name: listTitle,
                    items: defaultItems,
                });
                list.save();
                res.redirect(`/${listTitle}`);
            };
        };
        res.render("index", {
            listTitle: listTitle,
            itemList: items,
        });
    });
});

// --- POSTS  ---

// SHOW ITEMS
app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({ name: itemName });

    if (listName === "Today") {
        item.save().catch(e => { console.log(e) });
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, foundedList) => {
            if (err) {
                console.log(err);
                res.redirect("/");
            } else {
                foundedList.items.push(item);
                foundedList.save().catch(e => { console.log(e) });
                res.redirect("/" + listName);
            };
        });
    };
});

// DELETE ITEMS
app.post("/delete", (req, res) => {
    const itemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(itemId, e => {
            if (e) {
                console.log(`Error: id: ${itemId.slice(0, 10)}... did not remove. ${e}`);
            } else {
                console.log(`item ${itemId.slice(0, 10)}... was succesfully removed.`);
            }
            res.redirect("/");
        });
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: itemId } } },
            (err, results) => {
                if (err) {
                    console.log(err);
                }
                res.redirect("/" + listName);
            });
    };
});

// LISTEN
app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});