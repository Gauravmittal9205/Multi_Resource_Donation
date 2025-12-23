const axios = require('axios');

exports.nominatimSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) {
      return res.status(400).json({ success: false, error: 'q is required' });
    }

    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(10, rawLimit)) : 5;

    const resp = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q,
        format: 'json',
        addressdetails: 1,
        limit,
      },
      headers: {
        'User-Agent': 'Multi-Resource-Donation/1.0 (local-dev)',
        'Accept-Language': 'en',
      },
      timeout: 8000,
    });

    return res.json({ success: true, data: resp.data });
  } catch (err) {
    console.error('nominatimSearch error', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};
