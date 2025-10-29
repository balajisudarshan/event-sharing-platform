const jwt = require('jsonwebtoken')
require('dotenv').config()


const verifyToken = (req,res,next)=>{
    const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ","")

    if(!token){
        return res.status(401).json({message:"No token, authorization denied"})
    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({message:"Invalid token"})
    }
}

module.exports = verifyToken