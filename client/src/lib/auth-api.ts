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
    return result;
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

  return response.json();
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
