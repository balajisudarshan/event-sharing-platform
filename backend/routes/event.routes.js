const express = require("express");
const { upload } = require("../middleware/multer");
const router = express.Router();

const { AuthMiddleware, authorizeRoles } = require("../middleware/Auth");
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getEventRegistrations } = require("../controllers/event.controller");

router.get("/",AuthMiddleware, getEvents);

router.get("/:id", AuthMiddleware, getEventById);
router.post("/", AuthMiddleware,authorizeRoles("SUPER_ADMIN", "TEMP_ADMIN"), upload.fields([{ name: "thumbnail", maxCount: 1}, { name: "qrCode", maxCount: 1 }]) , createEvent);
router.put("/:id", AuthMiddleware, authorizeRoles("SUPER_ADMIN", "TEMP_ADMIN"), upload.fields([{ name: "thumbnail", maxCount: 1}, { name: "qrCode", maxCount: 1 }]) , updateEvent);
router.delete("/:id", AuthMiddleware, authorizeRoles("SUPER_ADMIN", "TEMP_ADMIN"), deleteEvent);
router.get("/:id/registrations", AuthMiddleware, getEventRegistrations);

module.exports = router;
