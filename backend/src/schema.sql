-- =========================================================================
-- DATABASE INITIALIZATION & SCHEMA: WORKFORCE & CALL CENTER TRACKER
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Multi-tenant ready)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Teams / Queues (e.g., Inbound Support, VIP Escalations, Outbound Sales)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color_badge VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users (Agents & Supervisors)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'AGENT', -- AGENT, SUPERVISOR, ADMIN
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Real-time Agent Live State Table
CREATE TABLE IF NOT EXISTS agent_presence (
    agent_id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_state VARCHAR(50) NOT NULL DEFAULT 'OFFLINE', -- ACTIVE, IN_CALL, WRAP_UP, IDLE, BREAK, OFFLINE, SUSPICIOUS
    current_app_or_domain VARCHAR(255) DEFAULT 'None',
    is_in_call BOOLEAN DEFAULT FALSE,
    call_duration_seconds INTEGER DEFAULT 0,
    current_state_duration_seconds INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    schedule_adherence_percent INTEGER DEFAULT 95,
    today_active_seconds INTEGER DEFAULT 0,
    today_call_seconds INTEGER DEFAULT 0,
    today_idle_seconds INTEGER DEFAULT 0
);

-- 5. Heartbeat & Activity Telemetry (Time-Series)
CREATE TABLE IF NOT EXISTS heartbeats (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    domain_or_app VARCHAR(255) NOT NULL,
    activity_category VARCHAR(50) NOT NULL, -- WORK_APP, CALL_TOOL, WRAP_UP, NEUTRAL, UNPRODUCTIVE
    state VARCHAR(50) NOT NULL,
    is_in_call BOOLEAN DEFAULT FALSE,
    is_idle BOOLEAN DEFAULT FALSE,
    duration_seconds INTEGER DEFAULT 15,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_agent_time ON heartbeats(agent_id, recorded_at DESC);

-- 6. Category Rules (Configurable Whitelist / Blacklist)
CREATE TABLE IF NOT EXISTS category_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_pattern VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- WORK_APP, CALL_TOOL, WRAP_UP, UNPRODUCTIVE, NEUTRAL
    description VARCHAR(255)
);

-- =========================================================================
-- SEED INITIAL DATA FOR DEMO & OUT-OF-THE-BOX WORKABILITY
-- =========================================================================

-- Insert Org
INSERT INTO organizations (id, name)
VALUES ('a0000000-0000-0000-0000-000000000001', 'OmniChannel Call Center Global')
ON CONFLICT (id) DO NOTHING;

-- Insert Teams
INSERT INTO teams (id, org_id, name, color_badge) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Tier 1 Inbound Support', '#10B981'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'VIP Customer Success', '#6366F1'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Outbound Sales & Retention', '#F59E0B')
ON CONFLICT (id) DO NOTHING;

-- Insert Category Rules
INSERT INTO category_rules (match_pattern, category, description) VALUES
('zendesk.com', 'CALL_TOOL', 'Zendesk Support & Talk WebRTC'),
('salesforce.com', 'WORK_APP', 'Salesforce Service Cloud CRM'),
('genesys.cloud', 'CALL_TOOL', 'Genesys Cloud CX WebRTC Softphone'),
('five9.com', 'CALL_TOOL', 'Five9 Cloud Contact Center'),
('app.hubspot.com', 'WORK_APP', 'HubSpot Support Desk'),
('jira.atlassian.com', 'WORK_APP', 'Jira Issue Escalation'),
('youtube.com', 'UNPRODUCTIVE', 'Streaming Entertainment'),
('netflix.com', 'UNPRODUCTIVE', 'Video Streaming'),
('facebook.com', 'UNPRODUCTIVE', 'Social Media'),
('reddit.com', 'NEUTRAL', 'Community Research')
ON CONFLICT (match_pattern) DO NOTHING;

-- Insert Sample Agents
INSERT INTO users (id, org_id, team_id, full_name, email, role, avatar_url) VALUES
('agent-1', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Sarah Jenkins', 'sarah.j@callcenter.com', 'AGENT', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
('agent-2', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Karim Mansour', 'karim.m@callcenter.com', 'AGENT', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
('agent-3', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Elena Rostova', 'elena.r@callcenter.com', 'AGENT', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('agent-4', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Marcus Vance', 'marcus.v@callcenter.com', 'AGENT', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('agent-5', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Priya Sharma', 'priya.s@callcenter.com', 'AGENT', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150')
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Live Presence
INSERT INTO agent_presence (agent_id, current_state, current_app_or_domain, is_in_call, call_duration_seconds, current_state_duration_seconds, schedule_adherence_percent, today_active_seconds, today_call_seconds, today_idle_seconds) VALUES
('agent-1', 'IN_CALL', 'genesys.cloud (Live Voice)', true, 312, 312, 98, 18400, 11200, 1200),
('agent-2', 'ACTIVE', 'salesforce.com (Lead #9042)', false, 0, 480, 94, 19200, 8400, 900),
('agent-3', 'WRAP_UP', 'zendesk.com (Ticket Wrap #4412)', false, 0, 85, 100, 21000, 13400, 600),
('agent-4', 'IDLE', 'youtube.com', false, 0, 240, 78, 14200, 5200, 4800),
('agent-5', 'BREAK', 'Lunch Break', false, 0, 620, 99, 15000, 9100, 800)
ON CONFLICT (agent_id) DO UPDATE SET
    current_state = EXCLUDED.current_state,
    current_app_or_domain = EXCLUDED.current_app_or_domain,
    is_in_call = EXCLUDED.is_in_call;
