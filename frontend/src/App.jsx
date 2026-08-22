import React, { useState, useEffect } from 'react';
import {
  Activity, Users, PhoneCall, Clock, Coffee, AlertTriangle, ShieldCheck,
  Search, Filter, RefreshCw, BarChart2, Settings, Download, Wifi, WifiOff, CheckCircle2
} from 'lucide-react';
import LiveFloorGrid from './components/LiveFloorGrid.jsx';
import AgentTimelineModal from './components/AgentTimelineModal.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import ShiftManager from './components/ShiftManager.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('floor'); // 'floor' | 'analytics' | 'rules' | 'extension'
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  // WebSocket Live Real-time Connection
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(WS_BASE);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'AGENT_UPDATE') {
              const updatedAgent = message.data;
              setAgents((prevAgents) => {
                const index = prevAgents.findIndex((a) => a.id === updatedAgent.agent_id || a.id === updatedAgent.id);
                if (index !== -1) {
                  const updatedList = [...prevAgents];
                  updatedList[index] = { ...updatedList[index], ...updatedAgent, id: updatedAgent.agent_id || updatedAgent.id };
                  return updatedList;
                } else {
                  return [{ ...updatedAgent, id: updatedAgent.agent_id || updatedAgent.id }, ...prevAgents];
                }
              });
              // Refresh summary metrics on state changes
              fetchSummary();
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error', err);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchAgents(), fetchTeams(), fetchSummary()]);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    const res = await fetch(`${API_BASE}/api/v1/agents`);
    const data = await res.json();
    setAgents(data.agents || []);
  };

  const fetchTeams = async () => {
    const res = await fetch(`${API_BASE}/api/v1/agents/teams`);
    const data = await res.json();
    setTeams(data.teams || []);
  };

  const fetchSummary = async () => {
    const res = await fetch(`${API_BASE}/api/v1/analytics/summary`);
    const data = await res.json();
    setSummary(data.summary || null);
  };

  // Filter Agents
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = selectedTeam === 'ALL' || agent.team_id === selectedTeam;
    const matchesStatus = selectedStatus === 'ALL' || agent.current_state === selectedStatus;
    return matchesSearch && matchesTeam && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Top Navigation Header */}
      <header className="glass-panel sticky top-0 z-40 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white animate-pulse-subtle" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                OmniPulse
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-blue font-mono font-semibold">
                  LIVE FLOOR
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Call Center & Remote Workforce Intelligence</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <nav className="hidden md:flex items-center gap-1 bg-dark-800/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('floor')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'floor'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Live Operations Floor
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics & KPIs
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'rules'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Category Rules
            </button>
            <button
              onClick={() => setActiveTab('extension')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'extension'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Agent Extension
            </button>
          </nav>
        </div>

        {/* Right Header Status Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Live Stream Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                Connecting...
              </span>
            )}
          </div>

          <button
            onClick={fetchInitialData}
            title="Refresh Telemetry"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Quick Floor Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="glass-card rounded-xl p-3.5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">In Call</span>
              <PhoneCall className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono mt-1">
              {summary?.agents_in_call || agents.filter(a => a.current_state === 'IN_CALL').length}
            </p>
          </div>

          <div className="glass-card rounded-xl p-3.5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Active CRM</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono mt-1">
              {summary?.agents_active || agents.filter(a => a.current_state === 'ACTIVE').length}
            </p>
          </div>

          <div className="glass-card rounded-xl p-3.5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Wrap-Up (ACW)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono mt-1">
              {summary?.agents_wrapup || agents.filter(a => a.current_state === 'WRAP_UP').length}
            </p>
          </div>

          <div className="glass-card rounded-xl p-3.5 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Idle / Away</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono mt-1">
              {summary?.agents_idle || agents.filter(a => a.current_state === 'IDLE').length}
            </p>
          </div>

          <div className="glass-card rounded-xl p-3.5 border-l-4 border-l-purple-500 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Avg Adherence</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono mt-1">
              {summary?.avg_adherence || 96}%
            </p>
          </div>
        </div>

        {/* Tab 1: Live Operations Floor */}
        {activeTab === 'floor' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search and Filters Bar */}
            <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search agent by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue font-medium"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Team:</span>
                </div>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="ALL">All Departments</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_CALL">🔵 In Call</option>
                  <option value="ACTIVE">🟢 Active Work</option>
                  <option value="WRAP_UP">🟠 Wrap-Up</option>
                  <option value="IDLE">🟡 Idle</option>
                  <option value="BREAK">🟣 Break</option>
                </select>
              </div>
            </div>

            {/* Live Agent Matrix */}
            <LiveFloorGrid
              agents={filteredAgents}
              onSelectAgent={(agent) => setSelectedAgent(agent)}
            />
          </div>
        )}

        {/* Tab 2: Analytics & KPIs */}
        {activeTab === 'analytics' && (
          <AnalyticsView summary={summary} />
        )}

        {/* Tab 3: Rules & Categories */}
        {activeTab === 'rules' && (
          <ShiftManager />
        )}

        {/* Tab 4: Agent Extension Instructions */}
        {activeTab === 'extension' && (
          <div className="glass-panel rounded-2xl p-6 space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-brand-blue" />
              Chrome Extension Setup for Remote Agents
            </h3>
            <p className="text-xs text-slate-400">
              The agent extension runs in the background of Google Chrome or Microsoft Edge. It tracks active tabs, WebRTC audio calls, and synchronizes batched heartbeats every 15s to your server.
            </p>

            <div className="bg-dark-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 font-mono">
              <p className="text-emerald-400 font-semibold font-sans">⚡ How to install in 3 steps:</p>
              <ol className="list-decimal list-inside space-y-2 font-sans text-slate-300">
                <li>Open Google Chrome and navigate to <code className="text-brand-blue font-mono">chrome://extensions/</code></li>
                <li>Toggle on <strong>"Developer mode"</strong> in the top-right corner.</li>
                <li>Click <strong>"Load unpacked"</strong> and select the <code className="text-amber-400 font-mono">/extension</code> folder in this project!</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Agent Detailed Modal */}
      {selectedAgent && (
        <AgentTimelineModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onStateChange={fetchInitialData}
        />
      )}
    </div>
  );
}
