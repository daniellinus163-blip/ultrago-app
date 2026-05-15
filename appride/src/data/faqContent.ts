/** Static FAQ copy for Phase 6 Help — replace with CMS later if needed. */
export const FAQ_ITEMS = [
  {
    id: 'rides',
    q: 'How do I book a ride?',
    a: 'Open the Ride tab, set pickup and destination on the map, then confirm. You will see fare estimates before you book.',
  },
  {
    id: 'wallet',
    q: 'How does the wallet work?',
    a: 'Add a debit card or bank account under Pay. Rides and food orders require a saved method in Firebase before you can request or checkout. Live charges connect in a later phase.',
  },
  {
    id: 'driver',
    q: 'What is Driver mode?',
    a: 'Turn on Driver mode in Account to unlock the Drive tab. When you go offline or disable driver mode, your driver presence is cleared.',
  },
  {
    id: 'food',
    q: 'Can I reorder favorites?',
    a: 'Star restaurants in Food, then open Favorites from Account to jump back to those spots.',
  },
  {
    id: 'support',
    q: 'How do I contact support?',
    a: 'Use Help & support → Contact support to compose an email. We read every message.',
  },
] as const;
