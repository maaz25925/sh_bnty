const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const blockchain = require('./lib/blockchain');
const tee = require('./lib/tee');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// In-memory storage for reports and payments
const reports = {};
const payments = [];

app.post('/api/submit', (req, res) => {
  const { title, description, severity, reporter } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'title and description required' });

  const reportId = uuidv4();
  const report = { reportId, title, description, severity: Number(severity || 0), reporter, timestamp: Date.now() };

  // Compute hash of report for blockchain record
  const hash = require('crypto').createHash('sha256').update(JSON.stringify(report)).digest('hex');

  // Store hash on blockchain
  const block = blockchain.addBlock({ reportId, hash, reporter });

  // Send to TEE for attestation
  const attestation = tee.attest(report);

  // If attested, simulate immediate payment (before company sees it)
  let paid = false;
  let payout = 0;
  if (attestation.payload.attested) {
    payout = Math.max(100, (report.severity || 1) * 100);
    payments.push({ reportId, to: reporter || 'unknown', amount: payout, timestamp: Date.now() });
    paid = true;
  }

  // Save report for company view (simulate forwarding after attestation)
  reports[reportId] = { report, hash, blockIndex: block.index, attestation, paid, payout };

  res.json({ reportId, hash, blockIndex: block.index, attestation: attestation.payload, signature: attestation.signature, paid, payout });
});

app.get('/api/report/:id', (req, res) => {
  const id = req.params.id;
  const r = reports[id];
  if (!r) return res.status(404).json({ error: 'not found' });
  res.json(r);
});

app.get('/api/company/reports', (req, res) => {
  // Company sees all reports (but in our flow payments may already be made if attested true)
  const list = Object.values(reports).map(r => ({ reportId: r.report.reportId, title: r.report.title, reporter: r.report.reporter, paid: r.paid, payout: r.payout, attestation: r.attestation.payload }));
  res.json(list);
});

app.get('/api/blockchain', (req, res) => {
  res.json(blockchain.getChain());
});

app.get('/api/tee/pubkey', (req, res) => {
  res.type('text').send(tee.publicKey);
});

app.post('/api/tee/verify', (req, res) => {
  const { payload, signature, pubkey } = req.body || {};
  if (!payload || !signature) return res.status(400).json({ error: 'payload and signature required' });
  try {
    const attestation = { payload, signature, pubkey };
    const ok = tee.verify(attestation);
    res.json({ ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payments', (req, res) => {
  res.json(payments);
});

app.listen(PORT, () => console.log(`BugBounty MVP server listening on http://localhost:${PORT}`));
