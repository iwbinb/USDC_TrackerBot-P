import test from 'node:test';
import assert from 'node:assert/strict';
import { formatUnits, parseUnits, readUnits, scaleUnits } from '../src/amounts.js';
import { Watchlist } from '../src/watches.js';
import { summarizeBalances } from '../src/balances.js';
import { formatPayment, shouldNotify } from '../src/notifications.js';

// These are synthetic fixtures, not monitored wallet data.
const addressA = `0x${'1'.repeat(40)}`;
const addressB = `0x${'2'.repeat(40)}`;
const payment = { network: 'base', direction: 'in', amount: '10000001', decimals: 6, confirmed: true, label: 'Demo wallet' };

test('amounts retain digits beyond floating-point precision', () => {
  const decimal = '9007199254740993.000001';
  assert.equal(formatUnits(parseUnits(decimal)), decimal);
  assert.equal(formatUnits(parseUnits('0.000000000000000001', 18), 18), '0.000000000000000001');
  assert.equal(formatUnits('-1', 18), '-0.000000000000000001');
  assert.equal(formatUnits(0n), '0');
});

test('amount validation rejects floating-point and ambiguous inputs', () => {
  for (const value of ['1e6', '01', '-1', 'NaN', '1.0000001']) assert.throws(() => parseUnits(value));
  assert.throws(() => parseUnits(1.5));
  assert.throws(() => readUnits(9007199254740993));
  assert.throws(() => formatUnits('1', 19));
  assert.equal(parseUnits('10', 0), 10n);
});

test('precision conversion never silently discards fractional units', () => {
  assert.equal(scaleUnits('1000001', 6, 18), 1000001000000000000n);
  assert.equal(scaleUnits('1000001000000000000', 18, 6), 1000001n);
  assert.throws(() => scaleUnits('1000001000000000001', 18, 6));
});

test('one address retains multiple networks without duplicate slots', () => {
  const watches = new Watchlist(2);
  watches.setNetwork(addressA, 'base', true);
  watches.setNetwork(addressA, 'arc', true);
  watches.setNetwork(addressA, 'base', true);
  watches.setLabel(addressA, 'Demo wallet');
  assert.equal(watches.slots, 2);
  assert.deepEqual(watches.list(), [{ address: addressA, label: 'Demo wallet', networks: ['arc', 'base'] }]);
  assert.throws(() => watches.setNetwork(addressB, 'base', true));
  assert.equal(watches.slots, 2);
  watches.setNetwork(addressA, 'base', false);
  watches.setNetwork(addressB, 'monad', true);
  assert.equal(watches.slots, 2);
});

test('watch selections validate input and expose copies of internal state', () => {
  const watches = new Watchlist();
  const mixedCaseAddress = `0x${'Ab'.repeat(20)}`;
  watches.setNetwork(mixedCaseAddress, 'base', true);
  const copy = watches.list();
  assert.equal(copy[0].address, mixedCaseAddress.toLowerCase());
  copy[0].networks.push('arc');
  assert.equal(watches.slots, 1);
  assert.throws(() => watches.setNetwork('invalid', 'base', true));
  assert.throws(() => watches.setNetwork(addressA, 'unsupported', true));
  assert.throws(() => watches.setNetwork(addressA, 'base', 'yes'));
  watches.setNetwork(mixedCaseAddress, 'base', false);
  assert.deepEqual(watches.list(), []);
});

test('confirmed balances use a common precision and preserve unknown networks', () => {
  const result = summarizeBalances([
    { network: 'arc', amount: '1', decimals: 18, confirmed: true },
    { network: 'base', amount: '1000001', decimals: 6, confirmed: true },
    { network: 'monad', confirmed: false },
  ]);
  assert.equal(result.total, '1.000001000000000001');
  assert.equal(result.totalUnits, '1000001000000000001');
  assert.equal(result.partial, true);
  assert.equal(result.networks[2].amount, null);
  assert.deepEqual(result.missingNetworks, ['monad']);
});

test('missing balances do not become zero and duplicate snapshots cannot inflate totals', () => {
  assert.equal(summarizeBalances([{ network: 'base', confirmed: false }]).total, null);
  assert.equal(summarizeBalances([]).total, null);
  const row = { network: 'base', amount: '1', decimals: 6, confirmed: true };
  assert.throws(() => summarizeBalances([row, row]));
  assert.throws(() => summarizeBalances([{ ...row, amount: '-1' }]));
});

test('alerts respect confirmation, exact thresholds, direction switches, and zero amounts', () => {
  assert.equal(shouldNotify(payment, { minimum: '10.000001' }), true);
  assert.equal(shouldNotify(payment, { minimum: '10.000002' }), false);
  assert.equal(shouldNotify(payment, { incoming: false }), false);
  assert.equal(shouldNotify({ ...payment, direction: 'out' }, { outgoing: false }), false);
  assert.equal(shouldNotify({ ...payment, confirmed: false }), false);
  assert.equal(shouldNotify({ ...payment, amount: '0' }), false);
  assert.throws(() => shouldNotify(payment, { minimum: 10 }));
});

test('payment messages remain three lines in both languages', () => {
  assert.equal(formatPayment(payment), 'Received 10.000001 USDC\nBase · Demo wallet\nConfirmed');
  assert.equal(formatPayment({ ...payment, direction: 'out' }, 'zh'), '转出 10.000001 USDC\nBase · Demo wallet\n已确认');
  assert.equal(formatPayment({ ...payment, label: 'Demo\nwallet' }).split('\n').length, 3);
  assert.throws(() => formatPayment({ ...payment, confirmed: false }));
});
