"""Smoke tests for the loopback session broker (no external packages)."""
import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path
from server import Broker

class BrokerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.server = Broker(("127.0.0.1", 0), Path(self.temp.name), "test-secret")
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()
    def request(self, method, path, token=None, body=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        headers = {"Authorization": "Bearer " + token} if token else {}
        if body is not None:
            headers["Content-Type"] = "application/json"
        conn.request(method, path, body=json.dumps(body) if body is not None else None, headers=headers)
        response = conn.getresponse()
        result = response.status, json.loads(response.read())
        conn.close()
        return result
    def test_requires_token(self):
        self.assertEqual(self.request("GET", "/v1/status")[0], 401)
        self.assertEqual(self.request("GET", "/v1/status", "wrong")[0], 401)
    def test_private_session_lifecycle(self):
        status, data = self.request("POST", "/v1/sessions", "test-secret", {})
        self.assertEqual(status, 201)
        self.assertFalse(data["guestRunning"])
        self.assertTrue((Path(self.temp.name) / data["id"]).is_dir())
        self.assertEqual(self.request("DELETE", "/v1/sessions/" + data["id"], "test-secret")[0], 200)
        self.assertTrue((Path(self.temp.name) / data["id"]).exists())
    def test_no_execution_endpoints(self):
        self.assertEqual(self.request("POST", "/v1/execute", "test-secret", {})[0], 404)

if __name__ == "__main__":
    unittest.main()
