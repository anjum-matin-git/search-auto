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
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Signup failed");
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<{ success: boolean; user: User }> {
  const response = await fetch("/api/auth/login", {
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
