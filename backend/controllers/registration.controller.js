// const fs = require("fs");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
// const cloudinary = require("../config/cloudinary");


const registerForEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.capacity && event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }
    
    const existing = await Registration.findOne({ event: eventId, user: userId });
    
    if (existing) return res.status(400).json({ message: "Already registered" });
    
    const { payment_transaction_id } = req.body || {};
    let status = "AWAITING_CONFIRMATION";

    if (event.type === "FREE") {
      status = "REGISTERED";
    }
    else if (event.type === "IEEE") {
      if (req.user.isIEEE) {
        status = "REGISTERED";
      }
      else{
        if (!payment_transaction_id) {
          return res.status(400).json({ message: "Payment id required for non-IEEE members" });
        }
        status = "AWAITING_CONFIRMATION";
      }
    } 
    else {
      if (!payment_transaction_id) {
        return res.status(400).json({ message: "Payment id required" });
      }

      status = "AWAITING_CONFIRMATION";
      
    }

    const registration = await Registration.create({
      event: eventId,
      user: userId,
      status,
      payment_transaction_id: payment_transaction_id || undefined,
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    res.status(201).json({
      message: "Registration successful",
      registration,
    });
  } catch (err) {
    console.error("registerForEvent error:", err);
    
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// const spotRegister = async (req, res) => {
//   try {
//     const { id: eventId } = req.params;
//     const userId = req.user._id;

//     const event = await Event.findById(eventId);
//     if (!event) return res.status(404).json({ message: "Event not found" });

//     const existing = await Registration.findOne({ event: eventId, user: userId });
//     if (existing) return res.status(400).json({ message: "Already registered" });

//     // collector chedam anukunna kudarala
//     const registration = await Registration.create({
//       event: eventId,
//       user: userId,
//       status: "AWAITING_CONFIRMATION", 
//       payment: { mode: "OFFLINE", screenshotUrl: null },
//     });

//     await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

//     res.status(201).json({
//       message: "Spot registration recorded successfully",
//       registration,
//     });
//   } catch (err) {
//     console.error("❌ spotRegister error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };






const updateRegistrationStatus = async (req, res) => {
  try {
    const { regId } = req.params;
    const { status } = req.body;

    const valid = ["REGISTERED", "AWAITING_CONFIRMATION"];
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
    if (req.user._id.toString() !== userId && req.user.role !== "SUPER_ADMIN" && req.user.role !== "TEMP_ADMIN") {
      return res.status(403).json({ message: "Forbidden - Cannot cancel for other users" });
    }

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
    if (userId !== req.user._id.toString() && 
        req.user.role !== 'SUPER_ADMIN' && 
        req.user.role !== 'TEMP_ADMIN') {
      return res.status(403).json({ message: "Forbidden" });
    }

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
  // spotRegister,
  updateRegistrationStatus,
  cancelRegistration,
  getUserRegistrations,
};