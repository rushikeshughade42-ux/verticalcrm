import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your_firebase_api_key_placeholder",
  authDomain: "virtical-crm.firebaseapp.com",
  projectId: "virtical-crm",
  storageBucket: "virtical-crm.firebasestorage.app",
  messagingSenderId: "589681611248",
  appId: "1:589681611248:web:29473d27dcecfcd9708d35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🌱 Starting Firestore Seed process for project: virtical-crm...');

const profile = {
  id: 'usr-default-01',
  business_name: 'Apex Pro Home Services',
  owner_name: 'Rajesh Kumar',
  trade_type: 'Plumbing',
  google_review_url: 'https://maps.google.com/?cid=1234567890',
  created_at: new Date().toISOString(),
};

const customers = [
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

const jobs = [
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

const quotes = [
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

const invoices = [
  {
    id: 'inv-101',
    job_id: 'job-101',
    invoice_number: 'INV-2026-001',
    amount: 2150,
    payment_link: 'https://checkout.razorpay.com/pay/test_session_101',
    paid_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'inv-102',
    job_id: 'job-102',
    invoice_number: 'INV-2026-002',
    amount: 6650,
    payment_link: 'https://checkout.razorpay.com/pay/test_session_102',
    paid_at: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

async function seed() {
  try {
    // 1. Profile
    await setDoc(doc(db, 'profiles', profile.id), profile);
    console.log('✅ Seeded Profiles collection');

    // 2. Customers
    for (const c of customers) {
      await setDoc(doc(db, 'customers', c.id), c);
    }
    console.log('✅ Seeded Customers collection');

    // 3. Jobs
    for (const j of jobs) {
      await setDoc(doc(db, 'jobs', j.id), j);
    }
    console.log('✅ Seeded Jobs collection');

    // 4. Quotes
    for (const q of quotes) {
      await setDoc(doc(db, 'quotes', q.id), q);
    }
    console.log('✅ Seeded Quotes collection');

    // 5. Invoices
    for (const inv of invoices) {
      await setDoc(doc(db, 'invoices', inv.id), inv);
    }
    console.log('✅ Seeded Invoices collection');

    console.log('🎉 Firestore Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Firestore Seed error:', err);
    process.exit(1);
  }
}

seed();
