#!/usr/bin/env python
"""Script to seed demo accounts into the database"""

import sys
sys.path.insert(0, '.')

from app.db import SessionLocal, init_db
from app.models.database import User
from app.services.auth_service import hash_password
from datetime import datetime

def seed_demo_accounts():
    """Create demo accounts if they don't exist"""
    # First, initialize database tables
    init_db()
    print("[OK] Database tables initialized")
    
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Check and create trainee_demo
        existing = db.query(User).filter(User.username == "trainee_demo").first()
        if not existing:
            trainee = User(
                username="trainee_demo",
                email="trainee@demo.local",
                password_hash=hash_password("password123"),
                role="trainee",
                is_active=True,
                is_banned=False,
                created_at=now,
                last_login=now
            )
            db.add(trainee)
            print("[OK] Created demo account: trainee_demo / password123")
        
        # Check and create trainer_demo
        existing = db.query(User).filter(User.username == "trainer_demo").first()
        if not existing:
            trainer = User(
                username="trainer_demo",
                email="trainer@demo.local",
                password_hash=hash_password("password123"),
                role="trainer",
                is_active=True,
                is_banned=False,
                created_at=now,
                last_login=now
            )
            db.add(trainer)
            print("[OK] Created demo account: trainer_demo / password123")
        
        # Check and create admin
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            admin = User(
                username="admin",
                email="admin@demo.local",
                password_hash=hash_password("admin123"),
                role="admin",
                is_active=True,
                is_banned=False,
                created_at=now,
                last_login=now
            )
            db.add(admin)
            print("[OK] Created demo account: admin / admin123")
        
        db.commit()
        print("\n[OK] Demo accounts seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Could not seed demo accounts: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_accounts()
