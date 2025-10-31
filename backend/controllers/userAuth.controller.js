const User = require('../models/User')
const bcrypt = require('bcryptjs')
const registerUser = async(req,res)=>{
    const {name,email,password,role,promotedUntil,isIEEE,branch,year} = req.body //aaa body nunchi techuko kavalsinavi
    try {
        const isExistedUser = await User.findOne({email}) //eyy donga
        if(isExistedUser){
            return res.status(400).json({message:"User already exist"}) ///donga dorikaddduuuu muskoni login avvu
        }        
        const hashedPassword = bcrypt.hash(password,10)
        const newUser = new User({
            name,
            email,
            password : hashedPassword,
            role,
            promotedUntil,
            isIEEE,
            branch,
            year
        })

        await newUser.save()
        return res.status(202).json({message:"User created succesfully",newUser}) ///enjoy pandagow
    } catch (error) {
        return res.status(400).json({message:"Error"})
        console.log(error)
    }
}