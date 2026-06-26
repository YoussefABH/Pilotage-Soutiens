import React, { useState } from 'react';
import { Theme, Objective } from '../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ThemeManagementProps {
  themes: Theme[];
  objectives: Objective[];
  onAddTheme: (theme: Omit<Theme, 'id'>) => void;
  onUpdateTheme: (theme: Theme) => void;
  onDeleteTheme: (id: string) => void;
  onAddObjective: (objective: Omit<Objective, 'id'>) => void;
  onUpdateObjective: (objective: Objective) => void;
  onDeleteObjective: (id: string) => void;
}

export default function ThemeManagement({ themes, objectives, onAddTheme, onUpdateTheme, onDeleteTheme, onAddObjective, onUpdateObjective, onDeleteObjective }: ThemeManagementProps) {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');

  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [objectiveName, setObjectiveName] = useState('');
  const [objectiveDescription, setObjectiveDescription] = useState('');
  const [objectiveThemeId, setObjectiveThemeId] = useState('');

  const openThemeModal = (theme: Theme | null = null) => {
    setEditingTheme(theme);
    setThemeName(theme?.name || '');
    setThemeDescription(theme?.description || '');
    setIsThemeModalOpen(true);
  };

  const openObjectiveModal = (themeId: string, objective: Objective | null = null) => {
    setEditingObjective(objective);
    setObjectiveName(objective?.name || '');
    setObjectiveDescription(objective?.description || '');
    setObjectiveThemeId(themeId);
    setIsObjectiveModalOpen(true);
  };

  const handleSubmitTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTheme) onUpdateTheme({ ...editingTheme, name: themeName, description: themeDescription });
    else onAddTheme({ name: themeName, description: themeDescription });
    setIsThemeModalOpen(false);
  };

  const handleSubmitObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingObjective) onUpdateObjective({ ...editingObjective, themeId: objectiveThemeId, name: objectiveName, description: objectiveDescription });
    else onAddObjective({ themeId: objectiveThemeId, name: objectiveName, description: objectiveDescription });
    setIsObjectiveModalOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-black text-white">Gestion des Thèmes & Objectifs</h1>
        <button onClick={() => openThemeModal()} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus size={16} /> Ajouter un Thème
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map(theme => (
          <div key={theme.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{theme.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => openThemeModal(theme)} className="text-xs text-sky-400">Modifier</button>
                <button onClick={() => onDeleteTheme(theme.id)} className="text-xs text-rose-400">Supprimer</button>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">{theme.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm">Objectifs</h4>
                <button onClick={() => openObjectiveModal(theme.id)} className="text-xs text-sky-400">Ajouter Objectif</button>
              </div>
              {objectives.filter(o => o.themeId === theme.id).map(obj => (
                <div key={obj.id} className="p-2 bg-slate-950 rounded-lg flex justify-between items-center text-xs">
                  <span>{obj.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openObjectiveModal(theme.id, obj)} className="text-slate-500 hover:text-sky-400">Modifier</button>
                    <button onClick={() => onDeleteObjective(obj.id)} className="text-slate-500 hover:text-rose-400">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isThemeModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800">
              <h2 className="text-lg font-bold mb-4">{editingTheme ? 'Modifier le thème' : 'Ajouter un thème'}</h2>
              <form onSubmit={handleSubmitTheme} className="space-y-4">
                <input type="text" placeholder="Nom du thème" value={themeName} onChange={e => setThemeName(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" required />
                <textarea placeholder="Description" value={themeDescription} onChange={e => setThemeDescription(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" />
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsThemeModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-800">Annuler</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-sky-600">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isObjectiveModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800">
              <h2 className="text-lg font-bold mb-4">{editingObjective ? 'Modifier l\'objectif' : 'Ajouter un objectif'}</h2>
              <form onSubmit={handleSubmitObjective} className="space-y-4">
                <input type="text" placeholder="Nom de l'objectif" value={objectiveName} onChange={e => setObjectiveName(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" required />
                <textarea placeholder="Description" value={objectiveDescription} onChange={e => setObjectiveDescription(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" />
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsObjectiveModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-800">Annuler</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-sky-600">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
