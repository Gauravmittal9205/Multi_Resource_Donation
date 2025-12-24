const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const defaultServiceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

  if (serviceAccountPath || fs.existsSync(defaultServiceAccountPath)) {
    const effectivePath = serviceAccountPath || defaultServiceAccountPath;
    const absolutePath = path.isAbsolute(effectivePath)
      ? effectivePath
      : path.join(__dirname, '..', effectivePath);
    const raw = fs.readFileSync(absolutePath, 'utf8');
    const serviceAccount = JSON.parse(raw);

    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || '';
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
  }
}

module.exports = admin;
