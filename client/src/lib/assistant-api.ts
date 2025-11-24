import { getStoredUser } from "./auth-api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface AssistantMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationPayload {
  conversationId: number;
  title: string;
  messages: AssistantMessage[];
  nextSearchQuery?: string | null;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  
  if (user?.access_token) {
    headers["Authorization"] = `Bearer ${user.access_token}`;
  }
  
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || "Assistant request failed");
  }
  return res.json();
}

export function getConversation(): Promise<ConversationPayload> {
  return request(`${API_BASE_URL}/api/assistant`);
}

export function sendAssistantMessage(message: string): Promise<ConversationPayload> {
  return request(`${API_BASE_URL}/api/assistant/message`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

