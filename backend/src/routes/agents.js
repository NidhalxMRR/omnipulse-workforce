import { Router } from 'express';
import { query } from '../db.js';
import { broadcastAgentUpdate } from '../services/websocket.js';

const router = Router();

// GET /api/v1/agents - Fetch all agents with their live presence & team details
router.get('/', async (req, res) => {
  try {
    const { team_id, status } = req.query;

    let sql = `
      SELECT 
        u.id, u.full_name, u.email, u.role, u.avatar_url,
        t.id as team_id, t.name as team_name, t.color_badge as team_color,
        COALESCE(p.current_state, 'OFFLINE') as current_state,
        COALESCE(p.current_app_or_domain, 'None') as current_app_or_domain,
        COALESCE(p.is_in_call, false) as is_in_call,
        COALESCE(p.call_duration_seconds, 0) as call_duration_seconds,
        COALESCE(p.current_state_duration_seconds, 0) as current_state_duration_seconds,
        COALESCE(p.schedule_adherence_percent, 95) as schedule_adherence_percent,
        COALESCE(p.today_active_seconds, 0) as today_active_seconds,
        COALESCE(p.today_call_seconds, 0) as today_call_seconds,
        COALESCE(p.today_idle_seconds, 0) as today_idle_seconds,
        p.last_heartbeat
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN agent_presence p ON u.id = p.agent_id
      WHERE u.role = 'AGENT'
    `;

    const params = [];
    if (team_id) {
      params.push(team_id);
      sql += ` AND u.team_id = $${params.length}`;
    }
    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND p.current_state = $${params.length}`;
    }

    sql += ' ORDER BY u.full_name ASC';

    const result = await query(sql, params);
    return res.json({ agents: result.rows });
  } catch (err) {
    console.error('[Get Agents Error]', err);
    return res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET /api/v1/agents/teams - Fetch team list
router.get('/teams', async (req, res) => {
  try {
    const result = await query('SELECT * FROM teams ORDER BY name ASC');
    return res.json({ teams: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/v1/agents/:id/state - Override / Set agent state (e.g. BREAK, LOGOUT)
router.post('/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { state, note } = req.body;

    const result = await query(
      `INSERT INTO agent_presence (agent_id, current_state, current_app_or_domain, current_state_duration_seconds, last_heartbeat)
       VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
       ON CONFLICT (agent_id) DO UPDATE SET
         current_state = EXCLUDED.current_state,
         current_app_or_domain = EXCLUDED.current_app_or_domain,
         current_state_duration_seconds = 0,
         last_heartbeat = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, state, note || 'Manual Status Change']
    );

    const userRes = await query('SELECT full_name, email, avatar_url, team_id FROM users WHERE id = $1', [id]);
    const user = userRes.rows[0] || {};

    const updated = {
      ...result.rows[0],
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      team_id: user.team_id
    };

    broadcastAgentUpdate(updated);
    return res.json({ agent: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update agent status' });
  }
});

export default router;
