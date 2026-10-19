"""tests/test_security.py - Security service tests"""
import pytest
from app.services.security_service import PasswordPolicy, FieldEncryption


class TestPasswordPolicy:
    def test_strong_password(self):
        r = PasswordPolicy.validate("MyStr0ng@Pass!xx")
        assert r["valid"] is True
        assert r["strength"] >= 80

    def test_weak_password_too_short(self):
        r = PasswordPolicy.validate("Ab1!")
        assert r["valid"] is False
        assert any("too_short" in issue for issue in r["issues"])

    def test_missing_uppercase(self):
        r = PasswordPolicy.validate("mystr0ng@pass!xx")
        assert "missing_uppercase" in r["issues"]

    def test_missing_lowercase(self):
        r = PasswordPolicy.validate("MYSTR0NG@PASS!XX")
        assert "missing_lowercase" in r["issues"]

    def test_missing_digit(self):
        r = PasswordPolicy.validate("MyStrng@Pass!xx")
        assert "missing_digit" in r["issues"]

    def test_missing_special(self):
        r = PasswordPolicy.validate("MyStr0ngPassxx")
        assert "missing_special" in r["issues"]

    def test_common_password_penalized(self):
        r = PasswordPolicy.validate("password")
        assert r["strength"] <= 10


class TestFieldEncryption:
    def test_encrypt_decrypt_roundtrip(self):
        original = "sensitive-data-123"
        encrypted = FieldEncryption.encrypt(original)
        assert encrypted != original
        assert FieldEncryption.decrypt(encrypted) == original

    def test_empty_string(self):
        assert FieldEncryption.encrypt("") == ""
        assert FieldEncryption.decrypt("") == ""

    def test_unicode(self):
        text = "كلمة سر سرية 🔐"
        assert FieldEncryption.decrypt(FieldEncryption.encrypt(text)) == text
