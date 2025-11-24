export interface CarResult {
  id: number;
  sourceUrl: string;
  source: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  priceNumeric?: number;
  mileage?: string;
  mileageNumeric?: number;
  location?: string;
  dealerName?: string;
  dealership?: string;
  dealerPhone?: string;
  dealerAddress?: string;
  type?: string;
  fuelType?: string;
  transmission?: string;
  exteriorColor?: string;
  interiorColor?: string;
  specs?: {
    acceleration?: string;
    topSpeed?: string;
    power?: string;
    engineSize?: string;
    mpg?: string;
  };
  features?: string[];
  description?: string;
  images?: string[];
  match?: number;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  count: number;
  results: CarResult[];
  message?: string; // Agent's text response
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function searchCars(query: string, userId?: number): Promise<SearchResponse> {
  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : null;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add JWT token if available
  if (userData?.access_token) {
    headers["Authorization"] = `Bearer ${userData.access_token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Search failed" }));
    const err = new Error(error.error || error.detail || "Search failed");
    (err as any).status = response.status;
    throw err;
  }

  return response.json();
}

export async function getPersonalizedCars(): Promise<SearchResponse> {
  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : null;
  
  if (!userData?.access_token) {
    throw new Error("Not authenticated");
  }
  
  const response = await fetch(`${API_BASE_URL}/api/search/personalized`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${userData.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to load personalized results" }));
    throw new Error(error.error || error.detail || "Failed to load personalized results");
  }

  return response.json();
}

export async function getSearchHistory(userId: number) {
  const response = await fetch(`/api/search/history?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error("Failed to get history");
  }

  return response.json();
}

export async function getUserPreferences(userId: number) {
  const response = await fetch(`/api/preferences/${userId}`);
  
  if (!response.ok) {
    throw new Error("Failed to get preferences");
  }

  return response.json();
}

export async function getSimilarCars(query: string, limit: number = 10) {
  const response = await fetch(`/api/cars/similar?query=${encodeURIComponent(query)}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error("Failed to get similar cars");
  }

  return response.json();
}

export async function getCarDetails(carId: number) {
  const response = await fetch(`/api/cars/${carId}`);
  
  if (!response.ok) {
    throw new Error("Failed to get car details");
  }

  return response.json();
}
