import React from 'react';
import { PhoneCall, CheckCircle2, Clock, AlertTriangle, Coffee, Laptop, ShieldCheck } from 'lucide-react';

const STATUS_CONFIG = {
  IN_CALL: {
    label: 'In Call',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500 text-white',
    icon: PhoneCall,
    pulse: true
  },
  ACTIVE: {
    label: 'Active Work',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500 text-white',
    icon: CheckCircle2,
    pulse: false
  },
  WRAP_UP: {
    label: 'Wrap-Up (ACW)',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500 text-white',
    icon: Clock,
    pulse: false
  },
  IDLE: {
    label: 'Idle / Away',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500 text-slate-950 font-bold',
    icon: Clock,
    pulse: false
  },
  BREAK: {
    label: 'On Break',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500 text-white',
    icon: Coffee,
    pulse: false
  },
  UNPRODUCTIVE: {
    label: 'Distraction Alert',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    badge: 'bg-rose-500 text-white animate-bounce',
    icon: AlertTriangle,
    pulse: true
  },
  OFFLINE: {
    label: 'Offline',
    bg: 'bg-slate-800/40',
    border: 'border-slate-700/50',
    text: 'text-slate-400',
    badge: 'bg-slate-700 text-slate-300',
    icon: Laptop,
    pulse: false
  }
};

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function LiveFloorGrid({ agents, onSelectAgent }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center">
        <p className="text-slate-400">No active agents match the selected filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {agents.map((agent) => {
        const config = STATUS_CONFIG[agent.current_state] || STATUS_CONFIG.OFFLINE;
        const IconComponent = config.icon;

        return (
          <div
            key={agent.id}
            onClick={() => onSelectAgent(agent)}
            className={`glass-card rounded-xl p-4 cursor-pointer relative overflow-hidden group border ${config.border}`}
          >
            {/* Top Row: Avatar, Name & Live Badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={agent.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={agent.full_name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-700"
                  />
                  {config.pulse && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm group-hover:text-brand-blue transition-colors">
                    {agent.full_name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: agent.team_color || '#3B82F6' }}
                    />
                    <span className="text-xs text-slate-400 truncate max-w-[120px]">
                      {agent.team_name || 'General Support'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm ${config.badge}`}>
                <IconComponent className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </div>
            </div>

            {/* Current Active Window / WebRTC App */}
            <div className="bg-dark-900/60 rounded-lg p-2.5 mb-3 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active App / Tab</span>
                <span className="font-mono text-slate-300 font-medium">
                  {formatDuration(agent.current_state_duration_seconds)}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                {agent.current_app_or_domain || 'System Idle'}
              </p>
            </div>

            {/* Bottom Row: Call Center Performance Telemetry */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Calls</span>
                <span className="text-xs font-mono font-semibold text-blue-400">
                  {Math.round((agent.today_call_seconds || 0) / 60)}m
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Adherence</span>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  {agent.schedule_adherence_percent || 95}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Idle</span>
                <span className={`text-xs font-mono font-semibold ${(agent.today_idle_seconds || 0) > 1800 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {Math.round((agent.today_idle_seconds || 0) / 60)}m
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
