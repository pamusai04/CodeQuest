const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

class AuthError extends Error {
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}

const userMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            throw new AuthError("Please log in to continue");
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_KEY);
        } catch (error) {
            throw new AuthError("Your session has expired. Please log in again");
        }

        const { _id } = payload;
        if (!_id) {
            throw new AuthError("Invalid session. Please log in again");
        }

        const user = await User.findById(_id).select('-password');
        if (!user) {
            throw new AuthError("User account not found. Please log in or register");
        }

        const isBlocked = await redisClient.exists(`token:${token}`);
        if (isBlocked) {
            throw new AuthError("Your session is no longer valid. Please log in again");
        }

        req.result = user;
        next();
    } catch (error) {
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                error: true,
                message: error.message
            });
        }
        return res.status(500).json({
            error: true,
            message: "Internal server error"
        });
    }
};

module.exports = userMiddleware;