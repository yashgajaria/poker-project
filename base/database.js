require('dotenv').config();
const mongoConnection = process.env['MONGO_CONNECTION'];


const mongoose = require('mongoose');
mongoose.connect(mongoConnection);

const db = mongoose.connection;
db.on("error", () => {
    console.log("> error occurred from the database");
});
db.once("open", () => {
    console.log("> successfully opened the database");
});

module.exports = mongoose;