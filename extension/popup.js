document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('statusBadge');
  const shiftStateText = document.getElementById('shiftStateText');
  const toggleShiftBtn = document.getElementById('toggleShiftBtn');
  const agentIdInput = document.getElementById('agentIdInput');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  // Load saved settings
  const { agentId = 'agent-1', apiUrl = 'http://localhost:5000/api/v1/heartbeat', isShiftActive = true } =
    await chrome.storage.local.get(['agentId', 'apiUrl', 'isShiftActive']);

  agentIdInput.value = agentId;
  apiUrlInput.value = apiUrl;
  updateUI(isShiftActive);

  function updateUI(active) {
    if (active) {
      statusBadge.textContent = 'ONLINE';
      statusBadge.style.background = '#10B981';
      shiftStateText.textContent = '🟢 Shift Active (Tracking)';
      toggleShiftBtn.textContent = 'Take Break / Pause';
      toggleShiftBtn.className = 'btn btn-danger';
    } else {
      statusBadge.textContent = 'PAUSED';
      statusBadge.style.background = '#F59E0B';
      shiftStateText.textContent = '⏸️ On Break (Tracking Paused)';
      toggleShiftBtn.textContent = 'Resume Work';
      toggleShiftBtn.className = 'btn btn-primary';
    }
  }

  toggleShiftBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['isShiftActive']);
    const newState = !data.isShiftActive;
    await chrome.storage.local.set({ isShiftActive: newState });
    updateUI(newState);
  });

  saveSettingsBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({
      agentId: agentIdInput.value.trim(),
      apiUrl: apiUrlInput.value.trim()
    });
    alert('Settings saved!');
  });
});
