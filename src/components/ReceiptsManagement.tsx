import React, { useState } from 'react';
import { Receipt, Student } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  User, 
  DollarSign, 
  Tag, 
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Filter,
  PlusCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ReceiptsManagementProps {
  receipts: Receipt[];
  students: Student[];
  currency: string;
  onAddReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  onUpdateReceipt: (receipt: Receipt) => void;
  onDeleteReceipt: (id: string) => void;
}

const PAYMENT_METHODS = [
  { value: 'espèces', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'chèque', label: 'Chèque' },
  { value: 'carte', label: 'Carte Bancaire' },
  { value: 'autre', label: 'Autre' }
];

const STATUSES = [
  { value: 'payé', label: 'Payé', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'en_attente', label: 'En attente', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'partiel', label: 'Partiel', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' }
];

const GRADE_LEVELS = [
  "Primaire", "Collège", "Lycée", "5ème", "7ème", "8ème", "9ème", "Terminale"
];

export default function ReceiptsManagement({
  receipts,
  students,
  currency,
  onAddReceipt,
  onUpdateReceipt,
  onDeleteReceipt
}: ReceiptsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('Tous');
  const [methodFilter, setMethodFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);

  // Form Fields State
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('5ème');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'espèces' | 'virement' | 'chèque' | 'carte' | 'autre'>('espèces');
  const [status, setStatus] = useState<'payé' | 'en_attente' | 'partiel'>('payé');
  const [category, setCategory] = useState('Mensualité Juin');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle student selection from listed students
  const handleStudentSelect = (id: string) => {
    setStudentId(id);
    if (id) {
      const selected = students.find(s => s.id === id);
      if (selected) {
        setStudentName(`${selected.firstName} ${selected.lastName}`);
        setGradeLevel(selected.gradeLevel);
      }
    } else {
      setStudentName('');
    }
  };

  const handleOpenCreate = () => {
    setEditingReceipt(null);
    setStudentId('');
    setStudentName('');
    setGradeLevel('5ème');
    setAmount('');
    setPaymentDate(new Date().toISOString().substring(0, 10));
    setPaymentMethod('espèces');
    setStatus('payé');
    setCategory('Mensualité Juin');
    setNotes('');
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setStudentId(receipt.studentId || '');
    setStudentName(receipt.studentName);
    setGradeLevel(receipt.gradeLevel);
    setAmount(receipt.amount.toString());
    setPaymentDate(receipt.paymentDate);
    setPaymentMethod(receipt.paymentMethod);
    setStatus(receipt.status);
    setCategory(receipt.category);
    setNotes(receipt.notes || '');
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleOpenDelete = (receipt: Receipt) => {
    setReceiptToDelete(receipt);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMessage("Veuillez saisir ou sélectionner un élève.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Le montant doit être un nombre supérieur à 0.");
      return;
    }

    const payload = {
      studentId: studentId || undefined,
      studentName: studentName.trim(),
      gradeLevel,
      amount: numAmount,
      paymentDate,
      paymentMethod,
      status,
      category: category.trim(),
      notes: notes.trim() || undefined
    };

    if (editingReceipt) {
      onUpdateReceipt({
        ...payload,
        id: editingReceipt.id
      });
    } else {
      onAddReceipt(payload);
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (receiptToDelete) {
      onDeleteReceipt(receiptToDelete.id);
      setIsDeleteOpen(false);
      setReceiptToDelete(null);
    }
  };

  // Filtered lists
  const filteredReceipts = receipts.filter(r => {
    const searchMatch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const levelMatch = levelFilter === 'Tous' || r.gradeLevel === levelFilter;
    const methodMatch = methodFilter === 'Tous' || r.paymentMethod === methodFilter;
    const statusMatch = statusFilter === 'Tous' || r.status === statusFilter;

    return searchMatch && levelMatch && methodMatch && statusMatch;
  });

  // Calculate totals
  const totalAmountReceived = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);

  // Recharts Data preparation
  const receiptsByLevel = filteredReceipts.reduce((acc: { [key: string]: number }, r) => {
    acc[r.gradeLevel] = (acc[r.gradeLevel] || 0) + r.amount;
    return acc;
  }, {});

  const barChartData = Object.entries(receiptsByLevel).map(([level, val]) => ({
    name: level,
    Montant: val
  }));

  const receiptsByMethod = filteredReceipts.reduce((acc: { [key: string]: number }, r) => {
    acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.amount;
    return acc;
  }, {});

  const pieChartData = Object.entries(receiptsByMethod).map(([method, val]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1),
    value: val
  }));

  const COLORS_PALETTE = ['#06b6d4', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-6" id="receipts-management-container">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Saisie des Recettes & Comptabilité
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Saisissez vos mensualités au fil de l'eau et gérez les règlements de manière fluide.
          </p>
        </div>

        <div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
          >
            <Plus className="w-4 h-4" />
            Saisir Recette
          </button>
        </div>
      </div>

      {/* Real-time stats card deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Saisi</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{totalAmountReceived} {currency}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Recettes cumulées sur l'exercice en cours</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Méthode Favorite</span>
            <h3 className="text-xl font-bold text-sky-400 mt-1">
              {pieChartData.length > 0 ? pieChartData.sort((a,b) => b.value - a.value)[0].name : "Aucune"}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Moyen de paiement le plus sollicité</p>
          </div>
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Graphs Section */}
      {filteredReceipts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950/40 p-5 rounded-2xl border border-slate-900/60">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recettes par Niveau Scolaire</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Montant" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Répartition par Moyen de Paiement</h4>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters and List */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par élève, catégorie, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-lg border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-transparent text-slate-300 text-xs py-1 px-2 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="Tous" className="bg-slate-950">Tous Niveaux</option>
                {GRADE_LEVELS.map(g => (
                  <option key={g} value={g} className="bg-slate-950">{g}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-lg border border-slate-800">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent text-slate-300 text-xs py-1 px-2 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="Tous" className="bg-slate-950">Tous Paiements</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value} className="bg-slate-950">{m.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-lg border border-slate-800">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-300 text-xs py-1 px-2 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="Tous" className="bg-slate-950">Tous Statuts</option>
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value} className="bg-slate-950">{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        {filteredReceipts.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">Aucune recette saisie pour le moment.</p>
            <p className="text-[10px] text-slate-500 mt-1">Commencez par saisir une nouvelle recette ci-dessus ou via le bouton d'accès rapide.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                  <th className="p-3">Élève</th>
                  <th className="p-3">Niveau</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Méthode</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredReceipts.map((r) => {
                  const st = STATUSES.find(s => s.value === r.status) || STATUSES[0];
                  return (
                    <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        {r.studentName}
                      </td>
                      <td className="p-3 text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px]">
                          {r.gradeLevel}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {r.paymentDate}
                      </td>
                      <td className="p-3 text-slate-300 font-medium">
                        {r.category}
                      </td>
                      <td className="p-3 text-slate-400 capitalize">
                        {r.paymentMethod}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {r.amount} {currency}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(r)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Dialog Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  {editingReceipt ? "Modifier la Recette" : "Saisir une Nouvelle Recette"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {errorMessage && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Select Listed Student or Custom */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Associer à un élève existant (Optionnel)</label>
                  <select
                    value={studentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Saisie manuelle libre --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Nom & Prénom de l'élève <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Saisir le nom complet de l'élève"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      disabled={!!studentId}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Niveau Scolaire <span className="text-rose-500">*</span></label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      disabled={!!studentId}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-sky-500 disabled:opacity-60"
                    >
                      {GRADE_LEVELS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Date de règlement <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Montant ({currency}) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Montant payé (ex: 300)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Catégorie / Libellé <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Mensualité Juin, Forfait, etc."
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Méthode de paiement</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Statut du paiement</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Notes & Commentaires (Optionnel)</label>
                  <textarea
                    placeholder="Saisissez des notes complémentaires (ex: Acompte de 150 payé, reste 150)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20"
                  >
                    {editingReceipt ? "Mettre à jour" : "Confirmer la Saisie"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for delete */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        title="Supprimer la Recette"
        message={`Êtes-vous sûr de vouloir supprimer la saisie de recette pour "${receiptToDelete?.studentName}" d'un montant de ${receiptToDelete?.amount} ${currency} ? Cette action est irréversible.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
