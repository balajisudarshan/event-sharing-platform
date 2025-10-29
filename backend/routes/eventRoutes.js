const express = require('express');
const router = express.Router();
const {getEvents,getEventById,createEvent,deleteEvent} = require('../controller/Event.controller');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', createEvent);
router.delete('/:id', deleteEvent);

module.exports = router;