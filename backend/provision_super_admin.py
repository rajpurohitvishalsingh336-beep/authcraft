#!/usr/bin/env python3
"""
AuthCraft Super Admin Server-Side Provisioning Tool
==================================================
Securely provisions initial Super Admin accounts directly into the database.
Enforces Argon2id hashing and generates RFC 6238 Base32 TOTP MFA credentials.
Never exposed via public endpoints.
"""

import argparse
import sys
import pyotp

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.super_admin import SuperAdmin


def provision(email: str, password: str, full_name: str, enable_mfa: bool = True):
    email = email.strip().lower()
    db = SessionLocal()
    try:
        # Check if already exists
        admin = db.query(SuperAdmin).filter(SuperAdmin.email == email).first()
        totp_secret = pyotp.random_base32()
        password_hash = get_password_hash(password)

        if admin:
            print(f"[!] Updating existing Super Admin account: {email}")
            admin.password_hash = password_hash
            admin.full_name = full_name
            admin.totp_secret = totp_secret
            admin.is_mfa_enabled = enable_mfa
            admin.is_active = True
        else:
            print(f"[+] Provisioning new Super Admin account: {email}")
            admin = SuperAdmin(
                email=email,
                password_hash=password_hash,
                full_name=full_name,
                totp_secret=totp_secret,
                is_mfa_enabled=enable_mfa,
                role="super_admin",
                is_active=True,
            )
            db.add(admin)

        db.commit()
        db.refresh(admin)

        totp = pyotp.TOTP(totp_secret)
        otpauth_uri = totp.provisioning_uri(name=email, issuer_name="AuthCraft Super Admin")

        print("=" * 65)
        print(" SUPER ADMIN PROVISIONING SUCCESSFUL ")
        print("=" * 65)
        print(f" Super Admin ID : {admin.id}")
        print(f" Email          : {admin.email}")
        print(f" Role           : {admin.role}")
        print(f" TOTP Secret    : {totp_secret}")
        print(f" Provisioning URI:\n {otpauth_uri}")
        print("=" * 65)
        print(" [IMPORTANT] Add the TOTP secret to Google Authenticator / 1Password.")
        print(" Use this 6-digit TOTP code during /super-admin login.")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"[-] Error during provisioning: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="AuthCraft Super Admin Provisioning Tool")
    parser.add_argument("--email", default="admin@authcraft.io", help="Super Admin Email")
    parser.add_argument("--password", default="SuperAdminSecret2026!", help="Super Admin Password")
    parser.add_argument("--name", default="Platform Super Admin", help="Full Name")
    parser.add_argument("--no-mfa", action="store_true", help="Disable mandatory TOTP MFA (not recommended)")

    args = parser.parse_args()
    provision(args.email, args.password, args.name, enable_mfa=not args.no_mfa)


if __name__ == "__main__":
    main()
