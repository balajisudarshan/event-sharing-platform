const express = require('express');
const router = express.Router();
const { createRegistration, getRegistrations, getRegistrationById, deleteRegistration} = require('../controller/Registration.controller');
const verifyToken = require('../middleware/verifyToken');


router.post('/',verifyToken, createRegistration);
router.get('/', verifyToken, getRegistrations);
router.get('/:id', verifyToken, getRegistrationById);
router.delete('/:id', verifyToken, deleteRegistration);

module.exports = router;
