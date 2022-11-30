// ----- IMPORTS -----
const express = require("express");
const dotenv = require("dotenv");
const date = require(__dirname + "/date.js");

// DOTENV CONFIG
dotenv.config();

// CONSTANTS
const port = process.env.PORT;
const app = express();

// EXPRESS CONFIGS
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// GLOBAL VARIABLES
let items = [];

// PAGES
app.get("/", (req, res) => {
    const day = date.getDate();

    const context = {
        day: day,
        itemList: items,
    };
    res.render("index", context);
});

app.get("/about", (req, res) => {
    res.render("about");
});


// POSTS
app.post("/", (req, res) => {
    let item = req.body.newItem;
    items.push(item);
    console.log(items);
    res.redirect("/");
});

// LISTEN
app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});