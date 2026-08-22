import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Globe, Clock, Check } from 'lucide-react';

export default function ShiftManager() {
  const [rules, setRules] = useState([
    { pattern: 'zendesk.com', category: 'CALL_TOOL', desc: 'Customer Ticketing & Talk' },
    { pattern: 'salesforce.com', category: 'WORK_APP', desc: 'Service Cloud CRM' },
    { pattern: 'genesys.cloud', category: 'CALL_TOOL', desc: 'Omnichannel WebRTC' },
    { pattern: 'jira.atlassian.com', category: 'WORK_APP', desc: 'Escalation Tracking' },
    { pattern: 'youtube.com', category: 'UNPRODUCTIVE', desc: 'Video Streaming' },
    { pattern: 'netflix.com', category: 'UNPRODUCTIVE', desc: 'Distraction Alert' },
  ]);

  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('WORK_APP');
  const [newDesc, setNewDesc] = useState('');

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newPattern.trim()) return;
    setRules([...rules, { pattern: newPattern.toLowerCase().trim(), category: newCategory, desc: newDesc || 'Custom Rule' }]);
    setNewPattern('');
    setNewDesc('');
  };

  const handleDeleteRule = (pattern) => {
    setRules(rules.filter(r => r.pattern !== pattern));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-blue" />
              Application & Web Domain Rules Engine
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Classify which browser tabs and apps count towards Active Work, Calls, or Distraction Alerts.
            </p>
          </div>
        </div>

        {/* Add New Rule Form */}
        <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-dark-900/60 p-4 rounded-xl border border-slate-800">
          <div className="sm:col-span-1">
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Domain / App Pattern</label>
            <input
              type="text"
              placeholder="e.g. app.hubspot.com"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue font-mono"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Classification Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-blue"
            >
              <option value="WORK_APP">Active Work App (CRM/Docs)</option>
              <option value="CALL_TOOL">Voice / WebRTC Call Tool</option>
              <option value="WRAP_UP">After-Call Work (ACW)</option>
              <option value="UNPRODUCTIVE">Unproductive / Distraction</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Description</label>
            <input
              type="text"
              placeholder="e.g. Help Desk Portal"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Domain Rule
            </button>
          </div>
        </form>

        {/* Existing Rules List */}
        <div className="space-y-2">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="font-mono font-semibold text-slate-200">{rule.pattern}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  rule.category === 'CALL_TOOL' ? 'bg-blue-500/20 text-blue-400' :
                  rule.category === 'WORK_APP' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  {rule.category}
                </span>
                <span className="text-slate-400 text-[11px]">{rule.desc}</span>
              </div>
              <button
                onClick={() => handleDeleteRule(rule.pattern)}
                className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
