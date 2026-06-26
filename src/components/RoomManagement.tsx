import React, { useState } from 'react';
import { Room } from '../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoomManagementProps {
  rooms: Room[];
  onAddRoom: (room: Omit<Room, 'id'>) => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
}

export default function RoomManagement({ rooms, onAddRoom, onUpdateRoom, onDeleteRoom }: RoomManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [features, setFeatures] = useState('');

  const openModal = (room: Room | null = null) => {
    setEditingRoom(room);
    setName(room?.name || '');
    setCapacity(room?.capacity || 10);
    setFeatures(room?.features.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      onUpdateRoom({ ...editingRoom, name, capacity, features: features.split(',').map(f => f.trim()) });
    } else {
      onAddRoom({ name, capacity, features: features.split(',').map(f => f.trim()) });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-black text-white">Gestion des Salles</h1>
        <button onClick={() => openModal()} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus size={16} /> Ajouter une Salle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <h3 className="font-bold text-lg mb-2">{room.name}</h3>
            <div className="text-xs text-slate-500 mb-2">Capacité: {room.capacity}</div>
            <div className="text-xs text-slate-400 mb-4">Équipements: {room.features.join(', ')}</div>
            <div className="flex gap-2">
              <button onClick={() => openModal(room)} className="text-xs text-sky-400">Modifier</button>
              <button onClick={() => onDeleteRoom(room.id)} className="text-xs text-rose-400">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800">
              <h2 className="text-lg font-bold mb-4">{editingRoom ? 'Modifier la salle' : 'Ajouter une salle'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Nom de la salle" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" required />
                <input type="number" placeholder="Capacité" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" required />
                <input type="text" placeholder="Équipements (séparés par des virgules)" value={features} onChange={e => setFeatures(e.target.value)} className="w-full p-2 bg-slate-950 rounded-lg border border-slate-800" />
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
