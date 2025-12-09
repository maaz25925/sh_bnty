const crypto = require('crypto');

class SimpleChain {
  constructor() {
    this.chain = [];
    this.createGenesis();
  }

  createGenesis() {
    const genesis = {
      index: 0,
      timestamp: Date.now(),
      data: 'genesis',
      prevHash: '0',
      hash: this.hashBlock(0, Date.now(), 'genesis', '0')
    };
    this.chain.push(genesis);
  }

  hashBlock(index, timestamp, data, prevHash) {
    const str = `${index}|${timestamp}|${JSON.stringify(data)}|${prevHash}`;
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  addBlock(data) {
    const prev = this.chain[this.chain.length - 1];
    const index = prev.index + 1;
    const timestamp = Date.now();
    const hash = this.hashBlock(index, timestamp, data, prev.hash);
    const block = { index, timestamp, data, prevHash: prev.hash, hash };
    this.chain.push(block);
    return block;
  }

  getChain() {
    return this.chain;
  }
}

module.exports = new SimpleChain();
