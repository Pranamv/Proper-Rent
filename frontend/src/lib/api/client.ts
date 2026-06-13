import { publicConfig } from "@/lib/config";
import type {
  AdminAuthCheckResponse,
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
