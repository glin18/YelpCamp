const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelpers.js");
const axios = require('axios').default;

main()
    .then(() => {
        console.log("Database connected!");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelpCamp');
}

async function getImages() {
    try {
        const response = await axios.get('https://api.unsplash.com/photos/random', {
            params: {
                collections: 483251,
                client_id: "US4DMzTaibpBZZ6N-P6E-boU-r-ATKZw4yA5pP7HU9M"
            }
        });
        console.log(response);
        return response.data.urls.small;
    } catch (error) {
        console.error(error);
    }
}

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const camp = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: await getImages(),
            description: 'Destination is more than a summer camp. We offer a safe, fun, and stimulating environment that focuses on developing a community for our campers and families.',
            author: "62bfb6b82ffdbf060a37d4e7"
        });
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});