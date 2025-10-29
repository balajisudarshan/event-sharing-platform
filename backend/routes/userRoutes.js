const express = require('express');
const verifyToken = require('../middleware/verifyToken')
const router = express.Router()
const { registerUser ,loginUser,user,promoteToAdmin} = require('../controller/UserAuth.controller');

router.post('/register',registerUser)
router.post('/login',loginUser)
router.get('/user',user)
router.post('/promoteToAdmin/:id',verifyToken,promoteToAdmin)
module.exports = router;