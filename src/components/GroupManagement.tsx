import React, { useState } from 'react';
import { Group, Student } from '../types';
import { Plus, Users, Trash2, Edit2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GroupManagementProps {
  groups: Group[];
  students: Student[];
  onAddGroup: (group: Omit<Group, 'id'>) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
}

export default function GroupManagement({ groups, students, onAddGroup, onUpdateGroup, onDeleteGroup }: GroupManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const openModal = (group: Group | null = null) => {
    setEditingGroup(group);
    setName(group?.name || '');
    setDescription(group?.description || '');
    setSelectedStudentIds(group?.studentIds || []);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      onUpdateGroup({ ...editingGroup, name, description, studentIds: selectedStudentIds });
    } else {
      onAddGroup({ name, description, studentIds: selectedStudentIds });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-black text-white">Gestion des Groupes</h1>
        <button onClick={() => openModal()} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus size={16} /> Ajouter un Groupe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div key={group.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <h3 className="font-bold text-lg mb-2">{group.name}</h3>
            <p className="text-sm text-slate-400 mb-4">{group.description}</p>
            <div className="text-xs text-slate-500 mb-4">{group.studentIds.length} élèves</div>
            <div className="flex gap-2">
              <button onClick={() => openModal(group)} className="text-xs text-sky-400">Modifier</button>
              <button onClick={() => onDeleteGroup(group.id)} className="text-xs text-rose-400">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800">
              <h2 className="text-lg font-bold mb-4">{editingGroup ? 'Modifier le groupe' : 'Ajouter un groupe'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Nom du groupe" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" required />
                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" />
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Élèves :</label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {students.map(student => (
                      <label key={student.id} className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={e => {
                          if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, student.id]);
                          else setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                        }} />
                        {student.firstName} {student.lastName}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-800">Annuler</button>
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
