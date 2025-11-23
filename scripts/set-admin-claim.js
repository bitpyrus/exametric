#!/usr/bin/env node
// Usage:
// GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node scripts/set-admin-claim.js admin@exametric.com 123456

const admin = require('firebase-admin');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/set-admin-claim.js <email> <password>');
    process.exit(1);
  }

  const [email, password] = args;

  // Initialize admin SDK using GOOGLE_APPLICATION_CREDENTIALS or default ADC
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
    });
  } catch (e) {
    console.error('Failed to initialize firebase-admin. Make sure GOOGLE_APPLICATION_CREDENTIALS is set to a service account JSON file.');
    console.error(e);
    process.exit(1);
  }

  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('Found existing user:', userRecord.uid);
    } catch (err) {
      // If user not found, create it
      if (err.code === 'auth/user-not-found' || err.code === 'USER_NOT_FOUND') {
        console.log('User not found, creating user with provided password...');
        userRecord = await admin.auth().createUser({
          email,
          password,
          emailVerified: false,
        });
        console.log('Created user:', userRecord.uid);
      } else {
        throw err;
      }
    }

    // Set custom claim 'admin'
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Set admin claim for user ${email} (uid: ${userRecord.uid})`);

    // Also write a user profile entry to Realtime Database for client-side fallback
    try {
      const db = admin.database();
      await db.ref(`users/${userRecord.uid}`).set({
        role: 'admin',
        email,
      });
      console.log('Wrote users/{uid} role=admin in Realtime Database');
    } catch (dbErr) {
      console.warn('Failed to write role to Realtime Database:', dbErr);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error setting admin claim:', err);
    process.exit(2);
  }
}

main();
