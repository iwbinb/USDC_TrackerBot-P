import { formatUnits, readUnits, scaleUnits, validateDecimals } from './amounts.js';
import { getNetwork } from './networks.js';

/** Summarize one address, with at most one snapshot per network. */
export function summarizeBalances(snapshots) {
  if (!Array.isArray(snapshots)) throw new TypeError('Use an array of balance snapshots');
  const seen = new Set();
  const known = [];
  const missingNetworks = [];
  const networks = snapshots.map(snapshot => {
    const network = getNetwork(snapshot.network);
    if (seen.has(network.id)) throw new RangeError('Duplicate network snapshot');
    seen.add(network.id);
    if (typeof snapshot.confirmed !== 'boolean') throw new TypeError('Provide a confirmation flag');
    if (!snapshot.confirmed) {
      missingNetworks.push(network.id);
      return { network: network.id, name: network.name, amount: null, confirmed: false };
    }
    const decimals = validateDecimals(snapshot.decimals);
    const units = readUnits(snapshot.amount);
    if (units < 0n) throw new RangeError('Balances cannot be negative');
    known.push({ units, decimals });
    return { network: network.id, name: network.name, amount: formatUnits(units, decimals), confirmed: true };
  });

  const decimals = known.length ? Math.max(...known.map(item => item.decimals)) : null;
  const units = known.length
    ? known.reduce((total, item) => total + scaleUnits(item.units, item.decimals, decimals), 0n)
    : null;
  return {
    networks,
    total: units === null ? null : formatUnits(units, decimals),
    totalUnits: units === null ? null : units.toString(),
    decimals,
    partial: missingNetworks.length > 0,
    missingNetworks,
  };
}
