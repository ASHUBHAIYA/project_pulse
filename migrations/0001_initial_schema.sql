-- Migration 0001: Initial Schema for ProjectPulse
-- Database: projectpulse-db

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'android' | 'web' | 'both'
  description TEXT,
  repository_url TEXT,
  active_step_id TEXT,
  steps_json TEXT NOT NULL, -- JSON array of steps and checklist items
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Distractions (Idea Parking Lot) Table
CREATE TABLE IF NOT EXISTS distractions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  project_id TEXT,
  resolved INTEGER NOT NULL DEFAULT 0, -- 0 = active, 1 = resolved
  created_at TEXT NOT NULL
);

-- 3. Focus Sessions Table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  active_project_id TEXT,
  active_step_id TEXT,
  timer_seconds_left INTEGER NOT NULL DEFAULT 1500,
  target_minutes INTEGER NOT NULL DEFAULT 25,
  total_focus_minutes INTEGER NOT NULL DEFAULT 0,
  sound_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

-- 4. Application Meta Table
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_platform ON projects(platform);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_distractions_resolved ON distractions(resolved);
