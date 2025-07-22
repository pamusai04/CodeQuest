
require('dotenv').config();
const { createClient }  = require('redis');
const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-15845.crce179.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 15845
    }
});
module.exports = client;