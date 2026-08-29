const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.DATA_BASE_CONNECT_STRING)
}

module.exports = main;


