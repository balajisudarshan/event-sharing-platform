const express = require('express')
const router = express.Router()
const {registerUser,loginUser,getUserProfile,promoteUser,checkAuth} = require('../controllers/userAuth.controller')
const { AuthMiddleware } = require('../middleware/Auth')
const { authLimiter } = require('../middleware/rateLimiter');
router.post('/register',authLimiter, registerUser)
router.post('/login',authLimiter, loginUser)
router.get('/check-auth',AuthMiddleware,checkAuth)
router.get('/me',AuthMiddleware,getUserProfile)
router.post('/promote/:role/:userId',AuthMiddleware,promoteUser)
module.exports = router