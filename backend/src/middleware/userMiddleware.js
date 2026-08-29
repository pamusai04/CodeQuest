
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userMiddleware = async (req, res, next) => {
  try {
    
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }
    
    const payload = jwt.verify(token, process.env.JWT_KEY);
    const { _id } = payload;
    if (!_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Please try logging in again.",
      });
    }

    const result = await User.findById(_id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register.",
      });
    }
    
    req.result = result;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Please log in again.",
    });
  }
};


module.exports = userMiddleware;