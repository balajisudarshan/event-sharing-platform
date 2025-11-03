const fs = require("fs");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");


const registerForEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existing = await Registration.findOne({ event: eventId, user: userId });
    if (existing) return res.status(400).json({ message: "Already registered" });

    let paymentScreenshot = null;
    let status = "PENDING_PAYMENT";

    
    if (event.type === "IEEE" && req.user.isIEEE) {
      status = "REGISTERED";
    } else {
      if (!req.file) {
        return res.status(400).json({ message: "Payment screenshot required" });
      }

      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "event_payments",
      });

      paymentScreenshot = upload.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const registration = await Registration.create({
      event: eventId,
      user: userId,
      status,
      payment: {
        mode: paymentScreenshot ? "ONLINE" : "NONE",
        screenshotUrl: paymentScreenshot,
      },
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    res.status(201).json({
      message: "Registration successful",
      registration,
    });
  } catch (err) {
    console.error("❌ registerForEvent error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



const spotRegister = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existing = await Registration.findOne({ event: eventId, user: userId });
    if (existing) return res.status(400).json({ message: "Already registered" });

    // collector chedam anukunna kudarala
    const registration = await Registration.create({
      event: eventId,
      user: userId,
      status: "AWAITING_CONFIRMATION", 
      payment: { mode: "OFFLINE", screenshotUrl: null },
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    res.status(201).json({
      message: "Spot registration recorded successfully",
      registration,
    });
  } catch (err) {
    console.error("❌ spotRegister error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






const updateRegistrationStatus = async (req, res) => {
  try {
    const { regId } = req.params;
    const { status } = req.body;

    const valid = ["REGISTERED", "PENDING_PAYMENT", "AWAITING_CONFIRMATION"];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const registration = await Registration.findByIdAndUpdate(
      regId,
      { status },
      { new: true }
    );

    if (!registration)
      return res.status(404).json({ message: "Registration not found" });

    res.json({ message: "Status updated successfully", registration });
  } catch (err) {
    console.error(" updateRegistrationStatus error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




const cancelRegistration = async (req, res) => {
  try {
    const { id: eventId, userId } = req.params;

    const registration = await Registration.findOneAndDelete({
      event: eventId,
      user: userId,
    });

    if (!registration)
      return res.status(404).json({ message: "Registration not found" });

    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });

    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error("cancelRegistration error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



const getUserRegistrations = async (req, res) => {
  try {
    const { id: userId } = req.params;

    const registrations = await Registration.find({ user: userId })
      .populate("event", "title type startDate endDate location")
      .sort({ createdAt: -1 });

    res.json({ count: registrations.length, registrations });
  } catch (err) {
    console.error("getUserRegistrations error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  registerForEvent,
  spotRegister,
  updateRegistrationStatus,
  cancelRegistration,
  getUserRegistrations,
};