import { formatUnits, parseUnits, readUnits, validateDecimals } from './amounts.js';
import { getNetwork } from './networks.js';
import { normalizeLabel } from './watches.js';

function paymentAmount(event) {
  if (!['in', 'out'].includes(event.direction)) throw new TypeError('Use an incoming or outgoing payment');
  validateDecimals(event.decimals);
  const units = readUnits(event.amount);
  if (units < 0n) throw new RangeError('Payment amounts cannot be negative');
  return units;
}

export function shouldNotify(event, settings = {}) {
  if (event.confirmed !== true) return false;
  const units = paymentAmount(event);
  const enabled = event.direction === 'in' ? settings.incoming ?? true : settings.outgoing ?? true;
  if (typeof enabled !== 'boolean') throw new TypeError('Alert settings must be boolean');
  const minimum = parseUnits(settings.minimum ?? '0', event.decimals);
  return enabled && units > 0n && units >= minimum;
}

export function formatPayment(event, language = 'en') {
  if (event.confirmed !== true) throw new RangeError('Only confirmed payments can be formatted');
  if (!['en', 'zh'].includes(language)) throw new RangeError('Unsupported language');
  const amount = formatUnits(paymentAmount(event), event.decimals);
  const network = getNetwork(event.network);
  const label = normalizeLabel(event.label ?? '');
  const action = language === 'zh'
    ? (event.direction === 'in' ? '收到' : '转出')
    : (event.direction === 'in' ? 'Received' : 'Sent');
  const status = language === 'zh' ? '已确认' : 'Confirmed';
  return `${action} ${amount} USDC\n${network.name}${label ? ` · ${label}` : ''}\n${status}`;
}
