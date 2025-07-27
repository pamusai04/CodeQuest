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

// console.log("Hello")

app.use(cors({
    origin: 'http://localhost:5173',
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




// # CLOUDINARY_CLOUD_NAME=djj4ssb5m
// # CLOUDINARY_API_KEY=244997135396696
// # CLOUDINARY_API_SECRET=5C2WEWXx8U_Gi_WGLmj5444yAfQ

// # PORT=3000
// # DB_CONNECT_STRING=mongodb+srv://Sai0410:Sai%400410@codingsa.hu8ximi.mongodb.net/Leetcode
// # JWT_KEY=70ed27934da41120f22f1160b493f2be467224a30a6efff0ae217e6d7d657bd0
// # REDIS_PASS=cU5lFmDZru6K6bWIVKvKrd55JeFqDY1V

