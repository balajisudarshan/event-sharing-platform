const express = require('express')
const router = express.Router()
const {registerUser,loginUser,logoutUser,getUserProfile} = require('../controllers/userAuth.controller')
const AuthMiddleware = require('../middleware/Auth')
router.post('/register',registerUser)
router.post('/login',loginUser)
router.post('/logout',logoutUser)
router.get('/me',AuthMiddleware,getUserProfile)
module.exports = router