const express = require('express');
const router = express.Router();
const {getEvents,getEventById,createEvent,deleteEvent} = require('../controller/Event.controller');

router.get('/events', getEvents);
router.get('/events/:id', getEventById);
router.post('/events', createEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;