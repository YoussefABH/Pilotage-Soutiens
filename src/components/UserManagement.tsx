import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { getAllUserProfiles, updateUserProfile, deleteUserProfile } from '../lib/firebase';
import { 
  Check, 
  Trash2, 
  Filter, 
  Mail, 
  Phone, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck,
  Search,
  RefreshCw,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from './ConfirmationModal';

interface UserProfile {
  userId: string;
  role: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType?: 'student' | 'parent';
  gradeLevel?: string;
  status?: 'pending' | 'activated' | 'rejected';
  pairingCode?: string;
  parentContact?: string;
  childCode?: string;
  updatedAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'activated'>('all');
  
  // Modal states for deleting / rejecting user profile
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Success/Error notifications
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const profiles = await getAllUserProfiles();
      setUsers(profiles as UserProfile[]);
    } catch (error) {
      console.error('Failed to load users:', error);
      showNotification('Erreur lors du chargement des profils utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Manual role update
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserProfile(userId, { role: newRole });
      setUsers(users.map(u => u.userId === userId ? { ...u, role: newRole } : u));
      showNotification('Rôle mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Failed to update role:', error);
      showNotification('Impossible de modifier le rôle', 'error');
    }
  };

  // Account manual activation
  const handleActivateUser = async (userProfile: UserProfile, assignedRole: UserRole) => {
    try {
      const updatedFields = {
        role: assignedRole,
        status: 'activated' as const,
        activatedAt: new Date().toISOString()
      };
      await updateUserProfile(userProfile.userId, updatedFields);
      
      setUsers(users.map(u => u.userId === userProfile.userId ? { ...u, ...updatedFields } : u));
      showNotification(`Compte activé avec succès en tant que ${assignedRole === 'student' ? 'Élève' : assignedRole === 'parent' ? 'Parent' : 'Professeur'} !`, 'success');
    } catch (error) {
      console.error('Failed to activate user:', error);
      showNotification("Erreur lors de l'activation du compte", 'error');
    }
  };

  // Refuse and delete profile document entirely
  const handleRejectAndDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserProfile(userToDelete.userId);
      setUsers(users.filter(u => u.userId !== userToDelete.userId));
      showNotification('Profil refusé et supprimé de la base de données', 'success');
    } catch (error) {
      console.error('Failed to delete profile:', error);
      showNotification('Impossible de supprimer le profil', 'error');
    }
  };

  // Filter & Search logic
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phone || '');
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = fullName.includes(query) || email.includes(query) || phone.includes(query);
    
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'pending' ? user.status === 'pending' || !user.status :
      user.status === 'activated';

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw size={24} className="animate-spin text-sky-400" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Chargement des utilisateurs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-sky-400" size={22} />
            Gestion des Utilisateurs & Inscriptions
          </h2>
          <p className="text-xs text-slate-400">
            Validez manuellement les dossiers d'inscription des nouveaux élèves/parents ou modifiez les privilèges d'accès.
          </p>
        </div>

        <button 
          onClick={loadUsers}
          className="flex items-center gap-1.5 self-start px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={12} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>
        
        <div className="md:col-span-5 flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${filterStatus === 'all' ? 'bg-sky-600/10 border-sky-500/50 text-sky-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${filterStatus === 'pending' ? 'bg-amber-600/10 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            En attente
          </button>
          <button
            onClick={() => setFilterStatus('activated')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${filterStatus === 'activated' ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Actifs
          </button>
        </div>
      </div>

      {/* Success/Error alert floating */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl text-xs border flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users grid list */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl">
            <Users size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">Aucun utilisateur ne correspond à vos critères de recherche.</p>
          </div>
        ) : (
          filteredUsers.map(user => {
            const isPending = user.status === 'pending' || !user.status;
            const declaredType = user.userType || 'guest';
            
            return (
              <div 
                key={user.userId} 
                className={`bg-slate-900 border rounded-2xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all ${isPending ? 'border-amber-500/20 shadow-lg shadow-amber-500/5 bg-gradient-to-br from-slate-900 to-amber-950/5' : 'border-slate-800'}`}
              >
                {/* User info details */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 flex-1">
                  {/* Initial / Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${isPending ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    {declaredType === 'student' ? (
                      <GraduationCap size={20} />
                    ) : declaredType === 'parent' ? (
                      <Users size={20} />
                    ) : (
                      <Users size={20} />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-white">
                        {user.firstName ? `${user.firstName} ${user.lastName}` : "Profil invité non finalisé"}
                      </h3>
                      {isPending ? (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          En attente d'activation
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Active ({user.role})
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail size={12} className="shrink-0 text-slate-500" />
                        <span className="truncate">{user.email || user.userId}</span>
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="shrink-0 text-slate-500" />
                          <span>{user.phone}</span>
                        </div>
                      )}

                      {user.gradeLevel && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={12} className="shrink-0 text-slate-500" />
                          <span>Niveau: {user.gradeLevel}</span>
                        </div>
                      )}
                    </div>

                    {/* Linking / code indicators */}
                    {(user.pairingCode || user.parentContact || user.childCode) && (
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 mt-2 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-400">
                        {user.pairingCode && (
                          <div>
                            <span className="text-slate-500 uppercase tracking-wider font-semibold mr-1">Code de liaison :</span>
                            <span className="font-mono font-bold text-sky-400">{user.pairingCode}</span>
                          </div>
                        )}
                        {user.parentContact && (
                          <div>
                            <span className="text-slate-500 uppercase tracking-wider font-semibold mr-1">Parent déclaré :</span>
                            <span className="text-white font-medium">{user.parentContact}</span>
                          </div>
                        )}
                        {user.childCode && (
                          <div>
                            <span className="text-slate-500 uppercase tracking-wider font-semibold mr-1">Liaison Enfant Code :</span>
                            <span className="font-mono font-bold text-indigo-400">{user.childCode}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Administration Action Controls */}
                <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0">
                  {isPending ? (
                    <>
                      {/* Activation choices */}
                      <button
                        onClick={() => handleActivateUser(user, user.userType || 'student')}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                      >
                        <UserCheck size={13} />
                        <span>Activer comme {user.userType === 'parent' ? 'Parent' : 'Élève'}</span>
                      </button>
                      
                      {/* Custom override activations */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleActivateUser(user, e.target.value as UserRole);
                            e.target.value = "";
                          }
                        }}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl px-3 py-2 cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Autre rôle...</option>
                        <option value="student">Élève</option>
                        <option value="parent">Parent</option>
                        <option value="teacher">Professeur</option>
                        <option value="admin">Administrateur</option>
                      </select>

                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-600 rounded-xl transition-all cursor-pointer border border-rose-500/20"
                        title="Refuser et supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Standard role selection when active */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Modifier rôle :</span>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.userId, e.target.value as UserRole)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:border-sky-500 outline-none transition-all"
                        >
                          <option value="student">Élève</option>
                          <option value="parent">Parent</option>
                          <option value="teacher">Professeur</option>
                          <option value="admin">Administrateur</option>
                        </select>

                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-xl transition-all cursor-pointer"
                          title="Supprimer définitivement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Reject & Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleRejectAndDelete}
        title="Refuser et supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir refuser le dossier et supprimer définitivement l'utilisateur "${userToDelete?.firstName ? `${userToDelete?.firstName} ${userToDelete?.lastName}` : userToDelete?.email}" de la base de données ? Cette action supprimera sa fiche d'inscription et est irréversible.`}
      />

    </div>
  );
}
