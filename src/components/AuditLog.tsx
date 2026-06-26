import React from 'react';
import { AuditLogEntry } from '../types';

interface AuditLogProps {
  logs: AuditLogEntry[];
}

export default function AuditLog({ logs }: AuditLogProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Historique des Activités</h3>
        <span className="text-[10px] text-slate-500 font-mono">{logs.length} entrées</span>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono italic">Aucune activité récente.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 uppercase bg-slate-950/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{log.userEmail}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'create' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.action === 'update' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {log.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
