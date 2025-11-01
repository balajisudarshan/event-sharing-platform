const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const registerUser = async (req, res) => {
  const { name, email, password, role, promotedUntil, isIEEE,IEEE_ID, branch, year } = req.body;

  try {
    const isExistedUser = await User.findOne({ email }); //eyy donga
    if (isExistedUser) {
      return res.status(400).json({ message: "User already exist" }); // donga dorikadu login avvu
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
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
    return res.status(500).json({ message: "Error registering User",error:error.message });
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
      return res.status(401).json({ message: "Invalid password" })
    }
    const { password: _, ...userWithoutPassword } = user.toObject();
    const token = jwt.sign({ user: userWithoutPassword }, process.env.JWT_SECRET)

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    })
    return res.status(200).json({ message: "Login successful", user: userWithoutPassword, token: token })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" })
  }
}
const logoutUser = async (req, res) => {
  res.clearCookie('token')
  return res.status(200).json({ message: "Logout successful" })
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
module.exports = { registerUser, loginUser, logoutUser, getUserProfile };