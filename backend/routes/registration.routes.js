const express = require("express");
const router = express.Router();
// const upload = require("../middleware/multer").upload;
const { AuthMiddleware, authorizeRoles } = require("../middleware/Auth");
const {
  registerForEvent,
  // spotRegister,
  updateRegistrationStatus,
  cancelRegistration,
  getUserRegistrations,
} = require("../controllers/registration.controller");

router.post(
  "/events/:id/register",
  AuthMiddleware,
  
  registerForEvent
);

// router.post(
//   "/events/:id/spot-register",
//   AuthMiddleware,
//   authorizeRoles("USER"),
//   spotRegister
// );

router.patch(
  "/:regId/status",
  AuthMiddleware,
  authorizeRoles("TEMP_ADMIN", "SUPER_ADMIN"),
  updateRegistrationStatus
);

router.delete(
  "/events/:id/registrations/:userId",
  AuthMiddleware,
  cancelRegistration
);

router.get("/users/:id/registrations", AuthMiddleware, getUserRegistrations);

module.exports = router;
