const User = require('../models/User');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const registerUser = async(req,res)=>{
    const {name,email,password} = req.body 
    try {
        const isUserExist = await User.findOne({email})
        if(isUserExist){
            return res.status(400).json({message:"User already exist"})
        }
        const hashedPassword = await bcrypt.hash(password,10)
        const newUser = new User({
            name,
            email,
            password:hashedPassword
        })

        await newUser.save()
        res.status(200).json({message:"User created succesfully",user:newUser})
    } catch (error) {
        res.json(500).json({message:"Server error",error:error.message})
        console.log("Error in registerUser:",error);
    }
}

const loginUser = async(req,res)=>{
    const {email,password} = req.body
    try {
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const isPasswordValid = await bcrypt.compare(password,user.password)
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid credentials"})
        }

        const token = jwt.sign({id:user._id,email:user.email,role:user.role},process.env.JWT_SECRET)

        res.cookie('token',token)
        res.status(200).json({message:"Login successful",token,user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        }})

    } catch (error) {
        return res.status(500).json({message:"Server error",error:error.message})
        console.log("Error in loginUser:",error);
    }
}
const user = async(Req,res)=>{
    console.log("User route accessed");
}

module.exports = {registerUser,loginUser,user};