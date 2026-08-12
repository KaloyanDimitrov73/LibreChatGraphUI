const OAuth2Strategy = require('passport-oauth2');
const passport = require('passport');
const fetch = require('node-fetch');

const ORCID_BASE = process.env.ORCID_BASE || 'https://orcid.org';
const CLIENT_ID = process.env.ORCID_CLIENT_ID;
const CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET;
const CALLBACK_URL = process.env.ORCID_CALLBACK_URL || '/auth/orcid/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('ORCID_CLIENT_ID/ORCID_CLIENT_SECRET not set — ORCID login disabled until configured.');
}

class OrcidStrategy extends OAuth2Strategy {
  userProfile(accessToken, done) {
    // ORCID: GET /v3.0/{orcid}/person using token; but standard approach is fetch /v3.0/ / or use /oauth/userinfo
    // We'll attempt /oauth/userinfo (works in ORCID public API when allowed)
    fetch(`${ORCID_BASE}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json())
      .then((profile) => {
        // profile typically contains: sub (orcid), name claims, email
        const normalized = {
          provider: 'orcid',
          id: profile.sub || profile.orcid,
          displayName: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
          emails: profile.email ? [{ value: profile.email }] : [],
          _raw: profile,
        };
        done(null, normalized);
      })
      .catch((err) => done(err));
  }
}

function setupOrcid(passportInstance) {
  if (!CLIENT_ID || !CLIENT_SECRET) return;
  passportInstance.use('orcid', new OrcidStrategy({
    authorizationURL: `${ORCID_BASE}/oauth/authorize`,
    tokenURL: `${ORCID_BASE}/oauth/token`,
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: 'openid email', // adapt scopes as needed
  }, (accessToken, refreshToken, profile, done) => {
    // profile normalized by userProfile above
    done(null, profile);
  }));
}

module.exports = { setupOrcid };
