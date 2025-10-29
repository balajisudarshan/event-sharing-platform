const Event = require('../models/Event');

const createEvent = async(req, res) => {
    try {
        const newEvent = new Event(req.body);
        const existingEvent = await Event.findOne({ title: newEvent.title });
        if (existingEvent) {
            return res.status(400).json({ message: 'Event already exists' });
        }
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: 'Error creating event' });
    }
}

const getEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events' });
    }
}

const getEventById = async (req, res) => {
    try {
        const id  = req.params.id;
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event' });
    }
}

const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(204).json(deletedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event' });
    }
}

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    deleteEvent
};