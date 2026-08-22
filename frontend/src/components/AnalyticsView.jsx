import React from 'react';
import { PhoneCall, Clock, CheckCircle2, TrendingUp, ShieldAlert, Award, BarChart3, Users } from 'lucide-react';

export default function AnalyticsView({ summary }) {
  const data = summary || {
    total_agents: 5,
    agents_in_call: 1,
    agents_active: 2,
    agents_wrapup: 1,
    agents_idle: 1,
    avg_adherence: 96,
    aht_seconds: 285,
    occupancy_rate: 88,
    total_active_hours: '24.5',
    total_call_hours: '14.2',
    total_idle_hours: '2.1'
  };

  const ahtMinutes = Math.floor(data.aht_seconds / 60);
  const ahtSecondsRemaining = data.aht_seconds % 60;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Call Center Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Average Handle Time */}
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Average Handle Time (AHT)</span>
            <PhoneCall className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {ahtMinutes}m {ahtSecondsRemaining}s
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> -12s vs avg
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Target benchmark: &lt; 5m 30s per customer interaction</p>
        </div>

        {/* Metric 2: Floor Occupancy Rate */}
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Floor Occupancy Rate</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{data.occupancy_rate}%</span>
            <span className="text-xs text-emerald-400 font-semibold">Optimal Range</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active talk time + ticket wrap-up vs logged-in time</p>
        </div>

        {/* Metric 3: Schedule Adherence */}
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Schedule Adherence</span>
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{data.avg_adherence}%</span>
            <span className="text-xs text-purple-400 font-semibold">+2% this week</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Agents active during rostered shift schedules</p>
        </div>

        {/* Metric 4: Total Active Shift Hours */}
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Total Tracked Work</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{data.total_active_hours}h</span>
            <span className="text-xs text-slate-400 font-mono">({data.total_call_hours}h calls)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Recorded across all remote workstations today</p>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time State Distribution */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-blue" />
            Live Agent Floor Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In-Call (Voice / WebRTC)
                </span>
                <span className="font-mono">{data.agents_in_call} Agents ({Math.round((data.agents_in_call / (data.total_agents || 1)) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(data.agents_in_call / (data.total_agents || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active CRM & Ticketing
                </span>
                <span className="font-mono">{data.agents_active} Agents ({Math.round((data.agents_active / (data.total_agents || 1)) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(data.agents_active / (data.total_agents || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Wrap-Up (After-Call Work)
                </span>
                <span className="font-mono">{data.agents_wrapup} Agents ({Math.round((data.agents_wrapup / (data.total_agents || 1)) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(data.agents_wrapup / (data.total_agents || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Idle / Paused
                </span>
                <span className="font-mono">{data.agents_idle} Agents ({Math.round((data.agents_idle / (data.total_agents || 1)) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${(data.agents_idle / (data.total_agents || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Best Practices & SLA Checklist */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Operational Queue Health & Guardrails
          </h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="font-semibold text-emerald-300">Zero Keylogging Active</p>
                <p className="text-slate-400 text-[11px] mt-0.5">GDPR & PCI-DSS compliant - keystrokes are never recorded</p>
              </div>
              <span className="px-2 py-1 bg-emerald-500 text-slate-950 font-bold rounded text-[10px]">ENFORCED</span>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-300">WebRTC Call State Auto-Detect</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Detecting Genesys, Five9, Zendesk, and Amazon Connect</p>
              </div>
              <span className="px-2 py-1 bg-blue-500 text-white font-bold rounded text-[10px]">ONLINE</span>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <div>
                <p className="font-semibold text-purple-300">Anti-Jiggler Anomaly Engine</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Monitoring synthetic mouse and cadence anomalies</p>
              </div>
              <span className="px-2 py-1 bg-purple-500 text-white font-bold rounded text-[10px]">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
