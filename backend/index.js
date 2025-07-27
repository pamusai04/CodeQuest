const express = require('express')
const app = express();
require('dotenv').config();
const main =  require('./src/config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./src/routes/userAuth");
const redisClient = require('./src/config/redis');//src/config/redis
const problemRouter = require("./src/routes/problemCreator");
const submitRouter = require("./src/routes/submit")
const cors = require('cors')
require('dotenv').config();


app.use(cors({
    origin: 'http://localhost:5173', //https://codequest-1jev.onrender.com
    credentials: true 
}))

app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);



const InitalizeConnection = async ()=>{
    try{
        
        
        await Promise.all([main(),redisClient.connect()]);

        console.log("DB Connected");
        

        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}


InitalizeConnection();
