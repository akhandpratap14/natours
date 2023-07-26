const mongoose = require('mongoose');
const dotenv = require('dotenv');

// process.on('uncaughtException', err => {
//     console.log('UNCAUGHT EXCEPTION SHUTTING DOWN');
//     console.log(err.name, err.message);
//     process.exit(1);
// });
 
dotenv.config({path: './config.env'});

const app = require("./app");

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// Instead of DB use process.env.DATABASE_local to work on local database

mongoose.connect(DB).then(con => {
    console.log('DB connections Succefull')
});
// catch(err => console.log('Error'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App Running on Port ${port}....`);
});

// process.on('unhandledRejection', err => {
//     console.log('UNHANDLED REJECTION SHUTTING DOWN....');
//     console.log(err.name, err.message);
//     server.close(() => {
//         process.exit(1);
//     });
// });
