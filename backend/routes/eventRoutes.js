const express = require('express');

const router = express.Router()
const { createEvent, getEvents, getEventById, deleteEvent } = require('../controller/Event.controller');

router.post('/createEvent', createEvent);
router.get('/getAllEvents', getEvents);
router.get('/getEvent/:id', getEventById);
router.delete('/deleteEvent/:id', deleteEvent);
module.exports = router;