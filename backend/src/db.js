import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres_secure_password_123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'workforce_tracker'}`;

export let isPostgresAvailable = false;

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
});

// -------------------------------------------------------------
// IN-MEMORY FALLBACK STORE (Active if PostgreSQL/Docker is down)
// -------------------------------------------------------------
const inMemoryStore = {
  teams: [
    { id: 'b0000000-0000-0000-0000-000000000001', name: 'Tier 1 Inbound Support', color_badge: '#10B981' },
    { id: 'b0000000-0000-0000-0000-000000000002', name: 'VIP Customer Success', color_badge: '#6366F1' },
    { id: 'b0000000-0000-0000-0000-000000000003', name: 'Outbound Sales & Retention', color_badge: '#F59E0B' }
  ],
  users: [
    { id: 'agent-1', team_id: 'b0000000-0000-0000-0000-000000000001', full_name: 'Sarah Jenkins', email: 'sarah.j@callcenter.com', role: 'AGENT', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 'agent-2', team_id: 'b0000000-0000-0000-0000-000000000001', full_name: 'Karim Mansour', email: 'karim.m@callcenter.com', role: 'AGENT', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'agent-3', team_id: 'b0000000-0000-0000-0000-000000000002', full_name: 'Elena Rostova', email: 'elena.r@callcenter.com', role: 'AGENT', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 'agent-4', team_id: 'b0000000-0000-0000-0000-000000000002', full_name: 'Marcus Vance', email: 'marcus.v@callcenter.com', role: 'AGENT', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { id: 'agent-5', team_id: 'b0000000-0000-0000-0000-000000000003', full_name: 'Priya Sharma', email: 'priya.s@callcenter.com', role: 'AGENT', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' }
  ],
  presence: {
    'agent-1': { agent_id: 'agent-1', current_state: 'IN_CALL', current_app_or_domain: 'genesys.cloud (Live Voice)', is_in_call: true, call_duration_seconds: 312, current_state_duration_seconds: 312, schedule_adherence_percent: 98, today_active_seconds: 18400, today_call_seconds: 11200, today_idle_seconds: 1200, last_heartbeat: new Date().toISOString() },
    'agent-2': { agent_id: 'agent-2', current_state: 'ACTIVE', current_app_or_domain: 'salesforce.com (Lead #9042)', is_in_call: false, call_duration_seconds: 0, current_state_duration_seconds: 480, schedule_adherence_percent: 94, today_active_seconds: 19200, today_call_seconds: 8400, today_idle_seconds: 900, last_heartbeat: new Date().toISOString() },
    'agent-3': { agent_id: 'agent-3', current_state: 'WRAP_UP', current_app_or_domain: 'zendesk.com (Ticket #4412)', is_in_call: false, call_duration_seconds: 0, current_state_duration_seconds: 85, schedule_adherence_percent: 100, today_active_seconds: 21000, today_call_seconds: 13400, today_idle_seconds: 600, last_heartbeat: new Date().toISOString() },
    'agent-4': { agent_id: 'agent-4', current_state: 'IDLE', current_app_or_domain: 'youtube.com', is_in_call: false, call_duration_seconds: 0, current_state_duration_seconds: 240, schedule_adherence_percent: 78, today_active_seconds: 14200, today_call_seconds: 5200, today_idle_seconds: 4800, last_heartbeat: new Date().toISOString() },
    'agent-5': { agent_id: 'agent-5', current_state: 'BREAK', current_app_or_domain: 'Lunch Break', is_in_call: false, call_duration_seconds: 0, current_state_duration_seconds: 620, schedule_adherence_percent: 99, today_active_seconds: 15000, today_call_seconds: 9100, today_idle_seconds: 800, last_heartbeat: new Date().toISOString() }
  },
  heartbeats: []
};

export async function query(text, params = []) {
  if (isPostgresAvailable) {
    try {
      return await pool.query(text, params);
    } catch (e) {
      console.warn('[Postgres Query Failed, switching to in-memory]', e.message);
      isPostgresAvailable = false;
    }
  }

  // Handle in-memory query emulation
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');

  // 1. Select Agents
  if (normalized.includes('select u.id, u.full_name')) {
    const rows = inMemoryStore.users.map(u => {
      const p = inMemoryStore.presence[u.id] || {};
      const t = inMemoryStore.teams.find(tm => tm.id === u.team_id) || {};
      return {
        ...u,
        team_name: t.name,
        team_color: t.color_badge,
        ...p
      };
    });
    return { rows, rowCount: rows.length };
  }

  // 2. Select Teams
  if (normalized.includes('select * from teams')) {
    return { rows: inMemoryStore.teams, rowCount: inMemoryStore.teams.length };
  }

  // 3. Analytics Summary
  if (normalized.includes('count(*) filter')) {
    const list = Object.values(inMemoryStore.presence);
    const summary = {
      total_agents: list.length,
      agents_in_call: list.filter(p => p.current_state === 'IN_CALL').length,
      agents_active: list.filter(p => p.current_state === 'ACTIVE').length,
      agents_wrapup: list.filter(p => p.current_state === 'WRAP_UP').length,
      agents_idle: list.filter(p => p.current_state === 'IDLE').length,
      agents_on_break: list.filter(p => p.current_state === 'BREAK').length,
      avg_adherence: 95,
      total_active_sec: list.reduce((acc, p) => acc + (p.today_active_seconds || 0), 0),
      total_call_sec: list.reduce((acc, p) => acc + (p.today_call_seconds || 0), 0),
      total_idle_sec: list.reduce((acc, p) => acc + (p.today_idle_seconds || 0), 0)
    };
    return { rows: [summary], rowCount: 1 };
  }

  // 4. Upsert Presence
  if (normalized.includes('insert into agent_presence')) {
    const agent_id = params[0];
    const current_state = params[1];
    const current_app_or_domain = params[2];
    const is_in_call = params[3];
    const prev = inMemoryStore.presence[agent_id] || {};

    const updated = {
      ...prev,
      agent_id,
      current_state,
      current_app_or_domain,
      is_in_call: Boolean(is_in_call),
      current_state_duration_seconds: (prev.current_state_duration_seconds || 0) + 15,
      call_duration_seconds: is_in_call ? (prev.call_duration_seconds || 0) + 15 : 0,
      today_active_seconds: (prev.today_active_seconds || 0) + (current_state !== 'IDLE' ? 15 : 0),
      today_call_seconds: (prev.today_call_seconds || 0) + (is_in_call ? 15 : 0),
      today_idle_seconds: (prev.today_idle_seconds || 0) + (current_state === 'IDLE' ? 15 : 0),
      last_heartbeat: new Date().toISOString()
    };
    inMemoryStore.presence[agent_id] = updated;
    return { rows: [updated], rowCount: 1 };
  }

  // 5. Select User
  if (normalized.includes('select full_name, email, avatar_url, team_id from users')) {
    const agent_id = params[0];
    const u = inMemoryStore.users.find(usr => usr.id === agent_id) || {};
    return { rows: [u], rowCount: 1 };
  }

  // 6. Select Previous Presence
  if (normalized.includes('select * from agent_presence where agent_id = $1')) {
    const agent_id = params[0];
    const p = inMemoryStore.presence[agent_id] || null;
    return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
  }

  // 7. Insert Heartbeat
  if (normalized.includes('insert into heartbeats')) {
    inMemoryStore.heartbeats.push({
      agent_id: params[0],
      domain_or_app: params[1],
      activity_category: params[2],
      state: params[3],
      is_in_call: params[4],
      is_idle: params[5],
      duration_seconds: params[6] || 15,
      recorded_at: new Date().toISOString()
    });
    return { rows: [], rowCount: 1 };
  }

  // 8. Timeline & Top Apps
  if (normalized.includes('select domain_or_app, activity_category, state')) {
    const agent_id = params[0];
    const list = inMemoryStore.heartbeats.filter(h => h.agent_id === agent_id).slice(-50).reverse();
    return { rows: list, rowCount: list.length };
  }

  if (normalized.includes('sum(duration_seconds) as total_duration')) {
    const agent_id = params[0];
    const list = inMemoryStore.heartbeats.filter(h => h.agent_id === agent_id);
    const map = {};
    for (const item of list) {
      if (!map[item.domain_or_app]) map[item.domain_or_app] = { domain_or_app: item.domain_or_app, activity_category: item.activity_category, total_duration: 0 };
      map[item.domain_or_app].total_duration += item.duration_seconds;
    }
    return { rows: Object.values(map), rowCount: Object.keys(map).length };
  }

  return { rows: [], rowCount: 0 };
}

export async function initDb() {
  try {
    const client = await pool.connect();
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      isPostgresAvailable = true;
      console.log('✅ Connected to PostgreSQL Database.');
    }
    client.release();
  } catch (err) {
    isPostgresAvailable = false;
    console.log('ℹ️  PostgreSQL not reachable (Docker offline). Running with In-Memory High-Speed Store.');
  }
}
