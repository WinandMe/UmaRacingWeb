# Uma Racing Web - Database Schema

## Core Tables

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('trainee', 'trainer', 'admin')),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_until TIMESTAMPTZ NULL,
  banned_reason TEXT NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

### trainees (Uma Musume)
```sql
CREATE TABLE trainees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  trainer_id INT REFERENCES users(id) ON DELETE SET NULL,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,  -- If trainee role owns this
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT trainee_ownership CHECK (
    (trainer_id IS NOT NULL AND user_id IS NULL) OR
    (trainer_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_trainees_trainer ON trainees(trainer_id);
CREATE INDEX idx_trainees_user ON trainees(user_id);
```

### trainee_stats
```sql
CREATE TABLE trainee_stats (
  id SERIAL PRIMARY KEY,
  trainee_id INT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  speed INT NOT NULL CHECK (speed >= 0 AND speed <= 9999),
  stamina INT NOT NULL CHECK (stamina >= 0 AND stamina <= 9999),
  power INT NOT NULL CHECK (power >= 0 AND power <= 9999),
  guts INT NOT NULL CHECK (guts >= 0 AND guts <= 9999),
  wit INT NOT NULL CHECK (wit >= 0 AND wit <= 9999),
  submitted_by INT NOT NULL REFERENCES users(id),
  submitted_role VARCHAR(20) NOT NULL CHECK (submitted_role IN ('trainee', 'trainer', 'admin')),
  bypass_validation BOOLEAN DEFAULT FALSE,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trainee_stats_trainee ON trainee_stats(trainee_id);
CREATE INDEX idx_trainee_stats_timestamp ON trainee_stats(trainee_id, timestamp DESC);
```

---

## Race Tables

### races
```sql
CREATE TABLE races (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  race_category VARCHAR(50),  -- G1, G2, G3, International
  racecourse VARCHAR(100),
  distance INT NOT NULL,
  surface VARCHAR(20),
  race_type VARCHAR(50),
  track_condition VARCHAR(20),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'finished', 'cancelled')),
  config_json JSONB,  -- Store full race config
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_scheduled ON races(scheduled_at);
```

### race_participants
```sql
CREATE TABLE race_participants (
  id SERIAL PRIMARY KEY,
  race_id INT NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  trainee_id INT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  gate_number INT NOT NULL,
  running_style VARCHAR(10),
  mood VARCHAR(20),
  stats_snapshot JSONB NOT NULL,  -- Snapshot of stats at race time
  skills JSONB,
  distance_aptitude JSONB,
  surface_aptitude JSONB,
  final_position INT,
  finish_time NUMERIC(10, 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(race_id, trainee_id),
  UNIQUE(race_id, gate_number)
);

CREATE INDEX idx_race_participants_race ON race_participants(race_id);
CREATE INDEX idx_race_participants_trainee ON race_participants(trainee_id);
```

### race_results
```sql
CREATE TABLE race_results (
  id SERIAL PRIMARY KEY,
  race_id INT NOT NULL REFERENCES races(id) ON DELETE CASCADE UNIQUE,
  result_data JSONB NOT NULL,  -- Full race result including all frames
  replay_data JSONB,  -- Store replay frames
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_race_results_race ON race_results(race_id);
```

---

## Social Tables

### chat_messages
```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_ooc BOOLEAN DEFAULT TRUE,  -- Out-of-character
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by INT REFERENCES users(id),
  deleted_reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
```

### friendships
```sql
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

### direct_messages
```sql
CREATE TABLE direct_messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_receiver BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_dm_sender ON direct_messages(sender_id, timestamp DESC);
CREATE INDEX idx_dm_receiver ON direct_messages(receiver_id, timestamp DESC);
CREATE INDEX idx_dm_conversation ON direct_messages(sender_id, receiver_id, timestamp DESC);
```

---

## Admin & Audit Tables

### admin_audit_log
```sql
CREATE TABLE admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),  -- 'user', 'trainee', 'stats', 'race', 'chat'
  target_id INT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_admin_audit_timestamp ON admin_audit_log(timestamp DESC);
```

### system_config
```sql
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by INT REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default configs
INSERT INTO system_config (key, value) VALUES
('stat_limits', '{"min": 0, "max": 9999, "total_cap": null}'),
('race_defaults', '{"max_participants": 18, "min_participants": 2}'),
('chat_settings', '{"max_message_length": 500, "rate_limit_seconds": 2}');
```

---

## Seed Data

### Default Admin User
```sql
INSERT INTO users (username, password_hash, role, email)
VALUES (
  'SafiA',
  '$2b$12$...',  -- Hash of 'PILAHAN2008'
  'admin',
  'admin@umaracing.local'
);
```

---

## Migration Plan

1. Create users table
2. Create trainees table
3. Create trainee_stats table
4. Create races and race-related tables
5. Create social tables (chat, friends, DMs)
6. Create admin audit and config tables
7. Insert seed data
8. Add foreign key constraints
9. Create indexes

---

## Notes

- All timestamps use `TIMESTAMPTZ` for timezone awareness
- Foreign keys use appropriate `ON DELETE` strategies
- Indexes on common query patterns (user lookups, race participants, chat history)
- Admin actions are fully auditable
- Stats are immutable once used in a race (snapshot stored)
