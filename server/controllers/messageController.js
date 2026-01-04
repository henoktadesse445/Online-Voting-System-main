const Contact = require("../models/Contact");
const { createEmailTransporter } = require("../utils/emailService");
const { Types } = require("mongoose");

exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) return res.json({ success: false, message: "All fields required" });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.json({ success: false, message: "Invalid email" });

        const newContact = new Contact({ name, email, message });
        await newContact.save();

        res.json({ success: true, message: "Message sent! We'll get back to you soon." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error sending message" });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, contacts });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching contacts" });
    }
};

exports.replyToContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;

        if (!replyMessage) return res.json({ success: false, message: "Reply required" });

        const contact = await Contact.findById(id);
        if (!contact) return res.status(404).json({ success: false, message: "Not found" });

        const transporter = await createEmailTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: contact.email,
            subject: `Re: Your message to Online Voting System`,
            html: `<p>Dear ${contact.name},</p><p>${replyMessage}</p>`
        });

        contact.status = "responded";
        await contact.save();

        res.json({ success: true, message: "Reply sent successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error sending reply" });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['new', 'read', 'responded'].includes(status)) return res.json({ success: false, message: "Invalid status" });

        const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true });
        if (!contact) return res.status(404).json({ success: false, message: "Not found" });

        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating status" });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

        const deleted = await Contact.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Not found" });

        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting" });
    }
};
