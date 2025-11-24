const express = require('express')
const router = express.Router()
const {registerUser,loginUser,getUserProfile,promoteUser,checkAuth,getAllUsers} = require('../controllers/userAuth.controller')
const { AuthMiddleware,authorizeRoles } = require('../middleware/Auth')
const { authLimiter } = require('../middleware/rateLimiter');
router.post('/register',authLimiter, registerUser)
router.post('/login',authLimiter, loginUser)
router.get('/getAllUsers',AuthMiddleware,authorizeRoles("TEMP_ADMIN", "SUPER_ADMIN"),getAllUsers)
router.get('/check-auth',AuthMiddleware,checkAuth)
router.get('/me',AuthMiddleware,getUserProfile)
router.put('/promote/:role/:userId',AuthMiddleware,promoteUser)
module.exports = router