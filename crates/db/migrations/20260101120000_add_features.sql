PRAGMA foreign_keys = ON;

-- Create features table (project-scoped)
CREATE TABLE features (
    id          BLOB PRIMARY KEY,
    project_id  BLOB NOT NULL,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index for project_id lookups
CREATE INDEX idx_features_project_id ON features(project_id);

-- UNIQUE constraint to prevent duplicate feature names within the same project
CREATE UNIQUE INDEX idx_features_unique_name_project ON features(project_id, name);

-- Add feature_id column to tasks table
ALTER TABLE tasks ADD COLUMN feature_id BLOB REFERENCES features(id) ON DELETE SET NULL;

-- Index for feature_id lookups
CREATE INDEX idx_tasks_feature_id ON tasks(feature_id);
