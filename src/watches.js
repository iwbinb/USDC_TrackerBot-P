import { getNetwork, NETWORKS } from './networks.js';

export function normalizeAddress(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new TypeError('Use a 20-byte EVM address');
  }
  return value.toLowerCase();
}

export function normalizeLabel(value) {
  if (typeof value !== 'string') throw new TypeError('Use a text label');
  const label = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if ([...label].length > 32) throw new RangeError('Labels may contain up to 32 characters');
  return label;
}

export class Watchlist {
  #entries = new Map();
  #maxSlots;

  constructor(maxSlots = 5) {
    if (!Number.isSafeInteger(maxSlots) || maxSlots < 1) {
      throw new RangeError('The monitoring limit must be a positive integer');
    }
    this.#maxSlots = maxSlots;
  }

  get slots() {
    return [...this.#entries.values()].reduce((total, entry) => total + entry.networks.size, 0);
  }

  setNetwork(address, networkId, enabled) {
    const key = normalizeAddress(address);
    getNetwork(networkId);
    if (typeof enabled !== 'boolean') throw new TypeError('Use a boolean network selection');
    const entry = this.#entries.get(key);

    if (enabled) {
      if (entry?.networks.has(networkId)) return this.list();
      if (this.slots >= this.#maxSlots) throw new RangeError('Monitoring limit reached');
      const current = entry ?? { label: '', networks: new Set() };
      current.networks.add(networkId);
      this.#entries.set(key, current);
    } else if (entry) {
      entry.networks.delete(networkId);
      if (entry.networks.size === 0) this.#entries.delete(key);
    }
    return this.list();
  }

  setLabel(address, label) {
    const key = normalizeAddress(address);
    const cleaned = normalizeLabel(label);
    const entry = this.#entries.get(key);
    if (!entry) throw new RangeError('Add a monitored network first');
    entry.label = cleaned;
    return this.list();
  }

  list() {
    return [...this.#entries].map(([address, entry]) => ({
      address,
      label: entry.label,
      networks: NETWORKS.filter(network => entry.networks.has(network.id)).map(network => network.id),
    }));
  }
}
