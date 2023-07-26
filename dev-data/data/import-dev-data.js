const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./../../app');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(con => {
    console.log('DB connections Succefull');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validationBeforeSave: false });
        await Review.create(reviews);
        console.log('Data Successfully loaded');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data Successfully deleted');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

if(process.argv[2] === '--import'){
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}