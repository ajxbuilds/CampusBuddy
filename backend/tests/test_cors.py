import pytest
from app.core.config import settings

@pytest.mark.asyncio
async def test_cors_frontend_url_allowed(async_client):
    frontend_url = settings.FRONTEND_URL.strip().rstrip("/")

    # Make a preflight request
    headers = {
        "Origin": frontend_url,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization",
    }

    response = await async_client.options("/api/auth/me", headers=headers)

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == frontend_url
    assert "access-control-allow-credentials" in response.headers
