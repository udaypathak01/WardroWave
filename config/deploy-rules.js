#!/usr/bin/env node

/**
 * Deploy Firestore Rules using Google Auth
 * Usage: node deploy-rules.js
 */

require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const projectId = process.env.FIREBASE_PROJECT_ID;
const rulesPath = path.join(__dirname, 'firestore.rules');

// Create credentials from environment variables
const credentials = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: 'key-id',
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: '123456789',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
};

(async () => {
  try {
    console.log('📝 Reading Firestore rules from:', rulesPath);
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    console.log('🔐 Authenticating with Google...');
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const { token } = await client.getAccessToken();

    console.log('🚀 Deploying Firestore rules to project:', projectId);

    // Step 1: Create a ruleset
    const createRulesetUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;

    const rulesetResponse = await axios.post(
      createRulesetUrl,
      {
        source: {
          files: [
            {
              name: 'firestore.rules',
              content: rulesContent,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rulesetName = rulesetResponse.data.name;
    console.log('✅ Ruleset created:', rulesetName);

    // Step 2: Release the ruleset
    console.log('📤 Releasing ruleset...');
    const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesetReleases`;

    const releaseResponse = await axios.post(
      releaseUrl,
      {
        rulesetName: rulesetName,
        releaseId: 'cloud.firestore',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Rules released successfully!');
    console.log('📌 Release name:', releaseResponse.data.name);
    console.log('\n✨ Firestore security rules are now active!');
    console.log('   Users can now upload to their virtual_closet subcollections.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to deploy rules:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
})();
