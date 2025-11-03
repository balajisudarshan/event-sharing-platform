const jwt = require('jsonwebtoken')
const User = require('../models/User')

const AuthMiddleware = async(req,res,next)=>{
    const token = req.cookies.token
    if(!token){
        return res.status(401).json({message:"Unauthorized"})
    }

    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const user = await User.findById(decoded.user._id).select('-password')
        if(!user){
            return res.status(401).json({message:"Unauthorized"})
        }
        req.user = user
        next()  
    } catch (error) {
        console.error(error)
        return res.status(401).json({message:"Unauthorized"})
    }
}

// Roles check chesthadi - admin a? user a? temporary hero a? 
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - User info ledu " });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden - Permission ledu ra mawa" });
    }

    next();
  };
};
module.exports = { AuthMiddleware, authorizeRoles };