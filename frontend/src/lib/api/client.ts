import { publicConfig } from "@/lib/config";
import type {
  AdminAuthCheckResponse,
  AdminConversation,
  AdminLeadDetail,
  AdminLeadListResponse,
  AdminLeadStatus,
  AdminLeadUpdateRequest,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  LandlordIntakeRequest,
  LandlordIntakeResponse,
  RenterLeadRequest,
  RenterLeadResponse,
} from "@/lib/api/types";

type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type AdminLeadListParams = {
  assignedAgentId?: string;
  page?: number;
  limit?: number;
  status?: AdminLeadStatus;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, options: { status: number; body: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.body = options.body;
  }
}

export async function apiFetch<ResponseBody>(
  path: string,
  options: JsonRequestInit = {},
): Promise<ResponseBody> {
  const { body, headers, method, ...rest } = options;
  const response = await fetch(`${publicConfig.apiBaseUrl}${path}`, {
    ...rest,
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: rest.cache ?? "no-store",
  });

  const responseBody = await parseJsonResponse(response);
  if (!response.ok) {
    throw new ApiError("API request failed", {
      status: response.status,
      body: responseBody,
    });
  }

  return responseBody as ResponseBody;
}

export const publicApi = {
  health: () => apiFetch<HealthResponse>("/health"),
  createChatReply: (payload: ChatRequest) =>
    apiFetch<ChatResponse>("/chat", { body: payload }),
  createRenterLead: (payload: RenterLeadRequest) =>
    apiFetch<RenterLeadResponse>("/leads", { body: payload }),
  createLandlordIntake: (payload: LandlordIntakeRequest) =>
    apiFetch<LandlordIntakeResponse>("/landlords", { body: payload }),
} as const;

export const adminApi = {
  checkAuth: (accessToken: string) =>
    apiFetch<AdminAuthCheckResponse>("/admin/auth/check", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  listLeads: (accessToken: string, params: AdminLeadListParams = {}) =>
    apiFetch<AdminLeadListResponse>(`/admin/leads${buildLeadQuery(params)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  getLead: (accessToken: string, leadId: string) =>
    apiFetch<AdminLeadDetail>(`/admin/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  listLeadConversations: (accessToken: string, leadId: string) =>
    apiFetch<AdminConversation[]>(`/admin/leads/${leadId}/conversation`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  updateLead: (
    accessToken: string,
    leadId: string,
    payload: AdminLeadUpdateRequest,
  ) =>
    apiFetch<AdminLeadDetail>(`/admin/leads/${leadId}`, {
      body: payload,
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "PATCH",
    }),
} as const;

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildLeadQuery(params: AdminLeadListParams) {
  const query = new URLSearchParams();
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.assignedAgentId) {
    query.set("assigned_agent_id", params.assignedAgentId);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}
