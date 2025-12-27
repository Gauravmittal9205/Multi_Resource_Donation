const NgoProfile = require('../models/NgoProfile');
const asyncHandler = require('../middleware/async');

exports.getMyNgoProfile = asyncHandler(async (req, res) => {
  const firebaseUid = req.firebaseUid;
  const profile = await NgoProfile.findOne({ firebaseUid }).lean();
  if (!profile) {
    return res.status(200).json({ success: true, data: null });
  }
  return res.status(200).json({ success: true, data: profile });
});

exports.upsertMyNgoProfile = asyncHandler(async (req, res) => {
  const firebaseUid = req.firebaseUid;
  const payload = req.body || {};

  const updated = await NgoProfile.findOneAndUpdate(
    { firebaseUid },
    { $set: { ...payload, firebaseUid } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({ success: true, data: updated });
});
