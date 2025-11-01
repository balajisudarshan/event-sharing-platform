const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const registerUser = async (req, res) => {
  const { name, email, password, role, promotedUntil, isIEEE, IEEE_ID, branch, year } = req.body;

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


const promoteUser = async (req, res) => {
  const { role, userId } = req.params;
  const {  until } = req.body;

  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let untilDate;
    if (role === 'TEMP_ADMIN') {
      if (!until) {
        return res.status(400).json({ message: "Until date is required for TEMP_ADMIN" });
      }
      untilDate = new Date(until);
      if (isNaN(untilDate)) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      if (untilDate <= new Date()) {
        return res.status(400).json({ message: "Until date must be in the future" });
      }
      if (untilDate > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        return res.status(400).json({ message: "Until date must be within 30 days" });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role === 'TEMP_ADMIN' && user.role === 'TEMP_ADMIN') {
      return res.status(400).json({ message: "User is already a TEMP_ADMIN" });
    }
    if (role === 'TEMP_ADMIN' && user.role === 'SUPER_ADMIN') {
      return res.status(400).json({ message: "User is already a SUPER_ADMIN" });
    }

    if (role === 'TEMP_ADMIN' && user.role === 'USER') {
      user.role = 'TEMP_ADMIN';
      user.promotedUntil = untilDate;
    } else if (role === 'SUPER_ADMIN') {
      if (user.role === 'SUPER_ADMIN') {
        return res.status(400).json({ message: "User is already a SUPER_ADMIN" });
      }
      user.role = 'SUPER_ADMIN';
      user.promotedUntil = null;
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    await user.save();
    return res.status(200).json({ message: `User promoted to ${user.role}` });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { registerUser, loginUser, logoutUser, getUserProfile, promoteUser };
