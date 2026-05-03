// Sample data extracted/derived from the live Pardonned site (April 2026 snapshot).
// Used to populate the redesign mockups. NOT a complete dataset.

window.PARDONNED = (function () {
  const ADMINS = [
    { id: 'trump-2', name: 'Donald J. Trump', term: 'Second Term', years: '2025–', party: 'R', count: 121, restitution: 1_350_000_000, sentenceMonths: 0, color: '#C23B22' },
    { id: 'biden',   name: 'Joseph R. Biden',   term: '',           years: '2021–2025', party: 'D', count: 257, restitution: 24_500_000,  sentenceMonths: 0, color: '#2A6A7A' },
    { id: 'trump-1', name: 'Donald J. Trump',   term: 'First Term',  years: '2017–2021', party: 'R', count: 238, restitution: 92_400_000,  sentenceMonths: 0, color: '#B8652A' },
    { id: 'obama-2', name: 'Barack H. Obama',   term: 'Second Term', years: '2013–2017', party: 'D', count: 1904, restitution: 4_800_000,  sentenceMonths: 0, color: '#3A6A4A' },
    { id: 'obama-1', name: 'Barack H. Obama',   term: 'First Term',  years: '2009–2013', party: 'D', count: 23,  restitution: 0,           sentenceMonths: 0, color: '#3A6A4A' },
    { id: 'bush-2',  name: 'George W. Bush',    term: 'Second Term', years: '2005–2009', party: 'R', count: 169, restitution: 1_200_000,   sentenceMonths: 0, color: '#6A4B7A' },
    { id: 'bush-1',  name: 'George W. Bush',    term: 'First Term',  years: '2001–2005', party: 'R', count: 31,  restitution: 200_000,     sentenceMonths: 0, color: '#6A4B7A' },
    { id: 'clinton-2', name: 'William J. Clinton', term: 'Second Term', years: '1997–2001', party: 'D', count: 406, restitution: 8_600_000, sentenceMonths: 0, color: '#8A6B1E' },
    { id: 'clinton-1', name: 'William J. Clinton', term: 'First Term',  years: '1993–1997', party: 'D', count: 56, restitution: 100_000,    sentenceMonths: 0, color: '#8A6B1E' },
  ];

  // Selected high-profile / illustrative grants
  const GRANTS = [
    { id: 'cz-zhao', name: 'Changpeng Zhao', president: 'trump-2', date: '2025-10-22', type: 'pardon', category: 'crypto', categoryLabel: 'Crypto & securities',
      offense: 'Failing to maintain effective anti-money laundering program at Binance', district: 'W.D. Wash.', sentence: '4 months', restitution: 0, fine: 50_000_000 },
    { id: 'tina-peters', name: 'Tina Peters', president: 'trump-2', date: '2025-12-05', type: 'pardon', category: 'other', categoryLabel: 'Other',
      offense: 'Election integrity-related conduct, 2020–2021', district: '—', sentence: 'N/A', restitution: 0, fine: 0 },
    { id: 'ross-ulbricht', name: 'Ross Ulbricht', president: 'trump-2', date: '2025-01-21', type: 'pardon', category: 'drug', categoryLabel: 'Drug offenses',
      offense: 'Operating Silk Road dark-net marketplace', district: 'S.D.N.Y.', sentence: 'Life', restitution: 183_000_000, fine: 0 },
    { id: 'trevor-milton', name: 'Trevor Milton', president: 'trump-2', date: '2025-03-28', type: 'pardon', category: 'fraud', categoryLabel: 'Financial fraud',
      offense: 'Securities fraud, wire fraud (Nikola Corp.)', district: 'S.D.N.Y.', sentence: '4 years', restitution: 680_000_000, fine: 1_000_000 },
    { id: 'devon-archer', name: 'Devon Archer', president: 'trump-2', date: '2025-03-26', type: 'pardon', category: 'fraud', categoryLabel: 'Financial fraud',
      offense: 'Securities fraud conspiracy (tribal bond scheme)', district: 'S.D.N.Y.', sentence: '12 months', restitution: 43_400_000, fine: 0 },
    { id: 'carlos-watson', name: 'Carlos Watson', president: 'trump-2', date: '2025-03-28', type: 'commutation', category: 'fraud', categoryLabel: 'Financial fraud',
      offense: 'Wire fraud, securities fraud (Ozy Media)', district: 'E.D.N.Y.', sentence: '116 months', restitution: 36_300_000, fine: 0 },
    { id: 'paul-walczak', name: 'Paul Walczak', president: 'trump-2', date: '2025-04-23', type: 'pardon', category: 'fraud', categoryLabel: 'Financial fraud',
      offense: 'Tax fraud, willful failure to pay over employment taxes', district: 'M.D. Fla.', sentence: '18 months', restitution: 4_400_000, fine: 0 },
    { id: 'j6-bulk', name: '~1,500 January 6 defendants', president: 'trump-2', date: '2025-01-20', type: 'pardon', category: 'j6', categoryLabel: 'January 6',
      offense: 'Various offenses related to January 6, 2021 Capitol breach', district: 'D.D.C.', sentence: 'varies', restitution: 2_900_000, fine: 0 },

    // Biden
    { id: 'hunter-biden', name: 'Hunter Biden', president: 'biden', date: '2024-12-01', type: 'pardon', category: 'other', categoryLabel: 'Other',
      offense: 'Federal firearm and tax convictions; broad clemency 2014–2024', district: 'D. Del.', sentence: 'Pre-sentence', restitution: 0, fine: 0 },
    { id: 'family-pardons', name: 'Biden family members', president: 'biden', date: '2025-01-20', type: 'pardon', category: 'other', categoryLabel: 'Other',
      offense: 'Preemptive pardons for potential federal offenses', district: '—', sentence: '—', restitution: 0, fine: 0 },
    { id: 'leonard-peltier', name: 'Leonard Peltier', president: 'biden', date: '2025-01-20', type: 'commutation', category: 'violent', categoryLabel: 'Violent crime',
      offense: 'Murder of two FBI agents (1975)', district: 'D.N.D.', sentence: '2 life terms', restitution: 0, fine: 0 },
    { id: 'death-row-37', name: '37 federal death-row inmates', president: 'biden', date: '2024-12-23', type: 'commutation', category: 'violent', categoryLabel: 'Violent crime',
      offense: 'Various capital offenses; commuted to life without parole', district: '—', sentence: 'Death → Life', restitution: 0, fine: 0 },
    { id: 'rita-crundwell', name: 'Rita Crundwell', president: 'biden', date: '2024-11-20', type: 'commutation', category: 'fraud', categoryLabel: 'Financial fraud',
      offense: 'Wire fraud, theft of government funds (Dixon, IL)', district: 'N.D. Ill.', sentence: '235 months', restitution: 53_700_000, fine: 0 },

    // Trump 1
    { id: 'roger-stone', name: 'Roger J. Stone Jr.', president: 'trump-1', date: '2020-12-23', type: 'pardon', category: 'political', categoryLabel: 'Political corruption',
      offense: 'Obstruction, false statements, witness tampering', district: 'D.D.C.', sentence: '40 months', restitution: 0, fine: 20_000 },
    { id: 'paul-manafort', name: 'Paul J. Manafort', president: 'trump-1', date: '2020-12-23', type: 'pardon', category: 'political', categoryLabel: 'Political corruption',
      offense: 'Tax fraud, bank fraud, FARA violations', district: 'E.D. Va.', sentence: '90 months', restitution: 24_800_000, fine: 50_000 },
    { id: 'michael-flynn', name: 'Michael T. Flynn', president: 'trump-1', date: '2020-11-25', type: 'pardon', category: 'political', categoryLabel: 'Political corruption',
      offense: 'False statements to federal investigators', district: 'D.D.C.', sentence: '0 (pre-sentence)', restitution: 0, fine: 0 },
    { id: 'jared-kushner-sr', name: 'Charles Kushner', president: 'trump-1', date: '2020-12-23', type: 'pardon', category: 'fraud', categoryLabel: 'Financial fraud',
      offense: 'Tax evasion, witness retaliation, false statements', district: 'D.N.J.', sentence: '24 months', restitution: 508_000, fine: 0 },
    { id: 'blackwater-4', name: 'Four Blackwater contractors', president: 'trump-1', date: '2020-12-22', type: 'pardon', category: 'violent', categoryLabel: 'Violent crime',
      offense: 'Manslaughter (Nisour Square, Iraq, 2007)', district: 'D.D.C.', sentence: '12–360 months', restitution: 0, fine: 0 },

    // Obama-2
    { id: 'chelsea-manning', name: 'Chelsea Manning', president: 'obama-2', date: '2017-01-17', type: 'commutation', category: 'other', categoryLabel: 'Other',
      offense: 'Espionage Act, theft, computer fraud', district: 'A.C.M.R.', sentence: '420 → 84 months', restitution: 0, fine: 0 },
    { id: 'oscar-lopez', name: 'Oscar López Rivera', president: 'obama-2', date: '2017-01-17', type: 'commutation', category: 'other', categoryLabel: 'Other',
      offense: 'Seditious conspiracy', district: 'N.D. Ill.', sentence: '660 → 480 months', restitution: 0, fine: 0 },
    { id: 'james-cartwright', name: 'James E. Cartwright', president: 'obama-2', date: '2017-01-17', type: 'pardon', category: 'other', categoryLabel: 'Other',
      offense: 'False statements (Stuxnet leak)', district: 'D.D.C.', sentence: 'Pre-sentence', restitution: 0, fine: 0 },

    // Bush-2
    { id: 'scooter-libby', name: 'I. Lewis "Scooter" Libby', president: 'bush-2', date: '2007-07-02', type: 'commutation', category: 'political', categoryLabel: 'Political corruption',
      offense: 'Obstruction, perjury, false statements (Plame leak)', district: 'D.D.C.', sentence: '30 months → 0', restitution: 0, fine: 250_000 },

    // Clinton-2
    { id: 'marc-rich', name: 'Marc Rich', president: 'clinton-2', date: '2001-01-20', type: 'pardon', category: 'fraud', categoryLabel: 'Financial fraud',
      offense: 'Tax evasion, racketeering, trading with Iran', district: 'S.D.N.Y.', sentence: 'Fugitive', restitution: 48_000_000, fine: 0 },
    { id: 'patty-hearst', name: 'Patricia Hearst', president: 'clinton-2', date: '2001-01-20', type: 'pardon', category: 'violent', categoryLabel: 'Violent crime',
      offense: 'Bank robbery (SLA)', district: 'N.D. Cal.', sentence: '84 months', restitution: 0, fine: 0 },
    { id: 'susan-mcdougal', name: 'Susan McDougal', president: 'clinton-2', date: '2001-01-20', type: 'pardon', category: 'political', categoryLabel: 'Political corruption',
      offense: 'Whitewater-related conspiracy', district: 'E.D. Ark.', sentence: '24 months', restitution: 0, fine: 0 },
  ];

  // Categories with counts
  const CATEGORIES = [
    { id: 'drug', label: 'Drug offenses', count: 2157, color: '#3A6A4A' },
    { id: 'other', label: 'Other', count: 532, color: '#7A7870' },
    { id: 'fraud', label: 'Financial fraud', count: 328, color: '#8A6B1E' },
    { id: 'violent', label: 'Violent crime', count: 89, color: '#6A2A2A' },
    { id: 'crypto', label: 'Crypto & securities', count: 55, color: '#2A6A7A' },
    { id: 'firearms', label: 'Firearms', count: 25, color: '#4A4030' },
    { id: 'face', label: 'FACE Act', count: 16, color: '#B8652A' },
    { id: 'political', label: 'Political corruption', count: 14, color: '#6A4B7A' },
    { id: 'j6', label: 'January 6', count: 12, color: '#C23B22' },
    { id: 'immigration', label: 'Immigration', count: 3, color: '#2A4A6A' },
  ];

  // Site-wide totals
  const TOTALS = {
    grants: 3205,
    presidents: 5,
    administrations: 9,
    restitution: 1_473_000_000, // sum across the database
    sinceYear: 1993,
    daysCovered: 12_000,
  };

  // Top restitution amounts (the leaderboard)
  const RESTITUTION_LEADERBOARD = GRANTS
    .filter(g => g.restitution > 0)
    .sort((a, b) => b.restitution - a.restitution)
    .slice(0, 12);

  // Helpers
  function formatMoney(n) {
    if (!n) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + n.toLocaleString();
  }
  function formatDate(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function formatDateLong(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function adminById(id) { return ADMINS.find(a => a.id === id); }

  return { ADMINS, GRANTS, CATEGORIES, TOTALS, RESTITUTION_LEADERBOARD,
           formatMoney, formatDate, formatDateLong, adminById };
})();
