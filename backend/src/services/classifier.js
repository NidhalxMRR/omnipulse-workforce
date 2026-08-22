// Heuristic & Rule-based Classifier for Call Center Workforce Telemetry

const CALL_DOMAINS = [
  'genesys.cloud', 'five9.com', 'talk.zendesk.com', 'amazonconnect.com',
  'twilio.com', '3cx.com', 'aircall.io', 'zoom.us', 'teams.microsoft.com'
];

const WORK_DOMAINS = [
  'salesforce.com', 'zendesk.com', 'hubspot.com', 'jira.atlassian.com',
  'confluence.atlassian.com', 'servicenow.com', 'slack.com', 'google.com/docs'
];

const UNPRODUCTIVE_DOMAINS = [
  'youtube.com', 'netflix.com', 'facebook.com', 'instagram.com',
  'tiktok.com', 'reddit.com', 'twitter.com', 'x.com', 'twitch.tv'
];

export function classifyTelemetry(event, previousPresence = null) {
  const domain = (event.domain || event.app || '').toLowerCase().trim();
  const isInCall = Boolean(event.is_in_call || event.is_audible);
  const isIdle = Boolean(event.is_idle);

  let category = 'NEUTRAL';
  let state = 'ACTIVE';

  // 1. In Call Priority
  if (isInCall || CALL_DOMAINS.some(d => domain.includes(d))) {
    category = 'CALL_TOOL';
    state = 'IN_CALL';
    return { state, category, domain, isInCall: true, isIdle: false };
  }

  // 2. Wrap-up / After Call Work (ACW)
  if (
    previousPresence &&
    previousPresence.current_state === 'IN_CALL' &&
    !isInCall &&
    WORK_DOMAINS.some(d => domain.includes(d))
  ) {
    category = 'WRAP_UP';
    state = 'WRAP_UP';
    return { state, category, domain, isInCall: false, isIdle: false };
  }

  // 3. Inactivity / Idle
  if (isIdle) {
    category = 'NEUTRAL';
    state = 'IDLE';
    return { state, category, domain, isInCall: false, isIdle: true };
  }

  // 4. Work Apps / CRM
  if (WORK_DOMAINS.some(d => domain.includes(d))) {
    category = 'WORK_APP';
    state = 'ACTIVE';
    return { state, category, domain, isInCall: false, isIdle: false };
  }

  // 5. Unproductive / Distraction
  if (UNPRODUCTIVE_DOMAINS.some(d => domain.includes(d))) {
    category = 'UNPRODUCTIVE';
    state = 'UNPRODUCTIVE';
    return { state, category, domain, isInCall: false, isIdle: false };
  }

  return {
    state: 'ACTIVE',
    category: 'WORK_APP',
    domain: domain || 'Internal Portal',
    isInCall: false,
    isIdle: false
  };
}
