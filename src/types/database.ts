export type Contract = {
  deal_id: string;
  start_date: string | null;
  end_date: string | null;
  category_code: string | null;
  country: string | null;
  suggested_store_list: string | null;
  retailer: string | null;
  retailer_simple: string | null;
  monthly_quota: number | null;
  notes: string | null;
  months_of_collection: number | null;
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
