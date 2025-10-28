const express = require('express');

const router = express.Router()
const { registerUser ,loginUser,user} = require('../controller/UserAuth.controller');

router.post('/register',registerUser)
router.post('/login',loginUser)
router.get('/user',user)
module.exports = router;