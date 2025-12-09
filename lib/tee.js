const crypto = require('crypto');

// TEE simulator - creates an RSA keypair and signs attestations
class TEESimulator {
  constructor() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.log = [];
  }

  // Simple deterministic attestation logic: mark true if severity >=6 or description contains 'exploit'
  evaluateReport(report) {
    const severity = report.severity || 0;
    const desc = (report.description || '').toLowerCase();
    const score = severity + (desc.includes('exploit') ? 2 : 0);
    const attested = score >= 6;
    return { attested, score };
  }

  attest(report) {
    const { attested, score } = this.evaluateReport(report);
    const payload = {
      reportId: report.reportId,
      attested,
      score,
      timestamp: Date.now()
    };
    const payloadStr = JSON.stringify(payload);
    const sign = crypto.createSign('SHA256');
    sign.update(payloadStr);
    sign.end();
    const signature = sign.sign(this.privateKey, 'base64');
    const attestation = { payload, signature, pubkey: this.publicKey };
    this.log.push(attestation);
    return attestation;
  }

  verify(attestation) {
    const verify = crypto.createVerify('SHA256');
    const payloadStr = JSON.stringify(attestation.payload);
    verify.update(payloadStr);
    verify.end();
    return verify.verify(attestation.pubkey || this.publicKey, attestation.signature, 'base64');
  }
}

module.exports = new TEESimulator();
