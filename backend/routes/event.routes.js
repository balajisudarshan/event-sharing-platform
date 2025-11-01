const express = require("express");
const router = express.Router();

const AuthMiddleware = require("../middleware/Auth");
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getEventRegistrations } = require("../controllers/event.controller");
//Waiting for auth middleware
router.get("/", AuthMiddleware, getEvents);
router.get("/:id", AuthMiddleware, getEventById);
router.post("/", AuthMiddleware, createEvent);
router.put("/:id", AuthMiddleware, updateEvent);
router.delete("/:id", AuthMiddleware, deleteEvent);
router.get("/:id/registrations", AuthMiddleware, getEventRegistrations);

module.exports = router;
