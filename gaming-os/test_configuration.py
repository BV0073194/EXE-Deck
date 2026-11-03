import pathlib
import unittest

ROOT = pathlib.Path(__file__).parent

class ConfigurationTests(unittest.TestCase):
    def test_oauth_protects_entire_remote_upstream(self):
        caddy = (ROOT / "Caddy.github").read_text()
        self.assertIn("reverse_proxy oauth:4180", caddy)
        self.assertNotIn("reverse_proxy gaming:6080", caddy)
        oauth = (ROOT / "compose.github.yaml").read_text()
        self.assertIn("OAUTH2_PROXY_GITHUB_USER", oauth)
        self.assertIn("OAUTH2_PROXY_COOKIE_SECURE", oauth)
        self.assertIn("OAUTH2_PROXY_UPSTREAMS: http://gaming:6080/", oauth)

    def test_remote_vnc_port_not_published(self):
        overlay = (ROOT / "compose.remote.yaml").read_text()
        self.assertIn("ports: !reset []", overlay)

    def test_default_localhost_only(self):
        compose = (ROOT / "compose.yaml").read_text()
        self.assertIn('127.0.0.1:6080:6080', compose)

    def test_segmented_networks(self):
        overlay = (ROOT / "compose.isolated.yaml").read_text()
        self.assertIn("session_private:", overlay)
        self.assertIn("internal: true", overlay)
        self.assertIn("auth_frontend:", overlay)
        self.assertIn("networks: !override", overlay)
        self.assertIn("      - session_private", overlay)

    def test_single_owner_preflight(self):
        script = (ROOT / "secure-start.sh").read_text()
        self.assertIn("EXE_DECK_GITHUB_ALLOWED_USERS", script)
        self.assertIn("Only one GitHub username", script)
        self.assertIn("docker compose", script)
        self.assertIn("compose.isolated.yaml", script)

    def test_no_privileged_container(self):
        compose = (ROOT / "compose.yaml").read_text()
        self.assertIn("no-new-privileges:true", compose)
        self.assertIn("cap_drop:", compose)
        self.assertIn("read_only: true", compose)

if __name__ == "__main__":
    unittest.main()
