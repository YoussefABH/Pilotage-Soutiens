import React, { useState } from 'react';
import { Course } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, BookOpen, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CourseManagementProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
}

const COLORS = [
  { value: '#06b6d4', label: 'Cyan Néon', class: 'bg-[#06b6d4]' },
  { value: '#3b82f6', label: 'Bleu Royal', class: 'bg-[#3b82f6]' },
  { value: '#eab308', label: 'Ambre / Jaune', class: 'bg-[#eab308]' },
  { value: '#8b5cf6', label: 'Violet', class: 'bg-[#8b5cf6]' },
  { value: '#ec4899', label: 'Pink Néon', class: 'bg-[#ec4899]' },
  { value: '#10b981', label: 'Vert Émeraude', class: 'bg-[#10b981]' },
];

export default function CourseManagement({
  courses,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
}: CourseManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Tous');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('Lycée');
  const [hourlyRate, setHourlyRate] = useState('30');
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle opening modal for creation
  const handleOpenCreate = () => {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setSubject('');
    setLevel('Lycée');
    setHourlyRate('30');
    setSelectedColor('#8b5cf6');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Handle opening modal for edit
  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setSubject(course.subject);
    setLevel(course.level);
    setHourlyRate(course.hourlyRate.toString());
    setSelectedColor(course.color);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim() || !subject.trim() || !level.trim() || !hourlyRate.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      setErrorMessage('Le tarif horaire doit être un nombre positif supérieur à 0.');
      return;
    }

    if (editingCourse) {
      onUpdateCourse({
        id: editingCourse.id,
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        level,
        hourlyRate: rate,
        color: selectedColor,
      });
    } else {
      onAddCourse({
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        level,
        hourlyRate: rate,
        color: selectedColor,
      });
    }

    setIsModalOpen(false);
  };

  // Filtering courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel =
      selectedLevel === 'Tous' ||
      course.level.toLowerCase().includes(selectedLevel.toLowerCase());

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">Catalogue des Cours & Tarifs</h1>
          <p className="text-slate-400 text-xs mt-1">Créez et configurez les matières enseignées à l'école de soutien ainsi que la tarification horaire correspondante.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/15 self-start sm:self-center cursor-pointer"
          id="btn-add-course"
        >
          <Plus size={16} />
          <span>Nouveau Cours</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Rechercher une matière, thématique, niveau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-white"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono whitespace-nowrap">Niveau :</span>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:border-sky-500"
          >
            <option value="Tous">Tous les niveaux</option>
            <option value="Primaire">Primaire</option>
            <option value="Collège">Collège</option>
            <option value="Lycée">Lycée</option>
          </select>
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
          <BookOpen size={40} className="mx-auto mb-3 text-slate-700" />
          <h3 className="text-base font-bold text-slate-300 font-display">Aucun enseignement proposé</h3>
          <p className="text-xs text-slate-500 mt-1">Configurez un cours de soutien pour enrichir le catalogue de l'école.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              layout
              whileHover={{ y: -2 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700/85 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span 
                    className="text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5"
                    style={{ color: course.color, borderColor: `${course.color}25`, backgroundColor: `${course.color}10` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: course.color }}></span>
                    {course.level}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-slate-950 rounded-lg transition-all cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setCourseToDelete(course);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-lg transition-all cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {course.title}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400 block mt-0.5">{course.subject}</span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 min-h-[50px]">
                  {course.description || 'Aucune description disponible pour ce cours.'}
                </p>
              </div>

              <div className="border-t border-slate-800/60 pt-3.5 mt-5 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <DollarSign size={13} className="text-sky-400" />
                  Tarif de base facturé :
                </span>
                <span className="text-lg font-bold font-mono text-white">{course.hourlyRate} € <span className="text-xs text-slate-500 font-normal">/ h</span></span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Course Modal (Create / Edit) */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => courseToDelete && onDeleteCourse(courseToDelete.id)}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le cours "${courseToDelete?.title}" ? Cette action est irréversible.`}
      />
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  {editingCourse ? 'Modifier le Cours' : 'Créer un Enseignement'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Titre du Cours *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Mathématiques - Fonctions & Limites"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Matière Générale *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Mathématiques, Physique"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Niveau / Cycle *</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Primaire">Primaire</option>
                      <option value="Collège">Collège</option>
                      <option value="Lycée">Lycée</option>
                      <option value="Supérieur">Supérieur</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Tarif Horaire Facturé (€/h) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="ex: 35"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Couleur du Badge *</label>
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {COLORS.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setSelectedColor(col.value)}
                          className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${col.class} ${
                            selectedColor === col.value
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Description / Objectifs</label>
                  <textarea
                    rows={3}
                    placeholder="Saisissez le programme du cours ou les détails de l'enseignement..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-950 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/15 cursor-pointer"
                  >
                    {editingCourse ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
