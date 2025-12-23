const Contact = require('../models/Contact');

exports.createContact = async (req, res) => {
  try {
    const {
      firebaseUid,
      userType,
      organizationName,
      name,
      email,
      phone,
      queryType,
      message,
    } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'name, email and message are required' });
    }

    const contact = await Contact.create({
      firebaseUid,
      userType,
      organizationName,
      name,
      email,
      phone,
      queryType,
      message,
    });

    return res.status(201).json({ success: true, data: contact });
  } catch (err) {
    console.error('createContact error', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};
