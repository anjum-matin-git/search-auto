#!/usr/bin/env python3
"""
Comprehensive test script for agent with different query types.
Tests the full autonomous agent workflow.
"""
import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:3000"

# Test user credentials
EMAIL = "testuser7644@example.com"
PASSWORD = "test123456"

def login() -> str:
    """Login and return auth token."""
    print("🔐 Logging in...")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD}
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None
    
    token = response.json()["user"]["access_token"]
    user_id = response.json()["user"]["id"]
    print(f"✅ Logged in as user ID: {user_id}")
    return token

def test_query(token: str, query: str, description: str) -> Dict[str, Any]:
    """Test a single query."""
    print(f"\n{'='*60}")
    print(f"🔍 Test: {description}")
    print(f"📝 Query: '{query}'")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/search",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": query},
            timeout=120  # 2 minute timeout
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code != 200:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"Response: {response.text}")
            return {"success": False, "status": response.status_code}
        
        result = response.json()
        
        print(f"⏱️  Time: {elapsed:.1f}s")
        print(f"📊 Status: {result.get('success')}")
        print(f"📈 Count: {result.get('count')}")
        print(f"🔑 Search ID: {result.get('search_id')}")
        
        if result.get('message'):
            msg = result['message'][:150]
            print(f"💬 Message: {msg}...")
        
        if result.get('count', 0) > 0:
            print(f"\n🚗 Found {result['count']} cars:")
            for i, car in enumerate(result.get('results', [])[:3], 1):
                print(f"   {i}. {car.get('year')} {car.get('brand')} {car.get('model')}")
                print(f"      💰 ${car.get('price')}")
                print(f"      📍 {car.get('location')}")
                if car.get('vin'):
                    print(f"      🆔 VIN: {car.get('vin')[:10]}...")
            return {"success": True, "count": result['count'], "time": elapsed}
        else:
            print("⚠️  No cars returned")
            return {"success": False, "count": 0, "time": elapsed}
            
    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT after 120s")
        return {"success": False, "error": "timeout"}
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {"success": False, "error": str(e)}


def main():
    """Run comprehensive tests."""
    print("🧪 Comprehensive Agent Query Tests")
    print("="*60)
    
    # Login
    token = login()
    if not token:
        print("Cannot continue without login")
        return
    
    # Test queries covering different scenarios
    test_queries = [
        {
            "query": "red mazda",
            "description": "Simple brand + color query"
        },
        {
            "query": "Electric SUV under $60k",
            "description": "Type + price range query"
        },
        {
            "query": "2024 toyota camry under 30000",
            "description": "Brand + model + year + price"
        },
        {
            "query": "luxury sedan with sunroof",
            "description": "Type + feature query"
        },
        {
            "query": "fast sports car",
            "description": "Generic descriptive query"
        },
        {
            "query": "honda civic",
            "description": "Brand + model only"
        },
        {
            "query": "cars under $20000 near Toronto",
            "description": "Price + location query"
        },
    ]
    
    results = []
    
    for test_case in test_queries:
        result = test_query(token, test_case["query"], test_case["description"])
        results.append({
            "query": test_case["query"],
            "description": test_case["description"],
            **result
        })
        
        # Wait a bit between queries
        time.sleep(2)
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print(f"{'='*60}")
    
    success_count = sum(1 for r in results if r.get("success"))
    total_count = len(results)
    avg_time = sum(r.get("time", 0) for r in results) / total_count if results else 0
    
    print(f"✅ Passed: {success_count}/{total_count}")
    print(f"⏱️  Avg Time: {avg_time:.1f}s")
    print(f"\nDetailed Results:")
    
    for r in results:
        status = "✅" if r.get("success") else "❌"
        count = r.get("count", 0)
        time_taken = r.get("time", 0)
        print(f"  {status} {r['description']}")
        print(f"     Query: '{r['query']}'")
        print(f"     Cars: {count}, Time: {time_taken:.1f}s")
        if r.get("error"):
            print(f"     Error: {r['error']}")
    
    return results


if __name__ == "__main__":
    try:
        results = main()
        success_rate = sum(1 for r in results if r.get("success")) / len(results) if results else 0
        
        if success_rate >= 0.7:  # 70% success rate
            print(f"\n✅ Overall: GOOD ({(success_rate*100):.0f}% success)")
            exit(0)
        else:
            print(f"\n⚠️  Overall: NEEDS IMPROVEMENT ({(success_rate*100):.0f}% success)")
            exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

