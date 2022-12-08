// ----- IMPORTS -----
const express = require("express");
const dotenv = require("dotenv");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

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

// MODEL
const Item = mongoose.model("item", itemsSchema);

// Create example items
const first = new Item({ name: "Welcome to your To Do list!" });
const second = new Item({ name: "Hit the + button o add an item." });
const third = new Item({ name: "<-- Hit this to delete the item." });

const defaultItems = [first, second, third];


// PAGES
app.get("/", (req, res) => {
    const day = date.getDate();
    const items = [];

    // GET THE ITEMS FROM DB
    Item.find({}, (err, results) => {
        if (err) {
            console.log(err);
            items.push("Error: Not connected to DB.");
        } else if (results.length === 0) {
            Item.insertMany(defaultItems, e => {
                if (e) {
                    console.log(e);
                }
            });
            res.redirect("/");
        } else {
            results.forEach((item) => {
                items.push(item);
            });
        };

        const context = {
            day: day,
            itemList: items,
        };
        res.render("index", context);
    });
});

app.get("/about", (req, res) => {
    res.render("about");
});


// POSTS
app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const item = new Item({ name: itemName });
    item.save().catch(e => { console.log(e) });
    res.redirect("/");
});

app.post("/delete", (req, res) => {
    const itemId = req.body.checkbox;
    Item.findByIdAndRemove(itemId, e => {
        if (e) {
            console.log(`Error: id: ${itemId.slice(0, 10)}... did not remove. ${e}`);
        } else {
            console.log(`item ${itemId.slice(0, 10)}... was succesfully removed.`);
        }
        res.redirect("/");
    });
});

// LISTEN
app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});