#!/usr/bin/env python3
"""
Comprehensive test suite for SearchAuto.
Tests: Health, Signup, Login, Search (MarketCheck), Chat, Dealer URLs.
"""
import asyncio
import httpx
import random
import string
import json
from datetime import datetime

# Configuration
BASE_URL = "https://search-auto-production.up.railway.app"
# BASE_URL = "http://localhost:8000"

# Test data - use timestamp for uniqueness
import time
UNIQUE_ID = f"{int(time.time())}_{random.randint(1000, 9999)}"
TEST_EMAIL = f"test_{UNIQUE_ID}@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = f"testuser_{UNIQUE_ID}"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_header(text: str):
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}")


def print_success(text: str):
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text: str):
    print(f"{RED}✗ {text}{RESET}")


def print_info(text: str):
    print(f"{YELLOW}→ {text}{RESET}")


async def test_health():
    """Test health endpoint."""
    print_header("1. HEALTH CHECK")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print_success(f"Health check passed: {data.get('status', 'ok')}")
                return True
            else:
                print_error(f"Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Health check error: {e}")
            return False


async def test_signup():
    """Test signup flow."""
    print_header("2. SIGNUP TEST")
    
    signup_data = {
        "username": TEST_NAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "location": "Toronto",
        "postalCode": "M5H",
        "initialPreferences": {
            "carTypes": ["sedan", "suv"],
            "priceRange": {"min": 10000, "max": 50000}
        }
    }
    
    print_info(f"Signing up as: {TEST_EMAIL}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/auth/signup",
                json=signup_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user") and data.get("user", {}).get("access_token"):
                    print_success(f"Signup successful!")
                    print_info(f"User ID: {data['user'].get('id')}")
                    return data["user"]["access_token"]
                else:
                    print_error(f"Signup response missing token: {data}")
                    return None
            elif response.status_code == 400 and "already registered" in response.text.lower():
                print_info("User already exists, will try login instead")
                return "EXISTS"
            else:
                print_error(f"Signup failed: {response.status_code}")
                print_error(f"Response: {response.text[:500]}")
                return None
        except Exception as e:
            print_error(f"Signup error: {e}")
            return None


async def test_login():
    """Test login flow."""
    print_header("3. LOGIN TEST")
    
    print_info(f"Logging in as: {TEST_EMAIL}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                if token:
                    print_success("Login successful!")
                    return token
                else:
                    print_error(f"Login response missing token: {data}")
                    return None
            else:
                print_error(f"Login failed: {response.status_code}")
                print_error(f"Response: {response.text[:500]}")
                return None
        except Exception as e:
            print_error(f"Login error: {e}")
            return None


async def test_search(token: str, query: str = "Honda Civic under $30000"):
    """Test search functionality with MarketCheck."""
    print_header(f"4. SEARCH TEST - '{query}'")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            print_info("Executing search...")
            start_time = datetime.now()
            
            response = await client.post(
                f"{BASE_URL}/api/search",
                json={"query": query},
                headers=headers
            )
            
            duration = (datetime.now() - start_time).total_seconds()
            print_info(f"Search took {duration:.2f}s")
            
            if response.status_code == 200:
                data = response.json()
                cars = data.get("cars", [])
                summary = data.get("summary", "")
                search_id = data.get("search_id")
                
                print_success(f"Search successful! Found {len(cars)} cars")
                print_info(f"Search ID: {search_id}")
                
                if summary:
                    print_info(f"Summary: {summary[:200]}...")
                
                # Check car data quality
                if cars:
                    print("\n  Car Results:")
                    dealer_urls_found = 0
                    google_fallbacks = 0
                    
                    for i, car in enumerate(cars[:5]):  # Show first 5
                        brand = car.get("brand", "Unknown")
                        model = car.get("model", "Unknown")
                        year = car.get("year", "N/A")
                        price = car.get("price", "N/A")
                        source_url = car.get("sourceUrl", "")
                        images = car.get("images", [])
                        
                        print(f"  {i+1}. {year} {brand} {model} - ${price}")
                        print(f"     Images: {len(images)}")
                        
                        if source_url:
                            if "google.com/search" in source_url:
                                print(f"     {YELLOW}URL: Google fallback{RESET}")
                                google_fallbacks += 1
                            else:
                                print(f"     {GREEN}URL: Dealer link ✓{RESET}")
                                dealer_urls_found += 1
                                print(f"     {source_url[:80]}...")
                        else:
                            print(f"     {RED}URL: Missing{RESET}")
                    
                    print(f"\n  Stats: {dealer_urls_found} dealer URLs, {google_fallbacks} Google fallbacks")
                
                return data
            else:
                print_error(f"Search failed: {response.status_code}")
                print_error(f"Response: {response.text[:500]}")
                return None
        except Exception as e:
            print_error(f"Search error: {e}")
            return None


async def test_chat(token: str):
    """Test chat/assistant functionality."""
    print_header("5. CHAT TEST")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    messages_to_test = [
        "Hi, I'm looking for a family SUV",
        "What about Toyota RAV4?",
        "Show me more options"
    ]
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        for i, message in enumerate(messages_to_test):
            print_info(f"Sending: '{message}'")
            
            try:
                response = await client.post(
                    f"{BASE_URL}/api/assistant/message",
                    json={"message": message},
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    reply = data.get("response", "")[:200]
                    print_success(f"Response: {reply}...")
                else:
                    print_error(f"Chat failed: {response.status_code}")
                    print_error(f"Response: {response.text[:300]}")
                    return False
                    
            except Exception as e:
                print_error(f"Chat error: {e}")
                return False
    
    print_success("Chat test completed!")
    return True


async def test_multiple_searches(token: str):
    """Test various search queries."""
    print_header("6. MULTIPLE SEARCH QUERIES")
    
    queries = [
        "BMW X5",
        "Red Mazda",
        "Electric car under $40000",
        "Toyota Camry 2022",
        "SUV with sunroof"
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    results = []
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        for query in queries:
            print_info(f"Testing: '{query}'")
            
            try:
                response = await client.post(
                    f"{BASE_URL}/api/search",
                    json={"query": query},
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    cars = data.get("cars", [])
                    print_success(f"  → Found {len(cars)} cars")
                    results.append((query, len(cars), True))
                else:
                    print_error(f"  → Failed: {response.status_code}")
                    results.append((query, 0, False))
                    
            except Exception as e:
                print_error(f"  → Error: {e}")
                results.append((query, 0, False))
    
    # Summary
    print("\n  Summary:")
    success_count = sum(1 for _, _, success in results if success)
    print(f"  {success_count}/{len(queries)} queries successful")
    
    return success_count == len(queries)


async def test_personalized_search(token: str):
    """Test personalized search based on user preferences."""
    print_header("7. PERSONALIZED SEARCH TEST")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{BASE_URL}/api/search/personalized",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                cars = data.get("cars", [])
                print_success(f"Personalized search: Found {len(cars)} cars")
                
                if cars:
                    car = cars[0]
                    print_info(f"Top recommendation: {car.get('year')} {car.get('brand')} {car.get('model')}")
                
                return True
            else:
                print_error(f"Personalized search failed: {response.status_code}")
                return False
                
        except Exception as e:
            print_error(f"Personalized search error: {e}")
            return False


async def main():
    """Run all tests."""
    print(f"\n{BOLD}🚗 SEARCHAUTO COMPREHENSIVE TEST SUITE 🚗{RESET}")
    print(f"Target: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # 1. Health check
    results["health"] = await test_health()
    
    if not results["health"]:
        print_error("\nHealth check failed. Aborting tests.")
        return
    
    # 2. Signup
    token = await test_signup()
    
    # 3. Login (if signup returns EXISTS or fails)
    if token == "EXISTS" or token is None:
        token = await test_login()
    
    if not token:
        print_error("\nAuth failed. Aborting tests.")
        return
    
    results["auth"] = True
    
    # 4. Search
    search_result = await test_search(token)
    results["search"] = search_result is not None
    
    # 5. Chat
    results["chat"] = await test_chat(token)
    
    # 6. Multiple searches
    results["multi_search"] = await test_multiple_searches(token)
    
    # 7. Personalized search
    results["personalized"] = await test_personalized_search(token)
    
    # Final summary
    print_header("TEST SUMMARY")
    
    all_passed = True
    for test_name, passed in results.items():
        if passed:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")
            all_passed = False
    
    print()
    if all_passed:
        print(f"{GREEN}{BOLD}🎉 ALL TESTS PASSED! 🎉{RESET}")
    else:
        print(f"{RED}{BOLD}❌ SOME TESTS FAILED{RESET}")


if __name__ == "__main__":
    asyncio.run(main())

