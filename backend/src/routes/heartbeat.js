import { Router } from 'express';
import { query } from '../db.js';
import { classifyTelemetry } from '../services/classifier.js';
import { broadcastAgentUpdate } from '../services/websocket.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { agent_id, events, client_version } = req.body;

    if (!agent_id || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'agent_id and events array are required' });
    }

    // Fetch previous presence for context-aware transitions (e.g., Wrap-up)
    const prevRes = await query('SELECT * FROM agent_presence WHERE agent_id = $1', [agent_id]);
    const previousPresence = prevRes.rows[0] || null;

    const latestEvent = events[events.length - 1];
    const classification = classifyTelemetry(latestEvent, previousPresence);

    const duration = latestEvent.duration_seconds || 15;

    // 1. Insert time-series heartbeat record
    await query(
      `INSERT INTO heartbeats (agent_id, domain_or_app, activity_category, state, is_in_call, is_idle, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        agent_id,
        classification.domain,
        classification.category,
        classification.state,
        classification.isInCall,
        classification.isIdle,
        duration
      ]
    );

    // 2. Upsert Agent Presence
    const stateDurationIncrement = previousPresence && previousPresence.current_state === classification.state
      ? (previousPresence.current_state_duration_seconds || 0) + duration
      : duration;

    const callDurationIncrement = classification.isInCall
      ? (previousPresence?.call_duration_seconds || 0) + duration
      : 0;

    const upsertRes = await query(
      `INSERT INTO agent_presence (
        agent_id, current_state, current_app_or_domain, is_in_call, 
        call_duration_seconds, current_state_duration_seconds, last_heartbeat,
        today_active_seconds, today_call_seconds, today_idle_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, $9)
      ON CONFLICT (agent_id) DO UPDATE SET
        current_state = EXCLUDED.current_state,
        current_app_or_domain = EXCLUDED.current_app_or_domain,
        is_in_call = EXCLUDED.is_in_call,
        call_duration_seconds = EXCLUDED.call_duration_seconds,
        current_state_duration_seconds = EXCLUDED.current_state_duration_seconds,
        last_heartbeat = CURRENT_TIMESTAMP,
        today_active_seconds = agent_presence.today_active_seconds + CASE WHEN EXCLUDED.current_state IN ('ACTIVE', 'WRAP_UP', 'IN_CALL') THEN $10 ELSE 0 END,
        today_call_seconds = agent_presence.today_call_seconds + CASE WHEN EXCLUDED.is_in_call THEN $10 ELSE 0 END,
        today_idle_seconds = agent_presence.today_idle_seconds + CASE WHEN EXCLUDED.current_state = 'IDLE' THEN $10 ELSE 0 END
      RETURNING *`,
      [
        agent_id,
        classification.state,
        classification.domain,
        classification.isInCall,
        callDurationIncrement,
        stateDurationIncrement,
        classification.state !== 'IDLE' ? duration : 0,
        classification.isInCall ? duration : 0,
        classification.isIdle ? duration : 0,
        duration
      ]
    );

    const updatedPresence = upsertRes.rows[0];

    // Fetch user details to broadcast rich payload to supervisor UI
    const userRes = await query('SELECT full_name, email, avatar_url, team_id FROM users WHERE id = $1', [agent_id]);
    const user = userRes.rows[0] || {};

    const broadcastPayload = {
      ...updatedPresence,
      full_name: user.full_name || agent_id,
      email: user.email,
      avatar_url: user.avatar_url,
      team_id: user.team_id
    };

    // 3. Broadcast to all active Supervisor screens
    broadcastAgentUpdate(broadcastPayload);

    return res.json({ status: 'ok', state: classification.state, recorded: events.length });
  } catch (err) {
    console.error('[Heartbeat Ingest Error]', err);
    return res.status(500).json({ error: 'Internal server error while processing heartbeat' });
  }
});

export default router;
