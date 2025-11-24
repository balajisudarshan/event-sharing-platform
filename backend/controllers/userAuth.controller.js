const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const registerUser = async (req, res) => {
  const { name, email, password, studentId, role, promotedUntil, isIEEE, IEEE_ID, branch, year } = req.body;

  try {
    const isExistedUser = await User.findOne({ $or: [{ email }, { studentId }] }); //eyy donga
    if (isExistedUser) {  
      return res.status(400).json({ message: "User already exist" }); // donga dorikadu login avvu
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      studentId,
      role,
      promotedUntil,
      isIEEE,
      IEEE_ID,
      branch,
      year
    });

    const { password: _, ...safeUser } = newUser.toObject();
    return res.status(201).json({ message: "User created successfully", user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error registering User", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" })
    }
    await User.findByIdAndUpdate(user._id,{isVerified:true},{runValidators:false})

    const updatedUser = await User.findById(user._id).select('-password')

    const token = jwt.sign({ user: updatedUser }, process.env.JWT_SECRET)

    
    return res.status(200).json({ message: "Login successful", user: updatedUser, token: token })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" })
  }
}


const getUserProfile = async (req, res) => {
  const user = req.user
  try {

   

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const { password: _, ...userWithoutPassword } = user.toObject();
    return res.status(200).json({ user: userWithoutPassword })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }



}


const promoteUser = async (req, res) => {
  const { role, userId } = req.params;
  const { until } = req.body;

  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let updateData = {};

    if (role === "USER") {
      updateData = { role: "USER", promotedUntil: null };
    } else if (role === "TEMP_ADMIN") {
      const untilDate = new Date(until);
      updateData = { role: "TEMP_ADMIN", promotedUntil: untilDate };
    } else if (role === "SUPER_ADMIN") {
      updateData = { role: "SUPER_ADMIN", promotedUntil: null };
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    await User.findByIdAndUpdate(userId, updateData,{isVerified:false},{ runValidators: false });

    return res.status(200).json({ message: `User updated to ${role}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




const checkAuth = async (req, res) => {
  try {
    const user = req.user
    if(!user){
      return res.status(401).json({loggedIn:false,message:"Unauthoried"})
    }

    const {password,...userWithoutPassword} = user.toObject()
    return res.status(200).json({loggedIn:true,user:userWithoutPassword})
  } catch (error) {
    console.error(error)
    return res.status(500).json({loggedIn:false,message:"Internal server error"})
  }

}


const getAllUsers = async(req,res)=>{
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 5

    const order = {
      SUPER_ADMIN :1,
      TEMP_ADMIN:2,
      USER:3
    }

    const skip = (page-1)*limit

    const users = await User.find().select('-password').skip(skip).limit(limit)
    // users = users.sort((a,b)=>order[a.role]-order[b.role])
    const total = await User.countDocuments()
    return res.status(200).json({users,total,page,pages:Math.ceil(total/limit)})
  } catch (error) {
    return res.status(500).json({message:"Internal Server Error"})
    console.log(error.message)
  }
}
module.exports = { registerUser, loginUser, getUserProfile, promoteUser, checkAuth,getAllUsers };
