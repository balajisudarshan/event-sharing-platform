const express = require('express')
const router = express.Router()
const {registerUser} = require('../controllers/userAuth.controller')
router.post('/register',registerUser)

module.exports = router