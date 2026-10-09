'use client';

import {
  Profile,
  QuoteReferenceData,
  Customer,
  Job,
  Quote,
  Invoice,
  Review,
  TradeType,
  UploadedQuoteDoc,
  MaterialCostItem,
} from '@/types';
import {
  saveProfileFirestore,
  saveCustomerFirestore,
  deleteCustomerFirestore,
  saveJobFirestore,
  saveQuoteFirestore,
  saveInvoiceFirestore,
  saveReviewFirestore,
  saveQuoteReferenceDataFirestore,
  deleteQuoteReferenceDataFirestore,
} from '@/lib/firebase/db';

// Storage keys
const STORAGE_KEYS = {
  PROFILE: 'tradeflow_profile',
  QUOTE_DATA: 'tradeflow_quote_data',
  QUOTE_DOCS: 'tradeflow_quote_docs',
  CUSTOMERS: 'tradeflow_customers',
  DELETED_CUSTOMERS: 'tradeflow_deleted_customers',
  JOBS: 'tradeflow_jobs',
  QUOTES: 'tradeflow_quotes',
  INVOICES: 'tradeflow_invoices',
  REVIEWS: 'tradeflow_reviews',
};

// Initial Seed Profile
export const DEFAULT_PROFILE: Profile = {
  id: 'usr-default-01',
  business_name: 'Apex Pro Home Services',
  owner_name: 'Rajesh Kumar',
  trade_type: 'Plumbing',
  google_review_url: 'https://maps.google.com/?cid=1234567890',
  created_at: new Date().toISOString(),
};

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl && !envUrl.includes('trycloudflare.com') && !envUrl.includes('localhost') && envUrl.startsWith('http')) {
      return envUrl;
    }
    return window.location.origin;
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('trycloudflare.com')) {
    return envUrl;
  }
  return 'http://localhost:3000';
}

// Initial Service Pricing Knowledge Base per Trade (in INR / ₹)
export const DEFAULT_SERVICE_CATALOG: Record<TradeType, QuoteReferenceData[]> = {
  Plumbing: [
    {
      id: 'ref-p1',
      profile_id: 'usr-default-01',
      service_name: 'Emergency Pipe Leak Repair',
      base_labor_rate: 600,
      material_costs: [
        { id: 'm1', name: 'Copper Coupling & Soldering Kit', unit_cost: 350, unit: 'kit' },
        { id: 'm2', name: 'PEX Tubing (10ft)', unit_cost: 150, unit: 'section' },
      ],
      notes_for_ai: 'Standard emergency leak call out requires 1.5 hours labor + copper fitting materials.',
    },
    {
      id: 'ref-p2',
      profile_id: 'usr-default-01',
      service_name: 'Geyser / Water Heater Replacement & Disposal',
      base_labor_rate: 1500,
      material_costs: [
        { id: 'm3', name: '50L Storage Geyser Unit', unit_cost: 8500, unit: 'unit' },
        { id: 'm4', name: 'Pressure Relief Valve & Fittings', unit_cost: 650, unit: 'set' },
      ],
      notes_for_ai: 'Includes removal of old unit, installation of new high-efficiency water heater, and testing.',
    },
    {
      id: 'ref-p3',
      profile_id: 'usr-default-01',
      service_name: 'Drain Clearing & Main Line Hydrojet',
      base_labor_rate: 1200,
      material_costs: [
        { id: 'm5', name: 'Bio-Clean Treatment Solution', unit_cost: 350, unit: 'bottle' },
      ],
      notes_for_ai: 'Camera snake inspection included with main drain unclogging.',
    },
  ],
  Electrical: [
    {
      id: 'ref-e1',
      profile_id: 'usr-default-01',
      service_name: 'Electrical Distribution Board Upgrade (63A)',
      base_labor_rate: 2500,
      material_costs: [
        { id: 'me1', name: '63A Main MCB Distribution Box', unit_cost: 3500, unit: 'box' },
        { id: 'me2', name: 'Heavy Gauge Wire & Grounding Rod', unit_cost: 1500, unit: 'set' },
      ],
      notes_for_ai: 'Upgrades residential service panel to Indian IS standards with new grounding rod and circuit breakers.',
    },
    {
      id: 'ref-e2',
      profile_id: 'usr-default-01',
      service_name: 'EV Charger Installation (Level 2)',
      base_labor_rate: 2000,
      material_costs: [
        { id: 'me3', name: '32A Industrial Socket & Enclosure Box', unit_cost: 1200, unit: 'unit' },
        { id: 'me4', name: '6 sq mm Copper Armoured Cable (25ft)', unit_cost: 2200, unit: 'roll' },
      ],
      notes_for_ai: 'Dedicated 32A breaker line run from distribution board to charger location.',
    },
  ],
  'HVAC / Air Conditioning': [
    {
      id: 'ref-h1',
      profile_id: 'usr-default-01',
      service_name: 'AC Compressor Diagnosis & Gas Recharge',
      base_labor_rate: 800,
      material_costs: [
        { id: 'mh1', name: 'R-410A Refrigerant Gas (per kg)', unit_cost: 950, unit: 'kg' },
        { id: 'mh2', name: 'AC Run Capacitor Replacement', unit_cost: 450, unit: 'component' },
      ],
      notes_for_ai: 'Full diagnostics, coil cleaning, filter inspection, and top up of refrigerant.',
    },
    {
      id: 'ref-h2',
      profile_id: 'usr-default-01',
      service_name: 'Smart Thermostat / Remote Controller Setup & Duct Inspection',
      base_labor_rate: 750,
      material_costs: [
        { id: 'mh3', name: 'Mounting Bracket & Adapter Kit', unit_cost: 350, unit: 'kit' },
      ],
      notes_for_ai: 'Wire mapping, Wi-Fi pairing, and airflow balance inspection.',
    },
  ],
  Carpentry: [
    {
      id: 'ref-c1',
      profile_id: 'usr-default-01',
      service_name: 'Custom Hardwood Trim & Door Repair',
      base_labor_rate: 1200,
      material_costs: [
        { id: 'mc1', name: 'Teakwood Trim Molding (12ft)', unit_cost: 650, unit: 'piece' },
        { id: 'mc2', name: 'Wood Adhesive & Hardware Kit', unit_cost: 250, unit: 'box' },
      ],
      notes_for_ai: 'Precision miter cuts, installation, sanding, and primer coat.',
    },
  ],
  'Cleaning Services': [
    {
      id: 'ref-cl1',
      profile_id: 'usr-default-01',
      service_name: 'Deep HVAC & Home Sanitation Clean',
      base_labor_rate: 1800,
      material_costs: [
        { id: 'mcl1', name: 'Eco-Friendly Sanitizing Solution', unit_cost: 400, unit: 'jug' },
      ],
      notes_for_ai: 'Whole home multi-room deep cleaning and HEPA filtration treatment.',
    },
  ],
  'Home Technology': [
    {
      id: 'ref-t1',
      profile_id: 'usr-default-01',
      service_name: 'Smart Security Camera System Setup',
      base_labor_rate: 2500,
      material_costs: [
        { id: 'mt1', name: '4K Weatherproof PoE IP Cameras (4-Pack)', unit_cost: 12500, unit: 'pack' },
        { id: 'mt2', name: 'Cat6 Ethernet Spool & Connectors', unit_cost: 1500, unit: 'spool' },
      ],
      notes_for_ai: 'Exterior mounting, Ethernet cable drops, NVR setup, and mobile app sync.',
    },
  ],
};

// Default seed customers & jobs
const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-101',
    profile_id: 'usr-default-01',
    name: 'Priya Sharma',
    contact_no: '+91 98765 43210',
    email: 'priya.s@example.com',
    location: 'B-402, Green Glen Layout, Bellandur, Bengaluru',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'cust-102',
    profile_id: 'usr-default-01',
    name: 'Rajesh Patel',
    contact_no: '+91 98123 45678',
    email: 'rajesh.p@example.com',
    location: '12/A Park Street, Kolkata',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'cust-103',
    profile_id: 'usr-default-01',
    name: 'Amitabh Verma',
    contact_no: '+91 99001 12233',
    email: 'amitabh.v@example.com',
    location: '42 MG Road, Indiranagar, Bengaluru',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const SEED_JOBS: Job[] = [
  {
    id: 'job-101',
    profile_id: 'usr-default-01',
    customer_id: 'cust-101',
    title: 'Burst Copper Pipe & Water Damage Containment',
    problem: 'Kitchen sink pipe burst underneath cabinet causing water pool. Needs immediate copper pipe replacement and joint seal.',
    work_status: 'Done',
    payment_status: 'Paid',
    amount: 2150,
    date_of_work: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'job-102',
    profile_id: 'usr-default-01',
    customer_id: 'cust-102',
    title: 'Water Heater No Hot Water Diagnosis',
    problem: '50-Litre Geyser water heater indicator turns off continuously and unit emits squeaking sound. Needs new relief valve and inspection.',
    work_status: 'Scheduled',
    payment_status: 'Pending',
    amount: 6650,
    date_of_work: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'job-103',
    profile_id: 'usr-default-01',
    customer_id: 'cust-103',
    title: 'Main Line Drain Backup & Slow Drain',
    problem: 'Bathroom tub and toilet draining slowly with gurgling noises. Requires hydrojet drain clearing.',
    work_status: 'Quoted',
    payment_status: 'Pending',
    amount: 1550,
    date_of_work: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const SEED_QUOTES: Quote[] = [
  {
    id: 'q-101',
    job_id: 'job-101',
    line_items: [
      { id: 'li-1', description: 'Emergency Pipe Leak Repair Labor', quantity: 1.5, unit_price: 600, total: 900, type: 'labor' },
      { id: 'li-2', description: 'Copper Coupling & Soldering Kit', quantity: 2, unit_price: 350, total: 700, type: 'material' },
      { id: 'li-3', description: 'PEX Tubing (10ft)', quantity: 1, unit_price: 150, total: 150, type: 'material' },
      { id: 'li-4', description: 'Emergency Call-Out Fee', quantity: 1, unit_price: 400, total: 400, type: 'fee' },
    ],
    total_amount: 2150,
    public_token: 'qtok-101-priya-sharma',
    is_accepted: true,
    status: 'Accepted',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'q-102',
    job_id: 'job-102',
    line_items: [
      { id: 'li-5', description: 'Water Heater Replacement Labor', quantity: 1, unit_price: 1500, total: 1500, type: 'labor' },
      { id: 'li-6', description: '50-Litre Storage Geyser Unit', quantity: 1, unit_price: 4500, total: 4500, type: 'material' },
      { id: 'li-7', description: 'Pressure Relief Valve & Fittings', quantity: 1, unit_price: 650, total: 650, type: 'material' },
    ],
    total_amount: 6650,
    public_token: 'qtok-102-rajesh-patel',
    is_accepted: true,
    status: 'Accepted',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'q-103',
    job_id: 'job-103',
    line_items: [
      { id: 'li-8', description: 'Drain Clearing & Main Line Hydrojet', quantity: 1, unit_price: 1200, total: 1200, type: 'labor' },
      { id: 'li-9', description: 'Bio-Clean Treatment Solution', quantity: 1, unit_price: 350, total: 350, type: 'material' },
    ],
    total_amount: 1550,
    public_token: 'qtok-103-amitabh-verma',
    is_accepted: false,
    status: 'Sent',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    job_id: 'job-101',
    invoice_number: 'INV-2026-001',
    amount: 2150,
    payment_link: '/invoice/inv-101',
    paid_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'inv-102',
    job_id: 'job-102',
    invoice_number: 'INV-2026-002',
    amount: 6650,
    payment_link: '/invoice/inv-102',
    paid_at: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-101',
    job_id: 'job-101',
    review_token: 'revtok-101-sarah',
    rating: 5,
    feedback_text: 'Alex was incredibly fast, professional, and saved our kitchen from major water damage!',
    status: 'Completed',
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rev-102',
    job_id: 'job-102',
    review_token: 'revtok-102-john',
    rating: null,
    feedback_text: null,
    status: 'Pending',
    is_public: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Helper to check environment in client
function isBrowser() {
  return typeof window !== 'undefined';
}

// Storage Helpers with Auto-Init
export function getStoredData<T>(key: string, seed: T): T {
  if (!isBrowser()) return seed;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

export function setStoredData<T>(key: string, data: T): T {
  if (isBrowser()) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  return data;
}

// PROFILE
export function getLocalProfile(): Profile {
  return getStoredData(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
}

export function updateLocalProfile(profile: Partial<Profile>): Profile {
  const current = getLocalProfile();
  const updated = { ...current, ...profile };
  setStoredData(STORAGE_KEYS.PROFILE, updated);
  saveProfileFirestore(updated);
  return updated;
}

// QUOTE REFERENCE DATA
export function getLocalQuoteReferenceData(): QuoteReferenceData[] {
  const profile = getLocalProfile();
  const defaultList = DEFAULT_SERVICE_CATALOG[profile.trade_type] || DEFAULT_SERVICE_CATALOG.Plumbing;
  const rawList = getStoredData(STORAGE_KEYS.QUOTE_DATA, defaultList);

  return rawList.map((item) => {
    if (!item.material_costs || item.material_costs.length === 0) return item;

    const cleanedMaterials: MaterialCostItem[] = [];
    item.material_costs.forEach((m, idx) => {
      if (m.unit_cost > 100000 || m.name.includes(';') || m.name.includes('—') || m.name.includes('₹')) {
        const parts = m.name.split(/;|\n/).map((p) => p.trim()).filter(Boolean);
        parts.forEach((part, pIdx) => {
          let cost = 0;
          let name = part;
          const match = part.match(/(?:[—–\-:\(]\s*(?:₹|Rs\.?)?\s*([0-9.]+)|(?:₹|Rs\.?)\s*([0-9.]+))/i);
          if (match) {
            cost = Number(match[1] || match[2]) || 0;
            name = part.replace(match[0], '').replace(/[\(\)\—–\-:]/g, '').trim();
          } else {
            const numMatch = part.match(/([0-9.]+)\s*$/);
            if (numMatch) {
              cost = Number(numMatch[1]) || 0;
              name = part.replace(numMatch[0], '').replace(/[\(\)\—–\-:]/g, '').trim();
            }
          }
          if (!name) name = part.trim();
          if (cost > 100000) cost = 250;

          cleanedMaterials.push({
            id: `m-clean-${idx}-${pIdx}`,
            name,
            unit_cost: cost,
            unit: 'item',
          });
        });
      } else {
        cleanedMaterials.push(m);
      }
    });

    return {
      ...item,
      material_costs: cleanedMaterials,
    };
  });
}

export function saveLocalQuoteReferenceData(item: QuoteReferenceData): QuoteReferenceData[] {
  const current = getLocalQuoteReferenceData();
  const index = current.findIndex((i) => i.id === item.id);
  let updated: QuoteReferenceData[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = item;
  } else {
    updated = [item, ...current];
  }
  setStoredData(STORAGE_KEYS.QUOTE_DATA, updated);
  saveQuoteReferenceDataFirestore(item);
  return updated;
}

export function deleteLocalQuoteReferenceData(id: string): QuoteReferenceData[] {
  const current = getLocalQuoteReferenceData();
  const updated = current.filter((i) => i.id !== id);
  setStoredData(STORAGE_KEYS.QUOTE_DATA, updated);
  deleteQuoteReferenceDataFirestore(id);
  return updated;
}

// UPLOADED QUOTE DOCUMENTS (PDF / Excel Knowledge Base)
export function getLocalQuoteDocuments(): UploadedQuoteDoc[] {
  return getStoredData(STORAGE_KEYS.QUOTE_DOCS, []);
}

export function saveLocalQuoteDocument(docItem: UploadedQuoteDoc): UploadedQuoteDoc[] {
  const current = getLocalQuoteDocuments();
  const updated = [docItem, ...current.filter((d) => d.id !== docItem.id)];
  setStoredData(STORAGE_KEYS.QUOTE_DOCS, updated);
  return updated;
}

export function deleteLocalQuoteDocument(id: string): UploadedQuoteDoc[] {
  const current = getLocalQuoteDocuments();
  const updated = current.filter((d) => d.id !== id);
  setStoredData(STORAGE_KEYS.QUOTE_DOCS, updated);
  return updated;
}

// CUSTOMERS
export function getLocalCustomers(): Customer[] {
  return getStoredData(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
}

export function getDeletedCustomers(): (Customer & { deleted_at?: string })[] {
  return getStoredData(STORAGE_KEYS.DELETED_CUSTOMERS, []);
}

export function addLocalCustomer(cust: Omit<Customer, 'id' | 'created_at' | 'profile_id'>): Customer {
  const customers = getLocalCustomers();
  const profile = getLocalProfile();
  const newCust: Customer = {
    ...cust,
    id: `cust-${Date.now()}`,
    profile_id: profile.id,
    created_at: new Date().toISOString(),
  };
  setStoredData(STORAGE_KEYS.CUSTOMERS, [newCust, ...customers]);
  saveCustomerFirestore(newCust);
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('tradeflow_customer_updated'));
  }
  return newCust;
}

export function deleteLocalCustomer(id: string): Customer | null {
  const customers = getLocalCustomers();
  const targetIndex = customers.findIndex((c) => c.id === id);
  if (targetIndex === -1) return null;

  const targetCustomer = customers[targetIndex];
  const updatedCustomers = customers.filter((c) => c.id !== id);
  setStoredData(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
  deleteCustomerFirestore(id);

  const deletedList = getDeletedCustomers();
  const deletedItem = { ...targetCustomer, deleted_at: new Date().toISOString() };
  setStoredData(STORAGE_KEYS.DELETED_CUSTOMERS, [deletedItem, ...deletedList.filter((c) => c.id !== id)]);

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('tradeflow_customer_updated', { detail: { deletedId: id } }));
  }

  return targetCustomer;
}

export function restoreLocalCustomer(target: string | Customer): Customer | null {
  const deletedList = getDeletedCustomers();
  const customers = getLocalCustomers();

  let customerToRestore: Customer | null = null;

  if (typeof target === 'string') {
    const foundInDeleted = deletedList.find((c) => c.id === target);
    if (foundInDeleted) {
      const { deleted_at, ...cleanCust } = foundInDeleted;
      customerToRestore = cleanCust;
    }
  } else {
    customerToRestore = target;
  }

  if (!customerToRestore) return null;

  // Remove from deleted list
  const updatedDeleted = deletedList.filter((c) => c.id !== customerToRestore!.id);
  setStoredData(STORAGE_KEYS.DELETED_CUSTOMERS, updatedDeleted);

  // Restore to active list if not already present
  if (!customers.some((c) => c.id === customerToRestore!.id)) {
    setStoredData(STORAGE_KEYS.CUSTOMERS, [customerToRestore, ...customers]);
  }

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('tradeflow_customer_updated', { detail: { restoredId: customerToRestore.id } }));
  }

  return customerToRestore;
}

export function permanentlyDeleteCustomer(id: string): void {
  const deletedList = getDeletedCustomers();
  const updatedDeleted = deletedList.filter((c) => c.id !== id);
  setStoredData(STORAGE_KEYS.DELETED_CUSTOMERS, updatedDeleted);

  // Clean up associated jobs, quotes, invoices, reviews for this customer permanently
  const jobs = getLocalJobs();
  const jobsToDelete = jobs.filter((j) => j.customer_id === id);
  const remainingJobs = jobs.filter((j) => j.customer_id !== id);
  setStoredData(STORAGE_KEYS.JOBS, remainingJobs);

  const jobIdsToDelete = new Set(jobsToDelete.map((j) => j.id));

  const quotes = getLocalQuotes();
  setStoredData(STORAGE_KEYS.QUOTES, quotes.filter((q) => !jobIdsToDelete.has(q.job_id)));

  const invoices = getLocalInvoices();
  setStoredData(STORAGE_KEYS.INVOICES, invoices.filter((i) => !jobIdsToDelete.has(i.job_id)));

  const reviews = getLocalReviews();
  setStoredData(STORAGE_KEYS.REVIEWS, reviews.filter((r) => !jobIdsToDelete.has(r.job_id)));

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('tradeflow_customer_updated'));
  }
}


// JOBS
export function getLocalJobs(): Job[] {
  return getStoredData(STORAGE_KEYS.JOBS, SEED_JOBS);
}

export function createLocalJob(jobData: Omit<Job, 'id' | 'created_at' | 'profile_id'>): Job {
  const jobs = getLocalJobs();
  const profile = getLocalProfile();
  const newJob: Job = {
    ...jobData,
    id: `job-${Date.now()}`,
    profile_id: profile.id,
    created_at: new Date().toISOString(),
  };
  setStoredData(STORAGE_KEYS.JOBS, [newJob, ...jobs]);
  saveJobFirestore(newJob);
  return newJob;
}

export function updateLocalJobStatus(
  jobId: string,
  updates: Partial<Pick<Job, 'work_status' | 'payment_status' | 'date_of_work' | 'amount'>>
): Job | null {
  const jobs = getLocalJobs();
  const index = jobs.findIndex((j) => j.id === jobId);
  if (index === -1) return null;
  const updatedJob = { ...jobs[index], ...updates };
  jobs[index] = updatedJob;
  setStoredData(STORAGE_KEYS.JOBS, [...jobs]);
  return updatedJob;
}

// QUOTES
export function getLocalQuotes(): Quote[] {
  return getStoredData(STORAGE_KEYS.QUOTES, SEED_QUOTES);
}

export function getQuoteByJobId(jobId: string): Quote | null {
  const quotes = getLocalQuotes();
  return quotes.find((q) => q.job_id === jobId) || null;
}

export function getQuoteByToken(token: string): Quote | null {
  const quotes = getLocalQuotes();
  return quotes.find((q) => q.public_token === token || q.id === token) || null;
}

export function saveLocalQuote(quote: Omit<Quote, 'id' | 'created_at' | 'public_token'> & { id?: string; public_token?: string }): Quote {
  const quotes = getLocalQuotes();
  const id = quote.id || `q-${Date.now()}`;
  const public_token = quote.public_token || `qtok-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newQuote: Quote = {
    ...quote,
    id,
    public_token,
    created_at: quote.id ? (quotes.find((q) => q.id === quote.id)?.created_at || new Date().toISOString()) : new Date().toISOString(),
  };

  const existingIdx = quotes.findIndex((q) => q.id === id || q.job_id === quote.job_id);
  let updatedQuotes: Quote[];
  if (existingIdx >= 0) {
    updatedQuotes = [...quotes];
    updatedQuotes[existingIdx] = newQuote;
  } else {
    updatedQuotes = [newQuote, ...quotes];
  }

  setStoredData(STORAGE_KEYS.QUOTES, updatedQuotes);
  saveQuoteFirestore(newQuote);

  // Update job amount and status if needed
  updateLocalJobStatus(quote.job_id, {
    amount: quote.total_amount,
    work_status: quote.is_accepted ? 'Scheduled' : 'Quoted',
  });

  // Automatically keep existing invoice amount in sync with quote total amount
  const existingInvoices = getLocalInvoices();
  const existingInv = existingInvoices.find((i) => i.job_id === quote.job_id);
  if (existingInv) {
    saveLocalInvoice(quote.job_id, quote.total_amount);
  }

  return newQuote;
}

// INVOICES
export function getLocalInvoices(): Invoice[] {
  const invoices: Invoice[] = getStoredData(STORAGE_KEYS.INVOICES, SEED_INVOICES);
  const baseUrl = getAppBaseUrl();
  let modified = false;

  const cleaned = invoices.map((inv) => {
    if (
      !inv.payment_link ||
      inv.payment_link.includes('checkout.razorpay.com') ||
      inv.payment_link.includes('trycloudflare.com') ||
      inv.payment_link.startsWith('/')
    ) {
      modified = true;
      return {
        ...inv,
        payment_link: `${baseUrl}/invoice/${inv.id}`,
      };
    }
    return inv;
  });

  if (modified) {
    setStoredData(STORAGE_KEYS.INVOICES, cleaned);
  }

  return cleaned;
}

export function getInvoiceByJobId(jobId: string): Invoice | null {
  const invoices = getLocalInvoices();
  return invoices.find((inv) => inv.job_id === jobId) || null;
}

export function saveLocalInvoice(jobId: string, amount: number): Invoice {
  const invoices = getLocalInvoices();
  const existing = invoices.find((inv) => inv.job_id === jobId);
  const baseUrl = getAppBaseUrl();

  if (existing) {
    const paymentLink = `${baseUrl}/invoice/${existing.id}`;
    const updated = { ...existing, amount, payment_link: paymentLink };
    const updatedInvoices = invoices.map((inv) => (inv.id === existing.id ? updated : inv));
    setStoredData(STORAGE_KEYS.INVOICES, updatedInvoices);
    return updated;
  }

  const invoiceId = jobId.startsWith('job-')
    ? jobId.replace('job-', 'inv-')
    : `inv-${jobId}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
  const paymentLink = `${baseUrl}/invoice/${invoiceId}`;

  const newInvoice: Invoice = {
    id: invoiceId,
    job_id: jobId,
    invoice_number: invoiceNumber,
    amount,
    payment_link: paymentLink,
    paid_at: null,
    created_at: new Date().toISOString(),
  };

  setStoredData(STORAGE_KEYS.INVOICES, [newInvoice, ...invoices]);
  saveInvoiceFirestore(newInvoice);
  updateLocalJobStatus(jobId, { payment_status: 'Pending' });

  return newInvoice;
}

export function markInvoicePaid(jobId: string): { invoice: Invoice; review: Review } | null {
  const invoices = getLocalInvoices();
  const invIdx = invoices.findIndex((i) => i.job_id === jobId);
  if (invIdx === -1) return null;

  const now = new Date().toISOString();
  invoices[invIdx].paid_at = now;
  setStoredData(STORAGE_KEYS.INVOICES, [...invoices]);

  // Update job payment status
  updateLocalJobStatus(jobId, { payment_status: 'Paid', work_status: 'Done' });

  // Generate or get Review token
  const reviews = getLocalReviews();
  let review = reviews.find((r) => r.job_id === jobId);
  if (!review) {
    const reviewToken = `revtok-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    review = {
      id: `rev-${Date.now()}`,
      job_id: jobId,
      review_token: reviewToken,
      status: 'Pending',
      is_public: false,
      created_at: now,
    };
    setStoredData(STORAGE_KEYS.REVIEWS, [review, ...reviews]);
  }

  return { invoice: invoices[invIdx], review };
}

// REVIEWS
export function getLocalReviews(): Review[] {
  return getStoredData(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
}

export function getOrCreateReviewForJob(jobId: string): Review {
  const reviews = getLocalReviews();
  let review = reviews.find(
    (r) =>
      r.job_id === jobId ||
      (r.review_token && r.review_token.includes(jobId.replace('job-', '')))
  );
  if (!review) {
    const safeJobId = jobId.includes('job-') ? jobId : `job-${jobId}`;
    const reviewToken = `revtok-${safeJobId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    review = {
      id: `rev-${Date.now()}`,
      job_id: jobId,
      review_token: reviewToken,
      status: 'Pending',
      is_public: false,
      created_at: new Date().toISOString(),
    };
    setStoredData(STORAGE_KEYS.REVIEWS, [review, ...reviews]);
    saveReviewFirestore(review);
  }
  return review;
}

export function getReviewByToken(token: string): Review | null {
  if (!token) return null;
  const reviews = getLocalReviews();
  const found = reviews.find((r) => r.review_token === token || r.id === token);
  if (found) return found;

  const jobs = getLocalJobs();
  const matchedJob = jobs.find((j) => token.includes(j.id) || token.includes(j.id.replace('job-', '')));
  let extractedJobId = matchedJob ? matchedJob.id : 'job-public';
  if (extractedJobId === 'job-public' && token.includes('job-')) {
    const match = token.match(/(job-[0-9a-zA-Z-]+)/);
    if (match && match[1]) {
      extractedJobId = match[1];
    }
  }

  const fallbackReview: Review = {
    id: `rev-${Date.now()}`,
    job_id: extractedJobId,
    review_token: token,
    status: 'Pending',
    is_public: false,
    created_at: new Date().toISOString(),
  };
  setStoredData(STORAGE_KEYS.REVIEWS, [fallbackReview, ...reviews]);
  saveReviewFirestore(fallbackReview);
  return fallbackReview;
}

export function submitLocalReview(
  token: string,
  rating: number,
  feedbackText?: string
): Review | null {
  const reviews = getLocalReviews();
  let rIdx = reviews.findIndex((r) => r.review_token === token || r.id === token);

  const isPublic = rating >= 4;
  let targetReview: Review;

  const jobs = getLocalJobs();
  const matchedJob = jobs.find((j) => token.includes(j.id) || token.includes(j.id.replace('job-', '')));
  let extractedJobId = matchedJob ? matchedJob.id : 'job-public';
  if (extractedJobId === 'job-public' && token.includes('job-')) {
    const match = token.match(/(job-[0-9a-zA-Z-]+)/);
    if (match && match[1]) {
      extractedJobId = match[1];
    }
  }
  if (extractedJobId === 'job-public' && jobs.length > 0) {
    const customJob = jobs.find((j) => !['cust-101', 'cust-102', 'cust-103'].includes(j.customer_id));
    if (customJob) {
      extractedJobId = customJob.id;
    } else {
      extractedJobId = jobs[jobs.length - 1].id;
    }
  }

  if (rIdx >= 0) {
    targetReview = {
      ...reviews[rIdx],
      job_id: reviews[rIdx].job_id && reviews[rIdx].job_id !== 'job-public' ? reviews[rIdx].job_id : extractedJobId,
      rating,
      feedback_text: feedbackText || null,
      status: 'Completed',
      is_public: isPublic,
    };
    reviews[rIdx] = targetReview;
  } else {
    targetReview = {
      id: `rev-${Date.now()}`,
      job_id: extractedJobId,
      review_token: token,
      rating,
      feedback_text: feedbackText || null,
      status: 'Completed',
      is_public: isPublic,
      created_at: new Date().toISOString(),
    };
    reviews.unshift(targetReview);
  }

  setStoredData(STORAGE_KEYS.REVIEWS, [...reviews]);
  saveReviewFirestore(targetReview);

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('tradeflow_customer_updated', { detail: { reviewId: targetReview.id } }));
    window.dispatchEvent(new CustomEvent('tradeflow_review_updated', { detail: { reviewId: targetReview.id } }));
  }
  return targetReview;
}
