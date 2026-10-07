export const NETWORKS = Object.freeze([
  { id: 'arc', name: 'Arc' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'base', name: 'Base' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'polygon', name: 'Polygon PoS' },
  { id: 'avalanche', name: 'Avalanche C-Chain' },
  { id: 'monad', name: 'Monad' },
].map(Object.freeze));

export function getNetwork(id) {
  const network = NETWORKS.find(item => item.id === id);
  if (!network) throw new RangeError('Unsupported network');
  return network;
}
