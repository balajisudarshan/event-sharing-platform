const Registration = require("../models/Registration");
const Event = require("../models/Event");

const createRegistration = async (req, res) => {
  const { eventId } = req.params
  try {
    const { ieeeId, paymentScreenshot } = req.body;
    const userId = req.user.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const now = new Date();

    if (event.deadLine && now > new Date(event.deadLine)) {
      return res
        .status(400)
        .json({ message: "Registration Period for this event expired" });
    }

    const existing = await Registration.findOne({ eventId, userId });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Already Registered for this event" });
    }

    const isIEEEEvent = event.eventType?.toLowerCase() === "ieee";

    if (isIEEEEvent) {
      if (!ieeeId && !paymentScreenshot) {
        return res.status(400).json({
          message:
            "Please provide IEEE ID or payment screenshot for IEEE events.",
        });
      }
    } else {
      if (!paymentScreenshot) {
        return res.status(400).json({
          message: "Please provide payment screenshot for non-IEEE events.",
        });
      }
    }
    const registration = await Registration.create({
      eventId,
      userId,
      ieeeId: ieeeId || null,
      paymentScreenshot: paymentScreenshot || null,
    });
    res.status(201).json({
      success: true,
      message:
        isIEEEEvent && ieeeId
          ? "Registered successfully using IEEE ID (Free entry)"
          : "Registration successful waiting for payment verification",
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getRegistrations = async (req, res) => {
  const { eventId } = req.params

  try {
    const registrations = await Registration.find({eventId}).populate('eventId')
    if(!registrations || registrations.length === 0){
      return res.status(404).json({message:"No registrations found for this event"})
    }
    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id).populate('eventId').populate('userId');
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findByIdAndDelete(id);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json({ message: "Registration deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  deleteRegistration
};
