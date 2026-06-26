import React, { useState } from 'react';
import { Course, Student, Teacher, ClassSession } from '../types';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Calendar, Clock, MapPin, UserCheck, AlertTriangle, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDurationHours } from './DashboardOverview';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlanningManagementProps {
  sessions: ClassSession[];
  courses: Course[];
  students: Student[];
  teachers: Teacher[];
  onAddSession: (session: Omit<ClassSession, 'id'>) => void;
  onUpdateSession: (session: ClassSession) => void;
  onDeleteSession: (id: string) => void;
}

// Check overlapping times
export function checkOverlap(
  date1: string, start1: string, end1: string,
  date2: string, start2: string, end2: string
): boolean {
  if (date1 !== date2) return false;
  return start1 < end2 && start2 < end1;
}

export default function PlanningManagement({
  sessions,
  courses,
  students,
  teachers,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
}: PlanningManagementProps) {
  const [selectedDate, setSelectedDate] = useState('2026-06-23'); // seed date (Tuesday 23rd June 2026)
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1)); // June 2026
  const [filterTeacherId, setFilterTeacherId] = useState('Tous');
  const [filterCourseId, setFilterCourseId] = useState('Tous');
  const [filterLevel, setFilterLevel] = useState('Tous');
  const [filterSubject, setFilterSubject] = useState('Tous');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);

  // Form states
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [sessionDate, setSessionDate] = useState('2026-06-23');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [room, setRoom] = useState('Salle 101');
  const [themeIds, setThemeIds] = useState<string[]>([]);
  const [objectiveIds, setObjectiveIds] = useState<string[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'planifié' | 'terminé' | 'annulé'>('planifié');
  const [errorMessage, setErrorMessage] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');

  // Handle open creation modal
  const handleOpenCreate = () => {
    setEditingSession(null);
    setCourseId(courses[0]?.id || '');
    setTeacherId(teachers[0]?.id || '');
    setStudentIds([]);
    setSessionDate(selectedDate || '2026-06-23');
    setStartTime('14:00');
    setEndTime('15:30');
    setRoom('Salle 101');
    setSessionStatus('planifié');
    setErrorMessage('');
    setConflictWarning('');
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (session: ClassSession) => {
    setEditingSession(session);
    setCourseId(session.courseId);
    setTeacherId(session.teacherId);
    setStudentIds(session.studentIds);
    setSessionDate(session.date);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setRoom(session.room);
    setThemeIds(session.themeIds || []);
    setObjectiveIds(session.objectiveIds || []);
    setSessionStatus(session.status);
    setErrorMessage('');
    setConflictWarning('');
    setIsModalOpen(true);
  };

  // Check conflicts dynamically when form inputs change (Requirement #2 - Scheduling overlap alerts)
  const runConflictCheck = (
    currentSessionId: string | null,
    tId: string,
    sDate: string,
    sTime: string,
    eTime: string,
    sRoom: string
  ) => {
    if (!tId || !sDate || !sTime || !eTime) return;

    // Filter other sessions
    const otherSessions = sessions.filter(s => s.id !== currentSessionId && s.status !== 'annulé');

    // 1. Teacher conflicts
    const teacherConflict = otherSessions.find(s => 
      s.teacherId === tId && checkOverlap(s.date, s.startTime, s.endTime, sDate, sTime, eTime)
    );

    if (teacherConflict) {
      const teacherObj = teachers.find(t => t.id === tId);
      const courseObj = courses.find(c => c.id === teacherConflict.courseId);
      setConflictWarning(
        `CONFLIT PLANIFICATION : ${teacherObj?.firstName} ${teacherObj?.lastName} est déjà programmé(e) pour le cours "${courseObj?.title}" à cette heure (${teacherConflict.startTime} - ${teacherConflict.endTime} en ${teacherConflict.room}).`
      );
      return;
    }

    // 2. Room conflicts
    const roomConflict = otherSessions.find(s => 
      s.room === sRoom && checkOverlap(s.date, s.startTime, s.endTime, sDate, sTime, eTime)
    );

    if (roomConflict) {
      const courseObj = courses.find(c => c.id === roomConflict.courseId);
      setConflictWarning(
        `CONFLIT DE SALLE : La "${sRoom}" est déjà réservée par le cours "${courseObj?.title}" sur ce créneau (${roomConflict.startTime} - ${roomConflict.endTime}).`
      );
      return;
    }

    setConflictWarning('');
  };

  // Watchers for conflict detection
  React.useEffect(() => {
    runConflictCheck(
      editingSession ? editingSession.id : null,
      teacherId,
      sessionDate,
      startTime,
      endTime,
      room
    );
  }, [teacherId, sessionDate, startTime, endTime, room, editingSession, sessions]);

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!courseId || !teacherId || studentIds.length === 0 || !sessionDate || !startTime || !endTime || !room) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires et inscrire au moins 1 élève.');
      return;
    }

    if (startTime >= endTime) {
      setErrorMessage('L’heure de début doit être strictement antérieure à l’heure de fin.');
      return;
    }

    const sessionData = {
      courseId,
      teacherId,
      studentIds,
      date: sessionDate,
      startTime,
      endTime,
      room,
      status: sessionStatus,
      themeIds,
      objectiveIds,
    };

    if (editingSession) {
      onUpdateSession({
        id: editingSession.id,
        ...sessionData,
      });
    } else {
      onAddSession(sessionData);
    }

    setIsModalOpen(false);
  };

  const handleToggleStudent = (id: string) => {
    if (studentIds.includes(id)) {
      setStudentIds(studentIds.filter(sId => sId !== id));
    } else {
      setStudentIds([...studentIds, id]);
    }
  };

  // Sort and filter sessions
  const filteredSessions = sessions.filter((session) => {
    const course = courses.find(c => c.id === session.courseId);
    const matchesDate = !selectedDate || session.date === selectedDate;
    const matchesTeacher = filterTeacherId === 'Tous' || session.teacherId === filterTeacherId;
    const matchesCourse = filterCourseId === 'Tous' || session.courseId === filterCourseId;
    const matchesLevel = filterLevel === 'Tous' || (course && course.level === filterLevel);
    const matchesSubject = filterSubject === 'Tous' || (course && course.subject === filterSubject);
    return matchesDate && matchesTeacher && matchesCourse && matchesLevel && matchesSubject;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Extract unique subjects & levels from courses
  const uniqueSubjects = Array.from(new Set(courses.map(c => c.subject)));
  const uniqueLevels = Array.from(new Set(courses.map(c => c.level)));

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">Planning & Gestion de Salles</h1>
          <p className="text-slate-400 text-xs mt-1">Planifiez les cours de soutien, affectez les enseignants aux salles, et évitez en temps réel les conflits d'horaires.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/15 self-start sm:self-center cursor-pointer"
          id="btn-add-session"
        >
          <Plus size={16} />
          <span>Planifier un Cours</span>
        </button>
      </div>

      {/* Monthly Calendar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Calendar size={18} className="text-sky-400" />
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-[10px] font-bold text-slate-500 uppercase text-center py-2">{day}</div>
          ))}
          {eachDayOfInterval({
            start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
            end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
          }).map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const daySessions = sessions.filter(s => s.date === dateStr);
            const isSelected = selectedDate === dateStr;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[80px] p-2 border rounded-xl flex flex-col items-center gap-1 transition-all ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-xs font-mono font-bold">{format(day, 'd')}</span>
                {daySessions.length > 0 && (
                  <span className="text-[9px] font-bold bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full">
                    {daySessions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Professeur :</span>
          <select
            value={filterTeacherId}
            onChange={(e) => setFilterTeacherId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Tous">Tous les professeurs</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Cours / Titre :</span>
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Tous">Tous les cours</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Niveau Scolaire :</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Tous">Tous les niveaux</option>
            {uniqueLevels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Matière :</span>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Tous">Toutes les matières</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Agenda Schedule List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 mb-4 font-display">
          {selectedDate ? `Cours programmés pour le ${new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Tous les cours de la semaine'}
        </h3>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock size={40} className="mx-auto mb-3 text-slate-700" />
            <p className="text-xs font-semibold">Aucune séance planifiée sur ce créneau.</p>
            <button
              onClick={handleOpenCreate}
              className="mt-3 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 text-xs font-bold hover:underline cursor-pointer"
            >
              <Plus size={14} /> Planifier un nouveau cours de soutien
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const course = courses.find((c) => c.id === session.courseId);
              const teacher = teachers.find((t) => t.id === session.teacherId);
              const attendingStudents = students.filter((s) => session.studentIds.includes(s.id));

              return (
                <motion.div
                  key={session.id}
                  layout
                  className={`border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                    session.status === 'annulé' 
                      ? 'border-dashed border-slate-800 bg-slate-950/40 opacity-60' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                    {/* Time block indicator */}
                    <div className="flex-shrink-0 bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center min-w-[100px]">
                      <Clock size={15} className="text-sky-400 mb-1" />
                      <span className="text-xs font-bold font-mono text-white">{session.startTime}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">à {session.endTime}</span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {/* Course badge, title and level */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white tracking-tight">{course?.title}</h4>
                        <span 
                          className="text-[9px] font-bold px-2 py-0.5 rounded-md border"
                          style={{ color: course?.color, borderColor: `${course?.color}25`, backgroundColor: `${course?.color}10` }}
                        >
                          {course?.level}
                        </span>
                        
                        {/* Status tag */}
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                          session.status === 'planifié' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                          session.status === 'terminé' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Instructor, Room & Students details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-400">
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-500">Professeur :</span>
                          <span className="text-white font-semibold">
                            {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Non assigné'}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-500" />
                          <span className="text-slate-500">Salle :</span>
                          <span className="text-white font-semibold">{session.room}</span>
                        </p>
                        <p className="flex items-center gap-1.5 col-span-1 sm:col-span-2 lg:col-span-1">
                          <UserCheck size={13} className="text-slate-500" />
                          <span className="text-slate-500">Inscrits :</span>
                          <span className="text-sky-400 font-bold">{attendingStudents.length} élève{attendingStudents.length > 1 ? 's' : ''}</span>
                        </p>
                      </div>

                      {/* Attendee student quick names */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {attendingStudents.map((s) => (
                          <span key={s.id} className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded border border-slate-800">
                            {s.firstName} {s.lastName.substring(0, 1).toUpperCase()}.
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center md:flex-col justify-end gap-1.5 border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
                    <button
                      onClick={() => handleOpenEdit(session)}
                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-900 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span className="md:hidden">Modifier</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Voulez-vous vraiment supprimer ou annuler ce cours planifié ?')) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span className="md:hidden">Supprimer</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduling Session Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                  <Clock className="text-sky-400" size={16} />
                  {editingSession ? "Modifier le cours" : "Planifier une séance"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {conflictWarning && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-300 text-xs flex items-start gap-2">
                    <AlertTriangle size={16} className="flex-shrink-0 text-amber-400 mt-0.5" />
                    <span>{conflictWarning}</span>
                  </div>
                )}

                {/* Course Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Matière & Cours *</label>
                  <select
                    value={courseId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setCourseId(selectedId);
                      const courseObj = courses.find(c => c.id === selectedId);
                      if (courseObj) {
                        const matchedTeacher = teachers.find(t => t.subjects.includes(courseObj.subject) && t.status === 'actif');
                        if (matchedTeacher) setTeacherId(matchedTeacher.id);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.level}) - {course.hourlyRate} €/h
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Enseignant responsable *</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id} disabled={teacher.status === 'inactif'}>
                        {teacher.firstName} {teacher.lastName} ({teacher.subjects.join(', ')}) {teacher.status === 'inactif' ? '[Inactif]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Date *</label>
                    <input
                      type="date"
                      required
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Heure Début *</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Heure Fin *</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                {/* Room and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Salle affectée *</label>
                    <select
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Salle 101">Salle 101 (Sciences / Mathématiques)</option>
                      <option value="Salle 102">Salle 102 (Lettres / Langues)</option>
                      <option value="Salle 103">Salle 103 (Co-working)</option>
                      <option value="Salle 104">Salle 104 (Physique-Chimie)</option>
                      <option value="Salle Primaire">Salle Primaire (Aide aux devoirs)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Statut du cours *</label>
                    <select
                      value={sessionStatus}
                      onChange={(e) => setSessionStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      <option value="planifié">Planifié</option>
                      <option value="terminé">Terminé</option>
                      <option value="annulé">Annulé</option>
                    </select>
                  </div>
                </div>

                {/* Multiple Students Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Sélectionner les élèves inscrits * ({studentIds.length} sélectionné{studentIds.length > 1 ? 's' : ''})
                  </label>
                  <div className="border border-slate-800 rounded-xl max-h-36 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950">
                    {students.map((student) => {
                      const isChecked = studentIds.includes(student.id);
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleToggleStudent(student.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center font-bold text-[9px] ${
                            isChecked ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-800 bg-slate-950'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                          <span className="truncate">
                            {student.lastName.toUpperCase()} {student.firstName} ({student.gradeLevel})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
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
                    {editingSession ? "Mettre à jour" : "Planifier la séance"}
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
