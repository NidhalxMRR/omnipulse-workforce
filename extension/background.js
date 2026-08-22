// OmniPulse Agent Telemetry Service Worker (Manifest V3)

const DEFAULT_API_URL = 'http://localhost:5000/api/v1/heartbeat';
const SYNC_INTERVAL_SEC = 15;
const IDLE_THRESHOLD_SEC = 60;

let eventBuffer = [];
let currentTabState = {
  domain: 'chrome://newtab',
  isAudible: false,
  timestamp: Date.now()
};

// 1. Listen for Tab Focus Changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    recordTabState(tab);
  } catch (err) {
    console.error('Error onActivated', err);
  }
});

// 2. Listen for URL or Audio changes on the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active) {
    recordTabState(tab);
  }
});

function recordTabState(tab) {
  if (!tab || !tab.url) return;

  try {
    const urlObj = new URL(tab.url);
    const domain = urlObj.hostname || 'Local Browser';
    const isAudible = Boolean(tab.audible);

    currentTabState = {
      domain,
      isAudible,
      timestamp: Date.now()
    };
  } catch (e) {
    currentTabState = {
      domain: 'Browser Navigation',
      isAudible: false,
      timestamp: Date.now()
    };
  }
}

// 3. Heartbeat Alarm Loop (Runs every 15 seconds)
chrome.alarms.create('heartbeat_sync', { periodInMinutes: 0.25 }); // ~15 seconds

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'heartbeat_sync') {
    await processAndSendTelemetry();
  }
});

async function processAndSendTelemetry() {
  const { agentId = 'agent-1', apiUrl = DEFAULT_API_URL, isShiftActive = true } =
    await chrome.storage.local.get(['agentId', 'apiUrl', 'isShiftActive']);

  if (!isShiftActive) {
    // Tracking is strictly paused outside active shifts for agent privacy
    return;
  }

  // Check hardware idle state
  const idleState = await new Promise((resolve) => {
    chrome.idle.queryState(IDLE_THRESHOLD_SEC, resolve);
  });

  const isIdle = idleState === 'idle' || idleState === 'locked';

  const telemetryEvent = {
    domain: currentTabState.domain,
    is_in_call: currentTabState.isAudible,
    is_audible: currentTabState.isAudible,
    is_idle: isIdle,
    duration_seconds: SYNC_INTERVAL_SEC,
    recorded_at: new Date().toISOString()
  };

  eventBuffer.push(telemetryEvent);

  // Send batch to backend
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId,
        events: eventBuffer,
        client_version: '1.0.0-mv3'
      })
    });

    if (response.ok) {
      eventBuffer = []; // Clear buffer on success
    }
  } catch (err) {
    console.warn('[OmniPulse Extension] Telemetry offline spooling... network drop:', err.message);
    // Buffer retains events up to max 50 items for resilience
    if (eventBuffer.length > 50) {
      eventBuffer.shift();
    }
  }
}

// Initial setup on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    agentId: 'agent-1',
    apiUrl: DEFAULT_API_URL,
    isShiftActive: true
  });
  console.log('OmniPulse Agent Extension Initialized.');
});
