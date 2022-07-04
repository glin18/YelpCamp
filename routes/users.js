const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require("bcrypt");
const session = require("express-session");

router.get('/register', (req, res) => {
    res.render("users/register.ejs");
})

router.get('/login', (req, res) => {
    if (req.session.user_id) {
        req.flash("deleted", "You are already logged in!")
        res.redirect("/users/account")
    }
    res.render("users/login.ejs");
})

router.get('/account', async (req, res) => {
    if (req.session.user_id) {
        const user = await User.findById(req.session.user_id);
        res.render("users/account.ejs", { user })
    } else {
        req.flash("deleted", "Login is required")
        res.redirect("http://localhost:3000/users/login")
    }
})

router.post('/account/logout', async (req, res) => {
    req.session.user_id = null;
    req.flash("deleted", "Logged out!");
    res.redirect("http://localhost:3000/campgrounds")
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
        const result = await bcrypt.compare(password, user.password)
        if (result) {
            req.session.user_id = user._id;
            req.flash("success", "Successfully logged in!")
            res.redirect("http://localhost:3000/campgrounds")
        } else {
            req.flash("deleted", "Incorrect username or password");
            res.redirect("http://localhost:3000/users/login");
        }
    } else {
        req.flash("deleted", "Incorrect username or password");
        res.redirect("http://localhost:3000/users/login");
    }


})

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, email, password: hashPassword });
    const exists = await User.exists({ username });
    const emailExists = await User.exists({ email });
    if (!exists && !emailExists) {
        await newUser.save();
        req.flash("success", "Registration successful. Welcome to YelpCamp!");
        res.redirect("http://localhost:3000/campgrounds");
    } else {
        req.flash("deleted", "Username or email has already been used");
        res.redirect("http://localhost:3000/users/register");
    }
})

module.exports = router;
