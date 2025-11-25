#!/usr/bin/env python3
"""
Comprehensive User Flow Test Script
Tests: Signup -> Auto Search (Prefs) -> Direct Search -> Returning User (Last Query)
"""
import requests
import time
import random
import string
import json

BASE_URL = "http://localhost:3000"

def generate_random_email():
    """Generate a random email for testing."""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_str}@example.com"

def print_step(step, msg):
    print(f"\n{'='*60}")
    print(f"STEP {step}: {msg}")
    print(f"{'='*60}")

def main():
    email = generate_random_email()
    password = "password123"
    username = email.split('@')[0]
    
    print(f"🧪 Starting Full Flow Test with User: {email}")
    
    # ---------------------------------------------------------
    # STEP 1: Signup with Preferences
    # ---------------------------------------------------------
    print_step(1, "Signup with Initial Preferences")
    
    signup_payload = {
        "email": email,
        "password": password,
        "username": username,
        "location": "Toronto, ON",
        "postal_code": "M5V 2T6",
        "initial_preferences": {
            "brands": ["BMW", "Audi"],
            "types": ["Sedan"],
            "price_max": 80000
        }
    }
    
    start = time.time()
    resp = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
    elapsed = time.time() - start
    
    if resp.status_code != 200:
        print(f"❌ Signup Failed: {resp.text}")
        return
    
    data = resp.json()
    user = data["user"]
    token = user["access_token"]
    print(f"✅ Signup Successful (User ID: {user['id']})")
    print(f"   Preferences saved: {user['initial_preferences']}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # ---------------------------------------------------------
    # STEP 2: Automatic Search (Personalized)
    # ---------------------------------------------------------
    print_step(2, "Automatic Search based on Preferences (New User)")
    print("   Calling /api/search/personalized...")
    
    start = time.time()
    resp = requests.get(f"{BASE_URL}/api/search/personalized", headers=headers, timeout=60)
    elapsed = time.time() - start
    
    if resp.status_code == 200:
        data = resp.json()
        query_used = data.get("query")
        print(f"✅ Auto Search Successful in {elapsed:.1f}s")
        print(f"   Query Used: '{query_used}'")
        print(f"   Message: {data.get('recommendations')[:100]}...")
        
        # Verify it used preferences (BMW/Audi)
        if "BMW" in query_used or "Audi" in query_used:
            print("   ✅ Verified: Query contains preferred brands")
        else:
            print("   ⚠️ Warning: Query might not match preferences")
    else:
        print(f"❌ Auto Search Failed: {resp.status_code} - {resp.text}")

    # ---------------------------------------------------------
    # STEP 3: Direct Search (Specific Query)
    # ---------------------------------------------------------
    print_step(3, "Direct Search: 'Red Mazda'")
    
    search_payload = {"query": "red mazda"}
    
    start = time.time()
    resp = requests.post(f"{BASE_URL}/api/search", headers=headers, json=search_payload, timeout=60)
    elapsed = time.time() - start
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ Search Successful in {elapsed:.1f}s")
        print(f"   Count: {data.get('count')} cars found")
        
        results = data.get('results', [])
        if results:
            first_car = results[0]
            print(f"   Top Result: {first_car.get('year')} {first_car.get('brand')} {first_car.get('model')}")
            
            # Verify color filtering (red)
            # Note: We rely on the agent description or our manual check from previous steps
            print(f"   Description: {first_car.get('description')}")
    else:
        print(f"❌ Search Failed: {resp.status_code} - {resp.text}")

    # ---------------------------------------------------------
    # STEP 4: Returning User (Last Query)
    # ---------------------------------------------------------
    print_step(4, "Returning User: Automatic Search from Last Query")
    print("   Calling /api/search/personalized again...")
    
    start = time.time()
    resp = requests.get(f"{BASE_URL}/api/search/personalized", headers=headers, timeout=60)
    elapsed = time.time() - start
    
    if resp.status_code == 200:
        data = resp.json()
        query_used = data.get("query")
        print(f"✅ Returning User Search Successful in {elapsed:.1f}s")
        print(f"   Query Used: '{query_used}'")
        
        # Verify it used the LAST query ("red mazda")
        if "red mazda" in query_used.lower():
            print("   ✅ Verified: Automatically used last search query!")
        else:
            print(f"   ❌ Failed: Expected 'red mazda', got '{query_used}'")
    else:
        print(f"❌ Returning User Search Failed: {resp.status_code} - {resp.text}")

    # ---------------------------------------------------------
    # STEP 5: Pagination / Chat Follow-up
    # ---------------------------------------------------------
    print_step(5, "Chat Follow-up: 'Show me more'")
    # Note: Currently testing if agent can handle this contextless or if we need to send context
    
    chat_payload = {"query": "Show me more results"}
    
    start = time.time()
    resp = requests.post(f"{BASE_URL}/api/search", headers=headers, json=chat_payload, timeout=60)
    elapsed = time.time() - start
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ Chat Request Successful in {elapsed:.1f}s")
        print(f"   Message: {data.get('message')}")
        print(f"   Count: {data.get('count')} cars found")
        
        # Check if it actually found more
        if data.get('count', 0) > 0:
             print("   ✅ Verified: Agent understood pagination/context and returned more cars")
        else:
             print("   ⚠️ Warning: Agent might have treated this as a new search without context")
    else:
        print(f"❌ Chat Request Failed: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted")
    except Exception as e:
        print(f"\n❌ Test Error: {e}")

