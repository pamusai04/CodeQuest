
require('dotenv').config();
const express = require('express');
const app = express();
const main = require('./src/config/db');
const cookieParser = require('cookie-parser');
const authRouter = require('./src/routes/userAuth');
const problemRouter = require('./src/routes/problemCreator');
const submitRouter = require('./src/routes/submit');
const cors = require('cors');

app.use(cors({
    // origin: 'http://localhost:5173', 
    origin: 'https://codequest-1jev.onrender.com',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);

const InitalizeConnection = async () => {
    try {
        await main(); // Only database connection
        console.log('DB Connected');
        app.listen(process.env.PORT, () => {
            console.log('Server listening at port number: ' + process.env.PORT);
        });
    } catch (err) {
        console.log('Error: ' + err);
    }
};

InitalizeConnection();