export interface TierInfo {
  tier: number;
  label: string;
  days: number;
  ratio: number;
}

export const TIER_DISPLAY: TierInfo[] = [
  { tier: 0, label: '1 Hour',   days: 0,    ratio: 1000 },
  { tier: 1, label: '30 Days',  days: 30,   ratio: 500  },
  { tier: 2, label: '90 Days',  days: 90,   ratio: 400  },
  { tier: 3, label: '180 Days', days: 180,  ratio: 350  },
  { tier: 4, label: '1 Year',   days: 365,  ratio: 300  },
  { tier: 5, label: '2 Years',  days: 730,  ratio: 275  },
  { tier: 6, label: '3 Years',  days: 1095, ratio: 250  },
  { tier: 7, label: '5 Years',  days: 1825, ratio: 225  },
  { tier: 8, label: '7 Years',  days: 2555, ratio: 212  },
  { tier: 9, label: '10 Years', days: 3650, ratio: 200  },
];
