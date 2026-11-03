"""Tests for conservative local executable routing."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from runners import classify
from launch_local import launch

def pe_header():
    data=bytearray(256)
    data[:2]=b"MZ"
    data[0x3c:0x40]=(128).to_bytes(4,"little")
    data[128:132]=bytes((80,69,0,0))
    return bytes(data)

class LocalLaunchTests(unittest.TestCase):
    def test_exe_signature(self):
        self.assertEqual(classify("game.exe",pe_header())[0],"wine")
        self.assertIsNone(classify("fake.exe",b"not an exe")[0])
    def test_msi_signature(self):
        self.assertEqual(classify("setup.msi",bytes.fromhex("d0cf11e0a1b11ae1"))[0],"wine-msiexec")
    def test_launch_requires_wine(self):
        with tempfile.TemporaryDirectory() as temp:
            target=Path(temp)/"game.exe"
            target.write_bytes(pe_header())
            with patch("launch_local.sys.platform","linux"),patch("launch_local.shutil.which",return_value=None):
                with self.assertRaisesRegex(RuntimeError,"Wine is not installed"):
                    launch(target,Path(temp)/"prefixes")
    def test_invalid_exe_never_runs(self):
        with tempfile.TemporaryDirectory() as temp:
            target=Path(temp)/"fake.exe"
            target.write_bytes(b"invalid")
            with self.assertRaises(ValueError):
                launch(target,Path(temp)/"prefixes")
if __name__=="__main__":
    unittest.main()
