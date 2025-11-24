#!/usr/bin/env python3
"""Test the agent search with save_search_results."""
import requests
import json
import time

BASE_URL = "http://localhost:3000"

def test_agent_search():
    """Test the full agent search flow."""
    
    # 1. Login
    print("🔐 Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "testsearch@example.com", "password": "test123456"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    login_data = login_response.json()
    token = login_data["user"]["access_token"]
    print(f"✅ Logged in as user ID: {login_data['user']['id']}")
    
    # 2. Search
    print("\n🔍 Searching: 'Electric SUV under $60k'")
    print("⏳ Waiting for agent to work...")
    
    start_time = time.time()
    search_response = requests.post(
        f"{BASE_URL}/api/search",
        headers={"Authorization": f"Bearer {token}"},
        json={"query": "Electric SUV under $60k"}
    )
    elapsed = time.time() - start_time
    
    print(f"\n⏱️  Search took {elapsed:.1f} seconds")
    print(f"📊 Status: {search_response.status_code}")
    
    if search_response.status_code != 200:
        print(f"❌ Search failed!")
        print(search_response.text)
        return False
    
    # 3. Check results
    result = search_response.json()
    
    print(f"\n✅ Search Response:")
    print(f"   Success: {result.get('success')}")
    print(f"   Query: {result.get('query')}")
    print(f"   Count: {result.get('count')}")
    print(f"   Search ID: {result.get('search_id')}")
    print(f"   Message: {result.get('message', '')[:100]}...")
    
    # 4. Check if cars were returned
    if result.get('count', 0) > 0:
        print(f"\n🚗 Found {result['count']} cars:")
        for i, car in enumerate(result.get('results', [])[:3], 1):
            print(f"   {i}. {car.get('year')} {car.get('brand')} {car.get('model')}")
            print(f"      Price: {car.get('price')}")
            print(f"      Location: {car.get('location')}")
            print(f"      VIN: {car.get('vin')}")
        print("\n✅ SUCCESS! Cars are showing!")
        return True
    else:
        print("\n⚠️  No cars returned in results array")
        print("   Agent may not have called save_search_results")
        return False

if __name__ == "__main__":
    try:
        success = test_agent_search()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

