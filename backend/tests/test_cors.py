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


@pytest.mark.asyncio
async def test_cors_production_vercel_origin(async_client):
    prod_origin = "https://campus-buddy-xi-tan.vercel.app"

    headers = {
        "Origin": prod_origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }

    response = await async_client.options("/api/auth/register", headers=headers)

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == prod_origin
    assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_cors_preview_vercel_origin(async_client):
    preview_origin = "https://campus-buddy-1zpk8ccv8-ajinkya-ef89.vercel.app"

    headers = {
        "Origin": preview_origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }

    response = await async_client.options("/api/auth/register", headers=headers)

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == preview_origin
    assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_cors_disallowed_origin_rejected(async_client):
    unauthorized_origin = "https://unauthorized-attacker-site.com"

    headers = {
        "Origin": unauthorized_origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }

    response = await async_client.options("/api/auth/register", headers=headers)

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
