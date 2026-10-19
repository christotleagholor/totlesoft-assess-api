const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }

  try {
    // Verify using the EXACT secret from your main site
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Fetch the user from the shared DB
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found in database.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Failed:', error.message);
    return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
  }
};