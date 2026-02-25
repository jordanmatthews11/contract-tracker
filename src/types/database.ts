export type Contract = {
  id: string;
  deal_id: string;
  retailer_simple: string | null;
  start_date: string | null;
  end_date: string | null;
  category_code: string | null;
  country: string | null;
  suggested_store_list: string | null;
  retailer: string | null;
  monthly_quota: number | null;
  notes: string | null;
  months_of_collection: number | null;
  row_hash: string | null;
};

export type ProgressLog = {
  id: string;
  deal_id: string;
  retailer_simple: string;
  month: string;
  responses_collected: number;
  updated_by: string | null;
  updated_at: string;
};

export type ContractRow = Contract & {
  progress_logs?: ProgressLog[];
};

export type HubSpotDeal = {
  hs_deal_id: string;
  deal_name: string | null;
  fa_arr_type: string | null;
  hs_start_date: string | null;
  hs_end_date: string | null;
  hs_close_date: string | null;
  deal_owner: string | null;
  amount: number | null;
  associated_company: string | null;
  annual_recurring_revenue: number | null;
  monthly_recurring_revenue: number | null;
  deal_stage: string | null;
  imported_at?: string;
};
