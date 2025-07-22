const mongoose = require('mongoose');

async function main() {
    // console.log('MongoDB URI:', process.env.DATA_BASE_CONNECT_STRING);
    await mongoose.connect(process.env.DATA_BASE_CONNECT_STRING)
    console.log("hai")
}

module.exports = main;


