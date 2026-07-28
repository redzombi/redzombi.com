# Sentinel Network: OAuth 2.0 Security + Admin Dashboard

**Zombi-Auth integration complete.** The Sentinel Network now has
production-grade OAuth 2.0 with PKCE protection, a secure login flow, and
a gated admin dashboard monitoring 15 edge nodes across three geographic
clusters.

## 🔓 The Authentication Story

Sentinel Network manages critical infrastructure across **Terra, Orbital,
and Spectrum** arrays — you can't just let anyone in. We built a complete
OAuth 2.0 PKCE flow backed by Zombi-Auth.

### What We Deployed

#### oidc-client.js (300+ lines)

- Full OAuth 2.0 Authorization Code Flow + PKCE (RFC 7636)
- Token refresh logic with automatic expiration handling
- Secure code challenge generation & verification
- State parameter protection against CSRF

#### login.html

- Clean, professional OAuth consent page
- "Connecting to Zombi-Auth..." status messaging
- Client-side redirect handling (no server needed)

#### callback.html

- Authorization code exchange in ~50ms
- Automatic token storage in secure session storage
- Redirect to dashboard on success
- Error handling with user-friendly messages

#### deployment-dashboard.html (1350+ lines)

- Auth gate: Checks for valid token before rendering anything
- Bearer token injection into API requests
- Real-time status feeds from all 15 nodes
- 3-cluster view (Terra/Orbital/Spectrum arrays)

### Security Details 🔒

- **PKCE Protection:** Authorization code can't be stolen without the
  code verifier
- **Token TTL:** 1 hour access token, 7-day refresh token
- **State Validation:** CSRF protection built in
- **Secure Storage:** Tokens in `sessionStorage` (cleared on browser close)
- **Redirect URIs Locked:**
  - Staging: `http://localhost:8083/auth/callback.html`
  - Production: `https://sentinel.int.redzombi.com/auth/callback.html`

## 📊 The Admin Dashboard

Real-time monitoring of the entire edge infrastructure:

- **Node Health:** CPU, memory, disk usage across all 15 Raspberry Pis
- **Feed Status:** ADS-B/UAT receiver health and message rates
- **Uptime Tracking:** 24/7 monitoring with alerting
- **Emergency Override:** Manual controls for restarting services
- **Geographic View:** Terra, Orbital, and Spectrum clusters on a map

All protected by OAuth 2.0. No token = no access.

## 🧪 Testing & Validation

**Full E2E Test Suite:**

- PKCE flow validation (code challenge & verifier matching)
- Token refresh cycle
- Session expiration handling
- Dashboard state consistency
- Error recovery (network failures, auth timeouts)
- All 15 nodes validated in sequence

**Staging Environment:** Running on `localhost:8083` for pre-production
testing.

## 🚀 Production Status

- ✅ All OAuth endpoints functional
- ✅ Dashboard live at `https://sentinel.int.redzombi.com`
- ✅ Full test coverage (Phase 4 E2E)
- ✅ Disaster recovery procedures documented
- ✅ Monitoring & alerting configured

## 📚 Documentation

- **PHASE4_OIDC.md** — Complete OAuth 2.0 setup guide
- **TESTING.md** — 420+ lines of test procedures & scenarios
- **DEPLOYMENT.md** — Rollout & verification steps

## 🔜 What's Next

Phase 5: PostgreSQL backend for persistent audit logging. Every login,
every API call, every configuration change gets logged to a tamper-proof
audit trail. Full HIPAA/SOC2 compliance path starts there.

---

**Sentinel Network is now a production-grade system.** Full auth, full
monitoring, full documentation. Ready for enterprise deployment.
