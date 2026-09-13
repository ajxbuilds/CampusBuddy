import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post('http://localhost:8000/api/auth/login', json={
            'email': 'gaikwadanushka1001@gmail.com', # Anushka
            'password': 'Student@123'
        })
        token = res.json().get('access_token')
        
        # fallback to student if Anushka fails
        if not token:
            res = await client.post('http://localhost:8000/api/auth/login', json={
                'email': 'student@campusbuddy.edu',
                'password': 'Student@123'
            })
            token = res.json().get('access_token')

        res = await client.get('http://localhost:8000/api/auth/parent/link-code', headers={
            'Authorization': f'Bearer {token}'
        })
        print("GET:", res.status_code, res.text)

asyncio.run(test())
