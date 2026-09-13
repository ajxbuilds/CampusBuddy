import requests

def test():
    res = requests.post('http://localhost:8000/api/auth/login', json={
        'email': 'student@campusbuddy.edu',
        'password': 'Student@123'
    })
    token = res.json().get('access_token')
    if token:
        res = requests.post('http://localhost:8000/api/auth/parent/link-code/generate', headers={
            'Authorization': f'Bearer {token}'
        })
        print("POST:", res.status_code, res.text)
    else:
        print("Login failed")
test()
