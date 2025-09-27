const jwt = require('jsonwebtoken');
const User = require('../models/user');

class AuthError extends Error {
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}

const adminMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            throw new AuthError('Please log in to continue');
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_KEY);
        } catch (error) {
            throw new AuthError('Your session has expired. Please log in again');
        }

        const { _id, role } = payload;
        if (!_id) {
            throw new AuthError('Invalid session. Please log in again');
        }

        if (role !== 'admin') {
            throw new AuthError('You do not have permission to access this resource');
        }

        const result = await User.findById(_id).select('-password');
        if (!result) {
            throw new AuthError('User account not found. Please log in or register');
        }

        req.result = result;
        next();
    } catch (error) {
        console.error('Authentication error:', {
            message: error.message,
            stack: error.stack,
            path: req.path,
            method: req.method
        });

        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                error: true,
                message: error.message
            });
        }

        res.status(500).json({
            error: true,
            message: 'Something went wrong. Please try again later'
        });
    }
};

module.exports = adminMiddleware;