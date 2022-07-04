const mongoose = require("mongoose");
const schema = mongoose.Schema;
const Review = require('./review.js');

const CampgroundSchema = new mongoose.Schema({
    title: String,
    image: String,
    price: Number,
    description: String,
    location: String,
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});



CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const reviews = [...doc.reviews];

        for (let review of reviews) {
            await Review.deleteMany({ _id: review })
        }
    }
})



const Campground = mongoose.model('Campground', CampgroundSchema);

module.exports = Campground;