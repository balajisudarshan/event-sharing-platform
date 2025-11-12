const Event = require("../models/Event");
const Registration = require("../models/Registration");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const getEvents = async (req, res) => {
  try {
    const { type, upcoming, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }
    if (upcoming) {
      query.startDate = { $gte: new Date() };
    } else if (upcoming === "false") {
      query.startDate = { $lt: new Date() };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .select("title description type location startDate endDate organizer registeredCount")
        .populate("organizer", "name email")
        .lean(),
      Event.countDocuments(query),
    ]);

    res.status(200).json({
      data: events,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId)
      .select("title description type location startDate endDate organizer registeredCount")
      .populate("organizer", "name email");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ data: event });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, type, location, startDate, endDate, capacity,thumbnail,qrCode } = req.body;
    const organizer = req.user;

    let thumbnailUrl = null;
    let qrCodeUrl = null;

    if (req.files && req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail[0];
      const thumbnailResult = await cloudinary.uploader.upload(thumbnailFile.path, { folder: "event_thumbnails" });
      thumbnailUrl = thumbnailResult.secure_url;
      fs.unlinkSync(thumbnailFile.path);
    }
    if (req.files && req.files.qrCode) {
      const qrCodeFile = req.files.qrCode[0];
      const qrcoderesult = await cloudinary.uploader.upload(qrCodeFile.path, { folder: "event_qrcodes" });
      qrCodeUrl = qrcoderesult.secure_url;
      fs.unlinkSync(qrCodeFile.path);
    }

    if (
      !(
        organizer.role === "SUPER_ADMIN" ||
        (organizer.role === "TEMP_ADMIN" && organizer.promotedUntil > new Date())
      )
    ) {
      return res.status(403).json({ message: "Unauthorized to create event" });
    }

    if (!title || title.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Title is required and must be at least 3 characters long" });
    }

    if (!description || description.trim().length < 10) {
      return res
        .status(400)
        .json({ message: "Description is required and must be at least 10 characters long" });
    }

    if (!type || !["IEEE", "GENERAL", "FREE"].includes(type.toUpperCase())) {
      return res.status(400).json({ message: "Type must be 'IEEE', 'GENERAL', or 'FREE'" });
    }

    if (!location || location.trim().length < 3) {
      return res.status(400).json({ message: "Location is required" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Both startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (end <= start) {
      return res.status(400).json({ message: "endDate must be after startDate" });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }
    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      type: type.toUpperCase(),
      location: location.trim(),
      startDate: start,
      endDate: end,
      capacity: capacity || null,
      organizer: req.user._id,
      registeredCount: 0,
      thumbnailUrl,
      qrCodeUrl
    });

    return res.status(201).json({
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, description, type, location, startDate, endDate, capacity } = req.body;
    const user = req.user;

    if (
      !(
        user.role === "SUPER_ADMIN" ||
        (user.role === "TEMP_ADMIN" && user.promotedUntil > new Date())
      )
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this event" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (user.role === "TEMP_ADMIN" && event.organizer.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own events" });
    }

    if (title && title.trim().length < 3) {
      return res.status(400).json({ message: "Title must be at least 3 characters long" });
    }

    if (description && description.trim().length < 10) {
      return res
        .status(400)
        .json({ message: "Description must be at least 10 characters long" });
    }

    if (type && !["IEEE", "GENERAL", "FREE"].includes(type.toUpperCase())) {
      return res.status(400).json({ message: "Type must be 'IEEE', 'GENERAL', or 'FREE'" });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      if (end <= start) {
        return res.status(400).json({ message: "endDate must be after startDate" });
      }
      event.startDate = start;
      event.endDate = end;
    }

    if (title) event.title = title.trim();
    if (description) event.description = description.trim();
    if (type) event.type = type.toUpperCase();
    if (location) event.location = location.trim();
    if (capacity !== undefined) event.capacity = capacity;
    if (req.files && req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail[0];
      const thumbnailResult = await cloudinary.uploader.upload(thumbnailFile.path, { folder: "event_thumbnails" });
      event.thumbnail = thumbnailResult.secure_url;
      fs.unlinkSync(thumbnailFile.path);
    }
    if (req.files && req.files.qrCode) {
      const qrCodeFile = req.files.qrCode[0];
      const qrResult = await cloudinary.uploader.upload(qrCodeFile.path, { folder: "event_qrcodes" });
      event.qrCode = qrResult.secure_url;
      fs.unlinkSync(qrCodeFile.path);
    }

    await event.save();

    return res.status(200).json({
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const user = req.user;

    if (
      !(
        user.role === "SUPER_ADMIN" ||
        (user.role === "TEMP_ADMIN" && user.promotedUntil > new Date())
      )
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this event" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (user.role === "TEMP_ADMIN" && event.organizer.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }

    await Registration.deleteMany({ event: eventId });
    await Event.findByIdAndDelete(eventId);

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getEventRegistrations = async (req, res) => {
  try {
    const eventId = req.params.id;
    const user = req.user;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isOrganizer = event.organizer.toString() === user._id.toString();
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isTempAdmin = user.role === "TEMP_ADMIN";
    if (!isOrganizer && !isSuperAdmin && !isTempAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view these registrations" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const registrations = await Registration.find({ event: eventId })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Registration.countDocuments({ event: eventId });

    return res.status(200).json({
      data: registrations,
      meta: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
};
