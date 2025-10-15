from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    # Use a unique email for the test
    email = "test_student@example.com"
    activity_name = "Chess Club"

    # Ensure email is not already in participants
    activities[activity_name]["participants"] = [p for p in activities[activity_name]["participants"] if p != email]

    # Signup
    resp = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity_name]["participants"]

    # Duplicate signup should fail (the app validates students aren't already signed up for any activity)
    resp2 = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert resp2.status_code == 400

    # Unregister
    resp3 = client.delete(f"/activities/{activity_name}/participants?email={email}")
    assert resp3.status_code == 200
    assert email not in activities[activity_name]["participants"]

    # Unregister again should return 404
    resp4 = client.delete(f"/activities/{activity_name}/participants?email={email}")
    assert resp4.status_code == 404