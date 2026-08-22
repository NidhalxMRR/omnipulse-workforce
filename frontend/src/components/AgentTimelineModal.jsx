import React, { useState, useEffect } from 'react';
import { X, Clock, Phone, AlertCircle, Coffee, Check, ShieldAlert, Globe, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AgentTimelineModal({ agent, onClose, onStateChange }) {
  const [timelineData, setTimelineData] = useState([]);
  const [topApps, setTopApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!agent) return;
    fetchTimeline();
  }, [agent]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/analytics/agent/${agent.id}/timeline`);
      const data = await res.json();
      setTimelineData(data.timeline || []);
      setTopApps(data.top_apps || []);
    } catch (err) {
      console.error('Failed to fetch timeline', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetState = async (newState) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/agents/${agent.id}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState, note: `Supervisor action at ${new Date().toLocaleTimeString()}` })
      });
      if (res.ok) {
        onStateChange();
        fetchTimeline();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src={agent.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={agent.full_name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-blue"
            />
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {agent.full_name}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {agent.id}
                </span>
              </h2>
              <p className="text-sm text-slate-400">
                {agent.email} • <span className="text-brand-blue font-medium">{agent.team_name || 'Tier 1 Support'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="py-3 px-4 my-4 rounded-xl bg-dark-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Supervisor Controls:</span>
            <button
              disabled={actionLoading}
              onClick={() => handleSetState('BREAK')}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" />
              Put on Break
            </button>
            <button
              disabled={actionLoading}
              onClick={() => handleSetState('ACTIVE')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark Active
            </button>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Adherence: <span className="text-emerald-400 font-semibold">{agent.schedule_adherence_percent || 95}%</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Top Applications & Domains */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-blue" />
              Top Applications & Web Domains (Today)
            </h4>
            {topApps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {topApps.map((app, idx) => (
                  <div key={idx} className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-white truncate">{app.domain_or_app}</p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                      <span className="text-brand-blue">{app.activity_category}</span>
                      <span>{Math.round(app.total_duration / 60)}m</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/20 rounded-lg p-4 text-center text-xs text-slate-500">
                Awaiting telemetry logs...
              </div>
            )}
          </div>

          {/* Activity Stream Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Telemetry & State Stream
            </h4>
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading timeline telemetry...</div>
            ) : timelineData.length > 0 ? (
              <div className="space-y-2">
                {timelineData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.state === 'IN_CALL' ? 'bg-blue-400 animate-pulse' :
                          item.state === 'ACTIVE' ? 'bg-emerald-400' :
                          item.state === 'WRAP_UP' ? 'bg-amber-400' : 'bg-yellow-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-200">{item.domain_or_app}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>{item.duration_seconds}s</span>
                      <span>{new Date(item.recorded_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/20 rounded-lg p-6 text-center text-xs text-slate-500">
                No recent activity events recorded yet. Connect client extension to stream data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
