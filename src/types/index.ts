export type TradeType =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC / Air Conditioning'
  | 'Carpentry'
  | 'Cleaning Services'
  | 'Home Technology';

export interface Profile {
  id: string;
  business_name: string;
  owner_name: string;
  trade_type: TradeType;
  google_review_url: string;
  created_at: string;
}

export interface MaterialCostItem {
  id: string;
  name: string;
  unit_cost: number;
  unit: string;
}

export interface QuoteReferenceData {
  id: string;
  profile_id: string;
  service_name: string;
  base_labor_rate: number;
  material_costs: MaterialCostItem[];
  notes_for_ai: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  profile_id: string;
  name: string;
  contact_no: string;
  email: string;
  location: string;
  created_at: string;
}

export type WorkStatus = 'Quoted' | 'Scheduled' | 'Done';
export type PaymentStatus = 'Pending' | 'Paid';

export interface Job {
  id: string;
  profile_id: string;
  customer_id: string;
  title: string;
  problem: string;
  work_status: WorkStatus;
  payment_status: PaymentStatus;
  amount: number;
  date_of_work: string | null;
  created_at: string;
  customer?: Customer;
}

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: 'labor' | 'material' | 'fee';
}

export interface Quote {
  id: string;
  job_id: string;
  line_items: QuoteLineItem[];
  total_amount: number;
  public_token: string;
  is_accepted: boolean;
  status: 'Draft' | 'Sent' | 'Accepted';
  created_at: string;
}

export interface Invoice {
  id: string;
  job_id: string;
  invoice_number: string;
  amount: number;
  payment_link?: string;
  paid_at?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  job_id: string;
  review_token: string;
  rating?: number | null;
  feedback_text?: string | null;
  status: 'Pending' | 'Completed';
  is_public: boolean;
  created_at: string;
}

export interface DetailedCustomerView {
  customer: Customer;
  jobs: {
    job: Job;
    quote?: Quote | null;
    invoice?: Invoice | null;
    review?: Review | null;
  }[];
}

export interface UploadedQuoteDoc {
  id: string;
  file_name: string;
  file_type: string;
  content_text: string;
  uploaded_at: string;
}
