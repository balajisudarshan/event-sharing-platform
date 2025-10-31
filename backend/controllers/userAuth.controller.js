const User = require('../models/User');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  const { name, email, password, role, promotedUntil, isIEEE, branch, year } = req.body;

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
      branch,
      year
    });

    const { password: _, ...safeUser } = newUser.toObject();
    return res.status(201).json({ message: "User created successfully", user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { registerUser };