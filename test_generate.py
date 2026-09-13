import requests

def test():
    # Login
    res = requests.post('http://localhost:8000/api/auth/login', json={
        'email': 'student@campusbuddy.edu',
        'password': 'Student@123'
    })
    print("Login:", res.status_code, res.text)
    token = res.json().get('access_token')
    
    if not token:
        return
        
    # Generate code
    res = requests.post('http://localhost:8000/api/auth/parent/link-code/generate', headers={
        'Authorization': f'Bearer {token}'
    })
    print("Generate:", res.status_code, res.text)

test()
