const jwt = require('jsonwebtoken');
const User = require('../models/user');
const validate = require('../utils/validator');
const bcrypt = require('bcrypt');
const Submission = require('../models/submission');


const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000
});

const register = async (req, res) => {
    try {
        if (!process.env.JWT_KEY) {
            throw new Error('JWT_KEY is not configured');
        }
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName,
            emailId,
            password: hashedPassword,
            role: 'user'
        });

        const token = jwt.sign(
            { _id: user._id, emailId: user.emailId, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: '1d' }
        );

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
        };

        res.cookie('token', token, getCookieOptions());

        res.status(201).json({
            user: reply,
            message: 'Registered and Logged In Successfully'
        });
    } catch (err) {
        res.status(400).json({
            error: err.message || 'Registration failed'
        });
    }
};

const login = async (req, res) => {
  try {
    if (!process.env.JWT_KEY) {
        throw new Error('JWT_KEY is not configured');
    }
    const { emailId, password } = req.body;
    
    if (!emailId || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const user = await User.findOne({ emailId }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role,
    };
    
    const newToken = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: '1d' }
    );
    
    res.cookie('token', newToken, getCookieOptions());
    
    res.status(200).json({
        user: reply,
        message: 'Login Successful'
    });
  } catch (error) {
    return res.status(500).json({ error: "Login failed: " + error.message });
  }
};

const logout = async (req, res) => {
    try {
        res.cookie('token', '', {
            ...getCookieOptions(),
            maxAge: 0,
            expires: new Date(0) 
        });
        res.status(200).send('Logged Out Successfully');
    } catch (err) {
        res.status(503).json({
            error: err.message || 'Logout failed'
        });
    }
};

const adminRegister = async (req, res) => {
    try {
        if (!process.env.JWT_KEY) {
            throw new Error('JWT_KEY is not configured');
        }
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName,
            emailId,
            password: hashedPassword,
            role: 'admin'
        });

        const token = jwt.sign(
            { _id: user._id, emailId: user.emailId, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, getCookieOptions());

        res.status(201).json({
            message: 'Admin Registered Successfully',
            user: {
                firstName: user.firstName,
                emailId: user.emailId,
                _id: user._id,
                role: user.role
            }
        });
    } catch (err) {
        res.status(400).json({
            error: err.message || 'Admin registration failed'
        });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.result._id;

        await User.findByIdAndDelete(userId);
        await Submission.deleteMany({ userId });

        res.cookie('token', '', {
            ...getCookieOptions(),
            maxAge: 0,
            expires: new Date(0)
        });

        res.status(200).send('Account Deleted Successfully');
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Account deletion failed'
        });
    }
};

const checkAuth = async (req, res) => {
  try {
    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id: req.result._id,
        role: req.result.role,
    };
    res.status(200).json({
        user: reply,
        message: 'Authentication successful'
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { register, login, logout, adminRegister, deleteProfile, checkAuth };