import { getStoredUser } from "./auth-api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface Plan {
  id: number;
  name: string;
  price: number;
  credits: number | null;
  features: Record<string, any>;
  stripe_price_id: string | null;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export async function getPlans(): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/api/billing/plans`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }
  
  const data = await response.json();
  return data;
}

export async function createCheckout(planId: number): Promise<CheckoutResponse> {
  const user = getStoredUser();
  
  if (!user?.access_token) {
    throw new Error("Please log in to purchase a plan");
  }
  
  const response = await fetch(`${API_BASE_URL}/api/billing/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.access_token}`,
    },
    body: JSON.stringify({ plan_id: planId }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Checkout failed" }));
    throw new Error(error.detail || "Checkout failed");
  }
  
  return response.json();
}

export async function getCredits() {
  const user = getStoredUser();
  
  if (!user?.access_token) {
    return null;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/billing/credits`, {
    headers: {
      "Authorization": `Bearer ${user.access_token}`,
    },
  });
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}
