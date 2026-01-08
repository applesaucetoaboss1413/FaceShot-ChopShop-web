#!/usr/bin/env python3
"""
Debug upload endpoint issue
"""

import requests
import json

def test_upload_debug():
    # First, create a user and get auth token
    base_url = "http://localhost:8001"
    
    # Signup
    signup_data = {
        "email": f"debuguser_{int(__import__('time').time())}@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(f"{base_url}/api/auth/signup", json=signup_data)
    if response.status_code != 201:
        print(f"Signup failed: {response.status_code} - {response.text}")
        return
    
    auth_data = response.json()
    token = auth_data['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    print(f"✅ User created, token: {token[:20]}...")
    
    # Test upload with minimal data
    test_data = b"fake image data for testing upload"
    files = {'file': ('test.jpg', test_data, 'image/jpeg')}
    data = {'type': 'faceswap'}
    
    print("🔄 Testing upload...")
    response = requests.post(f"{base_url}/api/web/upload", files=files, data=data, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code != 200:
        # Let's also test without file to see if it's a file handling issue
        print("\n🔄 Testing upload without file...")
        response2 = requests.post(f"{base_url}/api/web/upload", data={'type': 'faceswap'}, headers=headers)
        print(f"Status (no file): {response2.status_code}")
        print(f"Response (no file): {response2.text}")

if __name__ == "__main__":
    test_upload_debug()