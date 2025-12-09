# BugBounty MVP

This is a minimal simulation of a bug bounty flow for a hackathon.

Features
- Hacker submits a bug via a form.
- The server computes a hash of the bug report and stores it on a simulated in-memory blockchain.
- The bug details are passed to a Trusted Execution Environment (TEE) simulator which produces a signed attestation.
- If the attestation is positive the hacker is paid immediately (simulated) before the company receives the report.

Run

1. Install dependencies:

```powershell
cd d:/hackathon/SIH2025_BugHuntr/sh_bnty
npm install
```

2. Start the server:

```powershell
npm start
```

3. Open the UI in your browser:

 - Hacker submit: http://localhost:3000/
 - Company view: http://localhost:3000/company.html
 - TEE view: http://localhost:3000/tee.html
 - Blockchain explorer: http://localhost:3000/explorer.html

Notes
- This is an MVP simulation: everything is in-memory and not secure for production.
- The TEE uses an RSA keypair generated at startup to sign attestations; you can verify signatures via `/api/tee/pubkey` and `/api/tee/verify`.
