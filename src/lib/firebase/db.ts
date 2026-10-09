import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import {
  Profile,
  QuoteReferenceData,
  Customer,
  Job,
  Quote,
  Invoice,
  Review,
} from '@/types';

// Collection Constants
export const COLLECTIONS = {
  PROFILES: 'profiles',
  QUOTE_REFERENCE_DATA: 'quote_reference_data',
  CUSTOMERS: 'customers',
  JOBS: 'jobs',
  QUOTES: 'quotes',
  INVOICES: 'invoices',
  REVIEWS: 'reviews',
};

// PROFILE FIRESTORE HELPERS
export async function getProfileFirestore(profileId: string): Promise<Profile | null> {
  try {
    const docRef = doc(db, COLLECTIONS.PROFILES, profileId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Profile;
    }
    return null;
  } catch (err) {
    console.warn('Firestore getProfile error:', err);
    return null;
  }
}

export async function saveProfileFirestore(profile: Profile): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROFILES, profile.id);
    await setDoc(docRef, profile, { merge: true });
  } catch (err) {
    console.warn('Firestore saveProfile error:', err);
  }
}

// CUSTOMERS FIRESTORE HELPERS
export async function getCustomersFirestore(profileId?: string): Promise<Customer[]> {
  try {
    const ref = collection(db, COLLECTIONS.CUSTOMERS);
    const q = profileId ? query(ref, where('profile_id', '==', profileId)) : ref;
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Customer);
  } catch (err) {
    console.warn('Firestore getCustomers error:', err);
    return [];
  }
}

export async function saveCustomerFirestore(customer: Customer): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customer.id);
    await setDoc(docRef, customer, { merge: true });
  } catch (err) {
    console.warn('Firestore saveCustomer error:', err);
  }
}

export async function deleteCustomerFirestore(customerId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteCustomer error:', err);
  }
}

export function subscribeCustomersFirestore(
  callback: (customers: Customer[]) => void,
  profileId?: string
): Unsubscribe {
  const ref = collection(db, COLLECTIONS.CUSTOMERS);
  const q = profileId ? query(ref, where('profile_id', '==', profileId)) : ref;
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Customer);
      callback(list);
    },
    (err) => console.warn('Subscribe customers error:', err)
  );
}

// JOBS FIRESTORE HELPERS
export async function getJobsFirestore(profileId?: string): Promise<Job[]> {
  try {
    const ref = collection(db, COLLECTIONS.JOBS);
    const q = profileId ? query(ref, where('profile_id', '==', profileId)) : ref;
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Job);
  } catch (err) {
    console.warn('Firestore getJobs error:', err);
    return [];
  }
}

export async function saveJobFirestore(job: Job): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.JOBS, job.id);
    await setDoc(docRef, job, { merge: true });
  } catch (err) {
    console.warn('Firestore saveJob error:', err);
  }
}

export function subscribeJobsFirestore(
  callback: (jobs: Job[]) => void,
  profileId?: string
): Unsubscribe {
  const ref = collection(db, COLLECTIONS.JOBS);
  const q = profileId ? query(ref, where('profile_id', '==', profileId)) : ref;
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Job);
      callback(list);
    },
    (err) => console.warn('Subscribe jobs error:', err)
  );
}

// QUOTES FIRESTORE HELPERS
export async function getQuotesFirestore(): Promise<Quote[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.QUOTES));
    return snap.docs.map((d) => d.data() as Quote);
  } catch (err) {
    console.warn('Firestore getQuotes error:', err);
    return [];
  }
}

export async function saveQuoteFirestore(quote: Quote): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.QUOTES, quote.id);
    await setDoc(docRef, quote, { merge: true });
  } catch (err) {
    console.warn('Firestore saveQuote error:', err);
  }
}

export function subscribeQuotesFirestore(callback: (quotes: Quote[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.QUOTES),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Quote);
      callback(list);
    },
    (err) => console.warn('Subscribe quotes error:', err)
  );
}

// INVOICES FIRESTORE HELPERS
export async function getInvoicesFirestore(): Promise<Invoice[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.INVOICES));
    return snap.docs.map((d) => d.data() as Invoice);
  } catch (err) {
    console.warn('Firestore getInvoices error:', err);
    return [];
  }
}

export async function saveInvoiceFirestore(invoice: Invoice): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICES, invoice.id);
    await setDoc(docRef, invoice, { merge: true });
  } catch (err) {
    console.warn('Firestore saveInvoice error:', err);
  }
}

export function subscribeInvoicesFirestore(callback: (invoices: Invoice[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.INVOICES),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Invoice);
      callback(list);
    },
    (err) => console.warn('Subscribe invoices error:', err)
  );
}

// REVIEWS FIRESTORE HELPERS
export async function getReviewsFirestore(): Promise<Review[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.REVIEWS));
    return snap.docs.map((d) => d.data() as Review);
  } catch (err) {
    console.warn('Firestore getReviews error:', err);
    return [];
  }
}

export async function saveReviewFirestore(review: Review): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.REVIEWS, review.id);
    await setDoc(docRef, review, { merge: true });
  } catch (err) {
    console.warn('Firestore saveReview error:', err);
  }
}

export function subscribeReviewsFirestore(callback: (reviews: Review[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.REVIEWS),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Review);
      callback(list);
    },
    (err) => console.warn('Subscribe reviews error:', err)
  );
}

// QUOTE REFERENCE DATA FIRESTORE HELPERS
export async function getQuoteReferenceDataFirestore(profileId?: string): Promise<QuoteReferenceData[]> {
  try {
    const ref = collection(db, COLLECTIONS.QUOTE_REFERENCE_DATA);
    const q = profileId ? query(ref, where('profile_id', '==', profileId)) : ref;
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as QuoteReferenceData);
  } catch (err) {
    console.warn('Firestore getQuoteReferenceData error:', err);
    return [];
  }
}

export async function saveQuoteReferenceDataFirestore(item: QuoteReferenceData): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.QUOTE_REFERENCE_DATA, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    console.warn('Firestore saveQuoteReferenceData error:', err);
  }
}

export async function deleteQuoteReferenceDataFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.QUOTE_REFERENCE_DATA, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteQuoteReferenceData error:', err);
  }
}
