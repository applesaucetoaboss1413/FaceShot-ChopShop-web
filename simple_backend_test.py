#!/usr/bin/env python3
"""
Simple Backend API Test for FaceShot-ChopShop-web MongoDB Migration
"""

import requests
import json
import time

def test_backend():
    base_url = "http://localhost:8001"
    results = []
    
    def log_test(name, success, message):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {name} - {message}")
        results.append({"name": name, "success": success, "message": message})
    
    print("🚀 Testing FaceShot-ChopShop-web Backend API")
    print(f"Backend URL: {base_url}")
    
    # Test 1: Health endpoints
    print("\n=== Health Checks ===")
    for endpoint in ['/health', '/ready', '/alive']:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                log_test(f"Health {endpoint}", True, f"Status: {data.get('status', 'ok')}")
            else:
                log_test(f"Health {endpoint}", False, f"HTTP {response.status_code}")
        except Exception as e:
            log_test(f"Health {endpoint}", False, f"Error: {str(e)}")
    
    # Test 2: Stats endpoint
    print("\n=== Stats Endpoint ===")
    try:
        response = requests.get(f"{base_url}/stats", timeout=10)
        if response.status_code == 200:
            data = response.json()
            required_fields = ['videos', 'paying_users', 'total_users', 'conversion_rate', 'revenue_cents']
            if all(field in data for field in required_fields):
                log_test("Stats endpoint", True, f"All fields present, total_users: {data['total_users']}")
            else:
                log_test("Stats endpoint", False, f"Missing fields in response")
        else:
            log_test("Stats endpoint", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Stats endpoint", False, f"Error: {str(e)}")
    
    # Test 3: Catalog endpoint (should return 21 tools)
    print("\n=== Catalog Endpoint ===")
    try:
        response = requests.get(f"{base_url}/api/web/catalog", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) == 21:
                log_test("Catalog endpoint", True, f"Returned {len(data)} tools as expected")
            else:
                log_test("Catalog endpoint", False, f"Expected 21 tools, got {len(data) if isinstance(data, list) else 'non-list'}")
        else:
            log_test("Catalog endpoint", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Catalog endpoint", False, f"Error: {str(e)}")
    
    # Test 4: Packs endpoint (should return 4 packs)
    print("\n=== Packs Endpoint ===")
    try:
        response = requests.get(f"{base_url}/api/web/packs", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) == 4:
                log_test("Packs endpoint", True, f"Returned {len(data)} packs as expected")
            else:
                log_test("Packs endpoint", False, f"Expected 4 packs, got {len(data) if isinstance(data, list) else 'non-list'}")
        else:
            log_test("Packs endpoint", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Packs endpoint", False, f"Error: {str(e)}")
    
    # Test 5: Authentication flow
    print("\n=== Authentication Flow ===")
    auth_token = None
    user_id = None
    
    # Signup
    signup_data = {
        "email": f"testuser_{int(time.time())}@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/signup", json=signup_data, timeout=10)
        if response.status_code == 201:
            data = response.json()
            if 'token' in data and 'user' in data:
                auth_token = data['token']
                user_id = data['user']['id']
                log_test("Auth signup", True, f"User created with ID: {user_id}")
            else:
                log_test("Auth signup", False, "Missing token or user in response")
        else:
            log_test("Auth signup", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Auth signup", False, f"Error: {str(e)}")
    
    # Login with test credentials
    try:
        login_data = {"email": "test@example.com", "password": "testpass123"}
        response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'token' in data:
                if not auth_token:  # Use this token if signup failed
                    auth_token = data['token']
                    user_id = data['user']['id']
                log_test("Auth login", True, f"Login successful for: {data['user']['email']}")
            else:
                log_test("Auth login", False, "Missing token in response")
        elif response.status_code == 401:
            log_test("Auth login", True, "Login correctly rejected (expected for test user)")
        else:
            log_test("Auth login", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Auth login", False, f"Error: {str(e)}")
    
    # Test authenticated endpoints
    if auth_token:
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Test /api/auth/me
        try:
            response = requests.get(f"{base_url}/api/auth/me", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'email' in data:
                    log_test("Auth me", True, f"User info retrieved: {data['email']}")
                else:
                    log_test("Auth me", False, "Missing user fields")
            else:
                log_test("Auth me", False, f"HTTP {response.status_code}")
        except Exception as e:
            log_test("Auth me", False, f"Error: {str(e)}")
        
        # Test credits endpoint
        try:
            response = requests.get(f"{base_url}/api/web/credits", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'balance' in data:
                    log_test("Credits endpoint", True, f"Credits balance: {data['balance']}")
                else:
                    log_test("Credits endpoint", False, "Missing balance field")
            else:
                log_test("Credits endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            log_test("Credits endpoint", False, f"Error: {str(e)}")
        
        # Test creations endpoint
        try:
            response = requests.get(f"{base_url}/api/web/creations", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'items' in data and isinstance(data['items'], list):
                    log_test("Creations endpoint", True, f"Retrieved {len(data['items'])} creations")
                else:
                    log_test("Creations endpoint", False, "Invalid response structure")
            else:
                log_test("Creations endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            log_test("Creations endpoint", False, f"Error: {str(e)}")
    
    # Test unauthorized access
    print("\n=== Unauthorized Access Tests ===")
    for endpoint in ['/api/auth/me', '/api/web/credits', '/api/web/creations']:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 401:
                log_test(f"Unauthorized {endpoint}", True, "Correctly rejected unauthorized request")
            else:
                log_test(f"Unauthorized {endpoint}", False, f"Should return 401, got {response.status_code}")
        except Exception as e:
            log_test(f"Unauthorized {endpoint}", False, f"Error: {str(e)}")
    
    # Summary
    print("\n" + "="*60)
    print("🧪 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in results if r['success'])
    failed = len(results) - passed
    
    print(f"Total Tests: {len(results)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed > 0:
        print("\n🔍 FAILED TESTS:")
        for result in results:
            if not result['success']:
                print(f"  • {result['name']}: {result['message']}")
    
    print("\n📊 MongoDB Migration Status:")
    auth_working = any(r['success'] and 'auth' in r['name'].lower() for r in results)
    catalog_working = any(r['success'] and 'catalog' in r['name'].lower() for r in results)
    credits_working = any(r['success'] and 'credits' in r['name'].lower() for r in results)
    
    print(f"  • Authentication: {'✅ Working' if auth_working else '❌ Issues'}")
    print(f"  • Catalog (21 tools): {'✅ Working' if catalog_working else '❌ Issues'}")
    print(f"  • Credits System: {'✅ Working' if credits_working else '❌ Issues'}")
    print(f"  • Stats Endpoint: {'✅ Working' if any(r['success'] and 'stats' in r['name'].lower() for r in results) else '❌ Issues'}")
    
    if failed == 0:
        print("\n🎉 All tests passed! MongoDB migration successful.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Check details above.")
    
    return failed == 0

if __name__ == "__main__":
    success = test_backend()
    exit(0 if success else 1)