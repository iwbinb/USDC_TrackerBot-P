import { parseUnits } from '../src/amounts.js';
import { Watchlist } from '../src/watches.js';
import { summarizeBalances } from '../src/balances.js';
import { formatPayment, shouldNotify } from '../src/notifications.js';

// Fictional data for a local demonstration; no actual wallet is queried.
const fictionalAddress = `0x${'1'.repeat(40)}`;
const watches = new Watchlist();
watches.setNetwork(fictionalAddress, 'arc', true);
watches.setNetwork(fictionalAddress, 'base', true);
watches.setLabel(fictionalAddress, 'Demo wallet');

console.log('FICTIONAL DEMO — grouped networks');
console.log(JSON.stringify(watches.list(), null, 2));

const balance = summarizeBalances([
  { network: 'arc', amount: parseUnits('25.000000000000000001', 18), decimals: 18, confirmed: true },
  { network: 'base', amount: parseUnits('100.5', 6), decimals: 6, confirmed: true },
  { network: 'monad', confirmed: false },
]);
console.log(`\nConfirmed subtotal: ${balance.total} USDC (partial: ${balance.partial})`);

const payment = {
  network: 'arc',
  label: 'Demo wallet',
  direction: 'in',
  amount: parseUnits('125', 18),
  decimals: 18,
  confirmed: true,
};
if (shouldNotify(payment, { minimum: '10' })) {
  console.log(`\n${formatPayment(payment, 'en')}`);
  console.log(`\n${formatPayment(payment, 'zh')}`);
}
