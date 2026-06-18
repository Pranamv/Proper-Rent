export type SuggestedAction = "show_intake_form";

export type HealthResponse = {
  status: "ok";
  version: string;
};

export type ChatRequest = {
  session_id: string;
  message: string;
  renter_id?: string | null;
};

export type ChatResponse = {
  reply: string;
  suggested_action: SuggestedAction | null;
  session_id: string;
};

export type ChatHistoryMessage = {
  role: "assistant" | "user";
  content: string;
  suggested_action?: SuggestedAction | null;
  ts?: string | null;
};

export type ChatHistoryResponse = {
  session_id: string;
  messages: ChatHistoryMessage[];
};

export type RenterLeadRequest = {
  source_channel?: "website";
  session_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  bedrooms_required: number;
  areas_preferred: string[];
  max_rent: number;
  move_in_from?: string | null;
  move_in_by?: string | null;
  employment_status:
    | "employed_full"
    | "employed_part"
    | "self_employed"
    | "student"
    | "universal_credit"
    | "other";
  annual_income_range?: string | null;
  has_guarantor: "yes" | "no" | "unsure";
  deposit_availability: "full" | "partial" | "limited";
  current_housing: "renting" | "family" | "owning";
  how_heard?: string | null;
  furnished_preference?: "furnished" | "unfurnished" | "no_preference";
  pets?: string | null;
  accessibility_needs?: string | null;
  has_rented_before?: boolean | null;
  notes?: string | null;
  consent_given: true;
  consent_version: string;
};

export type RenterLeadResponse = {
  renter_id: string;
  message: string;
};

export type LandlordIntakeRequest = {
  full_name: string;
  email: string;
  phone: string;
  property_address: string;
  bedrooms: number;
  asking_rent: number;
  available_from?: string | null;
  advanced_rent_interest: boolean;
  listing_interest: boolean;
  notes?: string | null;
  consent_given: true;
  consent_version: string;
};

export type LandlordIntakeResponse = {
  landlord_id: string;
  message: string;
};

export type AdminAuthCheckResponse = {
  agent_id: string;
  email: string;
  role: "admin";
};

export type AdminLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "viewing_arranged"
  | "offer_made"
  | "let_agreed"
  | "completed"
  | "lost";

export type AdminLeadSummary = {
  new_leads_today: number;
  hot_leads_pending: number;
  pipeline_by_stage: Record<AdminLeadStatus, number>;
};

export type AdminLeadListItem = {
  id: string;
  source_channel: "website" | "whatsapp" | "facebook" | "referral";
  session_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  bedrooms_required?: number | null;
  areas_preferred?: string[] | null;
  max_rent?: number | string | null;
  move_in_from?: string | null;
  move_in_by?: string | null;
  employment_status?:
    | "employed_full"
    | "employed_part"
    | "self_employed"
    | "student"
    | "universal_credit"
    | "other"
    | null;
  annual_income_range?: string | null;
  has_guarantor?: "yes" | "no" | "unsure" | null;
  deposit_availability?: "full" | "partial" | "limited" | null;
  current_housing?: "renting" | "family" | "owning" | null;
  how_heard?: string | null;
  furnished_preference?: "furnished" | "unfurnished" | "no_preference" | null;
  pets?: string | null;
  accessibility_needs?: string | null;
  has_rented_before?: boolean | null;
  notes?: string | null;
  intent_score: number;
  lead_status: AdminLeadStatus;
  assigned_agent_id?: string | null;
  scraye_introduction_id?: string | null;
  fintech_flags: Record<string, unknown>;
  created_at: string;
  updated_at?: string | null;
};

export type AdminLeadListResponse = {
  total: number;
  page: number;
  limit: number;
  summary: AdminLeadSummary;
  results: AdminLeadListItem[];
};

export type AdminLeadDetail = AdminLeadListItem & {
  consent_given: boolean;
  consent_version: string;
  consent_at: string;
};

export type AdminLeadUpdateRequest = {
  assigned_agent_id?: string | null;
  lead_status?: AdminLeadStatus;
  notes?: string | null;
};

export type AdminLandlordStatus = "new" | "contacted" | "listed" | "inactive";

export type AdminLandlordListItem = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  property_address?: string | null;
  bedrooms?: number | null;
  asking_rent?: number | string | null;
  available_from?: string | null;
  advanced_rent_interest?: boolean | null;
  listing_interest?: boolean | null;
  status: AdminLandlordStatus;
  created_at: string;
  updated_at?: string | null;
};

export type AdminLandlordListResponse = {
  total: number;
  page: number;
  limit: number;
  results: AdminLandlordListItem[];
};

export type AdminLandlordDetail = AdminLandlordListItem & {
  consent_given: boolean;
  consent_version: string;
  consent_at: string;
  notes?: string | null;
};

export type AdminLandlordUpdateRequest = {
  status?: AdminLandlordStatus;
  notes?: string | null;
};

export type AdminConversation = {
  id: string;
  renter_id?: string | null;
  session_id: string;
  channel: "website" | "whatsapp" | "facebook";
  external_id?: string | null;
  transcript: Record<string, unknown>[];
  ai_summary?: string | null;
  intent_score_output?: number | null;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};
