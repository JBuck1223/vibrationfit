-- ============================================================================
-- Admin Roles System
-- Migration: 20260102000003_admin_roles.sql
-- Description: Database-driven admin and role management system
-- ============================================================================

-- ============================================================================
-- ROLE TYPE ENUM
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'member',       -- Regular member (default)
  'coach',        -- Can host sessions, view assigned members
  'admin',        -- Full admin access
  'super_admin'   -- Can manage other admins
);

-- ============================================================================
-- ADD ROLE COLUMN TO PROFILES
-- ============================================================================

ALTER TABLE profiles 
ADD COLUMN role user_role DEFAULT 'member' NOT NULL;

-- Create index for role lookups
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================================
-- ADMIN PERMISSIONS TABLE (for granular permissions)
-- ============================================================================

CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Permission definition
  permission_key TEXT UNIQUE NOT NULL,    -- e.g., 'users.view', 'templates.edit'
  name TEXT NOT NULL,                      -- Human-readable name
  description TEXT,                        -- What this permission allows
  category TEXT NOT NULL,                  -- Grouping: 'users', 'content', 'billing', etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROLE PERMISSIONS JUNCTION TABLE
-- ============================================================================

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id UUID REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role, permission_id)
);

-- ============================================================================
-- ADMIN AUDIT LOG
-- ============================================================================

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who did it
  admin_user_id UUID REFERENCES auth.users(id),
  admin_email TEXT,
  
  -- What they did
  action TEXT NOT NULL,                    -- 'role_change', 'login', 'setting_change', etc.
  entity_type TEXT,                        -- 'user', 'template', 'setting', etc.
  entity_id UUID,
  
  -- Details
  details JSONB,                           -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_admin_permissions_category ON admin_permissions(category);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_admin_audit_log_admin ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin permissions: All authenticated can read
CREATE POLICY "Authenticated can read permissions"
  ON admin_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Role permissions: All authenticated can read
CREATE POLICY "Authenticated can read role permissions"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Audit log: Only super_admins can view
CREATE POLICY "Admins can view audit log"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(permission TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
BEGIN
  -- Get user's role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Super admins have all permissions
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check role permissions
  RETURN EXISTS (
    SELECT 1 FROM role_permissions rp
    JOIN admin_permissions ap ON ap.id = rp.permission_id
    WHERE rp.role = user_role AND ap.permission_key = permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role AS $$
DECLARE
  result user_role;
BEGIN
  SELECT role INTO result FROM profiles WHERE id = user_id;
  RETURN COALESCE(result, 'member');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DEFAULT PERMISSIONS
-- ============================================================================

INSERT INTO admin_permissions (permission_key, name, description, category) VALUES
-- User management
('users.view', 'View Users', 'View user list and profiles', 'users'),
('users.edit', 'Edit Users', 'Edit user profiles', 'users'),
('users.roles', 'Manage Roles', 'Change user roles', 'users'),
('users.delete', 'Delete Users', 'Delete user accounts', 'users'),

-- Content management
('templates.view', 'View Templates', 'View email and SMS templates', 'content'),
('templates.edit', 'Edit Templates', 'Create and edit templates', 'content'),
('templates.delete', 'Delete Templates', 'Delete templates', 'content'),

-- Sessions
('sessions.view', 'View Sessions', 'View all video sessions', 'sessions'),
('sessions.manage', 'Manage Sessions', 'Create, edit, delete sessions', 'sessions'),
('sessions.join_any', 'Join Any Session', 'Join any session as host', 'sessions'),

-- Billing
('billing.view', 'View Billing', 'View billing information', 'billing'),
('billing.manage', 'Manage Billing', 'Manage subscriptions and payments', 'billing'),

-- Settings
('settings.view', 'View Settings', 'View system settings', 'settings'),
('settings.edit', 'Edit Settings', 'Change system settings', 'settings'),

-- Analytics
('analytics.view', 'View Analytics', 'View analytics and reports', 'analytics'),
('analytics.export', 'Export Data', 'Export analytics data', 'analytics');

-- Assign all permissions to admin role
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM admin_permissions;

-- Assign limited permissions to coach role
INSERT INTO role_permissions (role, permission_id)
SELECT 'coach', id FROM admin_permissions 
WHERE permission_key IN (
  'users.view',
  'sessions.view',
  'sessions.manage',
  'templates.view'
);

-- ============================================================================
-- MIGRATE EXISTING ADMINS (from hardcoded list)
-- ============================================================================

-- Set existing admins based on email
UPDATE profiles 
SET role = 'super_admin' 
WHERE email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE admin_permissions IS 'Granular permissions that can be assigned to roles';
COMMENT ON TABLE role_permissions IS 'Maps roles to their permissions';
COMMENT ON TABLE admin_audit_log IS 'Audit trail of admin actions';
COMMENT ON COLUMN profiles.role IS 'User role: member, coach, admin, super_admin';
COMMENT ON FUNCTION is_admin IS 'Check if user has admin or super_admin role';
COMMENT ON FUNCTION has_permission IS 'Check if user has a specific permission';



