from fastapi.testclient import TestClient
import urllib.parse

from src import app as app_module


client = TestClient(app_module.app)


def setup_function():
    # make a shallow copy of activities to restore later
    setup_function._backup = {k: {**v, "participants": list(v["participants"])} for k, v in app_module.activities.items()}


def teardown_function():
    # restore activities to original state
    app_module.activities.clear()
    app_module.activities.update(setup_function._backup)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "test_student@example.com"

    # ensure not already signed up
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert email not in resp.json()[activity]["participants"]

    # sign up
    signup_url = f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}"
    resp = client.post(signup_url)
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # verify presence
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # unregister
    delete_url = f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}"
    resp = client.delete(delete_url)
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # verify removal
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]


def test_unregister_nonexistent_participant_returns_404():
    activity = "Chess Club"
    email = "noone@example.com"
    delete_url = f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}"
    resp = client.delete(delete_url)
    assert resp.status_code == 404
