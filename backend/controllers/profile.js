const Profile = require('../models/Profile');

// Upsert profile by firebaseUid
exports.upsertProfile = async (req, res) => {
  try {
    const { firebaseUid } = req.body?.basic || req.body; // accept either root or nested
    if (!firebaseUid) {
      return res.status(400).json({ success: false, error: 'firebaseUid is required' });
    }

    const payload = req.body;

    const profile = await Profile.findOneAndUpdate(
      { firebaseUid },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error('upsertProfile error', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get profile by firebaseUid
exports.getProfileByUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const profile = await Profile.findOne({ firebaseUid });
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error('getProfileByUid error', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};
