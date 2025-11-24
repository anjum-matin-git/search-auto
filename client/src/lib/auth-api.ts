const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface User {
  id: number;
  username: string;
  email: string;
  postalCode?: string | null;
  location?: string | null;
  initialPreferences?: {
    carTypes?: string[];
    brands?: string[];
    priceRange?: { min?: number; max?: number };
    fuelType?: string;
  } | null;
  createdAt?: string;
  access_token?: string;  // JWT token
  creditsRemaining?: number;
  unlimitedSearches?: boolean;
}

function normalizeUserResponse(data: any, base?: Partial<User>): User {
  return {
    id: data?.id ?? base?.id ?? 0,
    username: data?.username ?? base?.username ?? "",
    email: data?.email ?? base?.email ?? "",
    location: data?.location ?? base?.location ?? null,
    postalCode: data?.postal_code ?? data?.postalCode ?? base?.postalCode ?? null,
    initialPreferences: data?.initial_preferences ?? data?.initialPreferences ?? base?.initialPreferences ?? null,
    createdAt: data?.created_at ?? data?.createdAt ?? base?.createdAt,
    access_token: data?.access_token ?? base?.access_token,
    creditsRemaining: data?.credits_remaining ?? base?.creditsRemaining,
    unlimitedSearches: data?.unlimited_searches ?? base?.unlimitedSearches,
  };
}

export async function signup(data: {
  username: string;
  email: string;
  password: string;
  postalCode?: string;
  location?: string;
  initialPreferences?: any;
}): Promise<{ success: boolean; user: User }> {
  try {
    console.log("Making fetch request to:", `${API_BASE_URL}/api/auth/signup`);
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || error.detail || "Signup failed");
    }

    const result = await response.json();
    console.log("Success response:", result);
    return {
      success: result.success,
      user: normalizeUserResponse(result.user),
    };
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; user: User }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const result = await response.json();
  return {
    success: result.success,
    user: normalizeUserResponse(result.user),
  };
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem("user");
}

function buildAuthHeaders() {
  const stored = getStoredUser();
  if (!stored?.access_token) {
    throw new Error("Not authenticated");
  }
  return {
    Authorization: `Bearer ${stored.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchProfile(): Promise<User> {
  const headers = buildAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "GET",
    headers,
  });
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }
  const stored = getStoredUser() ?? undefined;
  const raw = await response.json();
  return normalizeUserResponse(raw, stored ?? undefined);
}

export async function updateProfile(data: {
  username?: string;
  email?: string;
  location?: string;
  postalCode?: string;
}): Promise<User> {
  const headers = buildAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update profile");
  }
  const stored = getStoredUser() ?? undefined;
  const raw = await response.json();
  return normalizeUserResponse(raw, stored ?? undefined);
}

export async function updateUserPreferences(data: {
  userId: number;
  location?: string;
  postalCode?: string;
  initialPreferences: Record<string, unknown>;
}): Promise<User> {
  const headers = buildAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/auth/preferences`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: data.userId,
      location: data.location,
      postalCode: data.postalCode,
      initialPreferences: data.initialPreferences,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update preferences");
  }
  const stored = getStoredUser() ?? undefined;
  const raw = await response.json();
  return normalizeUserResponse(raw, stored ?? undefined);
}

export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const headers = buildAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to change password");
  }
}
