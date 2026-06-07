-- ============================================================
-- LiftIQ — Neon (Postgres) schema. PRIMARY database.
-- Security is enforced at the API layer (session cookie), so there is
-- no row-level security here. Every data row carries user_id and the
-- server scopes all queries by the authenticated user.
-- Run with:  node scripts/migrate-neon.mjs
-- ============================================================

create extension if not exists "pgcrypto";

-- 0. Users (custom auth — replaces Supabase auth.users)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null default '',
  supabase_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_email on users(lower(email));
create index if not exists idx_users_supabase_id on users(supabase_id);

-- 1. Profiles (1:1 with users)
create table if not exists profiles (
  id uuid primary key references users(id) on delete cascade,
  name text not null default '',
  age integer not null default 0,
  weight numeric not null default 0,
  height integer not null default 0,
  gender text not null default 'male',
  activity_level text not null default 'moderate',
  disabilities text not null default '',
  weight_goal text not null default 'maintain',
  calorie_goal integer not null default 2000,
  use_recommended_calories boolean not null default true,
  has_completed_onboarding boolean not null default false,
  voice_enabled boolean not null default false,
  sensitivity text not null default 'medium',
  camera_facing text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Workout sessions
create table if not exists workout_sessions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  exercise text not null,
  exercise_name text,
  weight numeric,
  start_time bigint not null,
  end_time bigint,
  reps jsonb not null default '[]',
  total_score integer not null default 0,
  calories_burned numeric not null default 0,
  is_recorded boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_workout_sessions_user_id on workout_sessions(user_id);
create index if not exists idx_workout_sessions_start_time on workout_sessions(start_time);

-- 3. Food log
create table if not exists food_log (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  calories integer not null default 0,
  protein numeric,
  carbs numeric,
  fat numeric,
  serving_size numeric,
  serving_unit text,
  servings numeric not null default 1,
  date text not null,
  meal text,
  created_at timestamptz not null default now()
);
create index if not exists idx_food_log_user_id on food_log(user_id);
create index if not exists idx_food_log_date on food_log(date);

-- 4. User exercises
create table if not exists user_exercises (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  tracking_id text not null default 'custom',
  weight numeric,
  target_reps integer,
  target_sets integer,
  notes text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_exercises_user_id on user_exercises(user_id);

-- 5. Streaks (1:1 with users)
create table if not exists streaks (
  user_id uuid primary key references users(id) on delete cascade,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_workout_date text not null default '',
  workout_dates jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- 6. Workout routines
create table if not exists workout_routines (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  exercises jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_workout_routines_user_id on workout_routines(user_id);

-- 7. Recordings metadata (video blobs stay in the browser's IndexedDB;
--    only metadata is synced here so the library can list them)
create table if not exists recordings (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  session_id text,
  exercise text not null,
  exercise_name text not null,
  reps integer not null default 0,
  score integer not null default 0,
  duration integer not null default 0,
  size integer not null default 0,
  storage_path text,
  created_at timestamptz not null default now()
);
create index if not exists idx_recordings_user_id on recordings(user_id);
create index if not exists idx_recordings_session_id on recordings(session_id);
