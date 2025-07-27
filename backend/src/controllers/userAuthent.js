const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission");

const cookieOptions = {
    httpOnly: true,
    secure: true, 
    sameSite: 'none', 
    domain: 'codequest-1jev.onrender.com'
};

const register = async (req, res) => {
    try {
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'user';

        const user = await User.create(req.body);
        const token = jwt.sign(
            { _id: user._id, emailId: emailId, role: 'user' },
            process.env.JWT_KEY,
            { expiresIn: 60 * 60 }
        );

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
        };

        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000
        });

        res.status(201).json({
            user: reply,
            message: "Registered and Logged In Successfully"
        });
    } catch (err) {
        res.status(400).json({
            error: err.message || "Registration failed"
        });
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            throw new Error("Email and password are required");
        }

        const user = await User.findOne({ emailId });
        if (!user) {
            throw new Error("Invalid Credentials");
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw new Error("Invalid Credentials");
        }

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
        };

        const token = jwt.sign(
            { _id: user._id, emailId: emailId, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: 60 * 60 }
        );

        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000
        });

        res.status(201).json({
            user: reply,
            message: "Login Successful"
        });
    } catch (err) {
        res.status(401).json({
            error: err.message || "Login failed"
        });
    }
};

const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(200).send("Already logged out");
        }

        const payload = jwt.decode(token);
        if (payload) {
            await redisClient.set(`token:${token}`, 'Blocked');
            await redisClient.expireAt(`token:${token}`, payload.exp);
        }

        res.cookie("token", "", {
            ...cookieOptions,
            expires: new Date(0) // Immediately expire the cookie
        });

        res.status(200).send("Logged Out Successfully");
    } catch (err) {
        res.status(503).json({
            error: err.message || "Logout failed"
        });
    }
};

const adminRegister = async (req, res) => {
    try {
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'admin';

        const user = await User.create(req.body);
        const token = jwt.sign(
            { _id: user._id, emailId: emailId, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: 60 * 60 }
        );

        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000
        });

        res.status(201).json({
            message: "Admin Registered Successfully",
            user: {
                firstName: user.firstName,
                emailId: user.emailId,
                _id: user._id,
                role: user.role
            }
        });
    } catch (err) {
        res.status(400).json({
            error: err.message || "Admin registration failed"
        });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.result._id;

        await User.findByIdAndDelete(userId);
        await Submission.deleteMany({ userId });

        
        res.cookie("token", "", {
            ...cookieOptions,
            expires: new Date(0)
        });

        res.status(200).send("Account Deleted Successfully");
    } catch (err) {
        res.status(500).json({
            error: err.message || "Account deletion failed"
        });
    }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };