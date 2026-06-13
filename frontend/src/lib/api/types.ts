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
