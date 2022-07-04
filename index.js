const express = require('express');
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const Campground = require("./models/campground.js");
const { urlencoded } = require('express');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const Review = require('./models/review.js');
const session = require('express-session');
const flash = require("connect-flash");

main()
    .then(() => {
        console.log("Database connected!");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelpCamp');
}

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));
app.engine('ejs', ejsMate);

app.use(express.urlencoded({ extended: true }));

const sessionConfig = {
    secret: "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 4,
        httpOnly: true
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.deleted = req.flash('deleted');
    next();
})

const userRoutes = require('./routes/users.js');
const User = require('./models/user.js');
app.use('/users', userRoutes);

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/campgrounds', wrapAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
}))

app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new.ejs');
})

app.get('/campgrounds/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
        .populate({ path: 'reviews', populate: { path: 'author' } })
        .populate("author");
    if (req.session.user_id) {
        const user = await User.findById(req.session.user_id);
        const currentUser = user.username
        res.render('campgrounds/show.ejs', { campground, currentUser });
    } else {
        const currentUser = undefined;
        res.render('campgrounds/show.ejs', { campground, currentUser });
    }
}))

app.get('/campgrounds/:id/edit', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    res.render('campgrounds/edit.ejs', { campground });
}))

app.delete('/campgrounds/:id/reviews/:reviewId', wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    req.flash("deleted", "Review was deleted!")
    res.redirect(`/campgrounds/${id}`);
}))

app.post('/campgrounds/:id/reviews', wrapAsync(async (req, res) => {
    console.log(req.body);
    const { id } = req.params;

    if (req.session.user_id) {
        const review = new Review(req.body);
        review.author = req.session.user_id
        await review.save();
        const campground = await Campground.findById(id);
        campground.reviews.push(review);
        await campground.save();
        req.flash("success", "Successfully created review!")
        res.redirect(`/campgrounds/${id}`);
    } else {
        req.flash("deleted", "You must be logged in!")
        res.redirect("/users/login");
    }
}))

app.post('/campgrounds', wrapAsync(async (req, res) => {
    if (!req.session.user_id) {
        req.flash("deleted", "You must be logged in to create a campground!");
        res.redirect("/campgrounds")
    } else {
        const newCampground = await new Campground(req.body);
        newCampground.author = req.session.user_id;
        await newCampground.save();
        req.flash('success', 'Successfully created campground!');
        res.redirect(`/campgrounds/${newCampground._id}`);
    }
}))

app.put('/campgrounds/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    console.log(id)
    const camp = await Campground.findById(id).populate("author");
    console.log(camp)

    if (!req.session.user_id) {
        req.flash("deleted", "You must be logged in!");
        res.redirect("/users/login");
    } else {
        const user = await User.findById(req.session.user_id);
        if (camp.author.username === user.username) {
            await Campground.findByIdAndUpdate(id, req.body);
            req.flash("success", "Succesfully Edited Campground!")
            res.redirect(`/campgrounds/${camp._id}`);
        } else {
            console.log(camp.author.username);
            req.flash("deleted", "You must be the author of the campground!")
            res.redirect("/campgrounds")
        }
    }
}))

app.delete('/campgrounds/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('deleted', 'Campground was deleted!')
    res.redirect('/campgrounds');
}))

// runs at the very end if nothing else works
app.all('*', (req, res, next) => {
    next(new ExpressError("There is a 404 error broo", 404));
})

app.use((err, req, res, next) => {
    const { message = "Somthing went wrong", status = 500
    } = err;
    res.status(status).render('error.ejs', { err });
})

app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000");
})


