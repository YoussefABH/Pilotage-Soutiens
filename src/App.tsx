import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Course, Student, Teacher, ClassSession, AuditLogEntry, UserRole, Group, Room, Theme, Objective, Workspace, Receipt } from './types';
import { 
  INITIAL_COURSES, 
  INITIAL_STUDENTS, 
  INITIAL_TEACHERS, 
  INITIAL_SESSIONS,
  INITIAL_GROUPS,
  INITIAL_ROOMS,
  INITIAL_THEMES,
  INITIAL_OBJECTIVES
} from './data/mockData';
import DashboardOverview from './components/DashboardOverview';
import StudentSpace from './components/StudentSpace';
import GuestSpace from './components/GuestSpace';
import ParentSpace from './components/ParentSpace';
import TeacherPortal from './components/TeacherPortal';
import ReceiptsManagement from './components/ReceiptsManagement';
import SettingsManagement from './components/SettingsManagement';
import CourseManagement from './components/CourseManagement';
import StudentManagement from './components/StudentManagement';
import TeacherManagement from './components/TeacherManagement';
import GroupManagement from './components/GroupManagement';
import RoomManagement from './components/RoomManagement';
import ThemeManagement from './components/ThemeManagement';
import PlanningManagement from './components/PlanningManagement';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import AuditLog from './components/AuditLog';
import GlobalSearch from './components/GlobalSearch';
import { 
  auth, 
  logout, 
  saveUserDataToCloud, 
  getUserDataFromCloud,
  getUserProfile,
  updateUserProfileRole,
  addAuditLogEntry,
  getAuditLogs,
  getAllUserProfiles
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { checkPlanningConflicts } from './lib/planning';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  CalendarDays, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Compass,
  LogOut,
  Cloud,
  History,
  Bell,
  Settings,
  TrendingUp,
  MessageSquare,
  CreditCard,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  
  // Academic years state
  const [academicYears, setAcademicYears] = useState<string[]>(() => {
    const saved = localStorage.getItem('soutien_academic_years');
    return saved ? JSON.parse(saved) : ['A.S-2025-2026', 'A.S-2026-2027'];
  });
  const [academicYear, setAcademicYear] = useState<string>(() => {
    const saved = localStorage.getItem('soutien_active_academic_year');
    return saved || 'A.S-2025-2026';
  });
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [pendingNewYear, setPendingNewYear] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [yearReport, setYearReport] = useState<string>('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('finance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currency, setCurrency] = useState('€');
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'warning' }[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('saved');

  const hasUrgentAlert = students.some(s => s.paymentStatus === 'en_retard') ||
                         students.some(s => s.status === 'actif' && (s.totalHours - s.usedHours <= 3) && s.packageType !== 'abonnement_mensuel' && s.packageType !== 'groupe_mensuel') ||
                         checkPlanningConflicts(sessions).length > 0 ||
                         pendingProfiles.length > 0;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          if (firebaseUser.email === 'youssef.a.b.h@gmail.com') {
            if (profile?.role !== 'admin') {
              await updateUserProfileRole(firebaseUser.uid, 'admin');
            }
            setUserRole('admin');
          } else if (profile && profile.role) {
            setUserRole(profile.role as UserRole);
          } else {
            setUserRole('guest');
          }

          setSyncStatus('syncing');
          const currentYear = localStorage.getItem('soutien_active_academic_year') || 'A.S-2025-2026';
          const cloudData = await getUserDataFromCloud(firebaseUser.uid, currentYear);
          const logs = await getAuditLogs();
          setAuditLogs(logs);

          if (cloudData) {
            setCourses(cloudData.courses || []);
            setStudents(cloudData.students || []);
            setTeachers(cloudData.teachers || []);
            setSessions(cloudData.sessions || []);
            setGroups(cloudData.groups || INITIAL_GROUPS);
            setRooms(cloudData.rooms || INITIAL_ROOMS);
            setThemes(cloudData.themes || INITIAL_THEMES);
            setObjectives(cloudData.objectives || INITIAL_OBJECTIVES);
            setReceipts(cloudData.receipts || []);
            setIsClosed(cloudData.isClosed || false);
            setYearReport(cloudData.yearReport || '');
            setLastBackupTime(cloudData.updatedAt);
            setSyncStatus('saved');
          } else {
            loadLocalFallback();
            setSyncStatus('saved');
          }
        } catch (err: any) {
          console.error("Failed to load user cloud data on auth:", err);
          setSyncStatus('error');
          if (err.message && err.message.includes("offline")) {
            addNotification("Vous êtes hors ligne. Les données seront chargées depuis le cache local.", "warning");
          } else {
            addNotification("Erreur lors du chargement des données depuis le Cloud.", "warning");
          }
          loadLocalFallback();
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Poll for pending registrations if user is administrator
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setPendingProfiles([]);
      return;
    }

    const fetchPendingUsers = async () => {
      try {
        const profiles = await getAllUserProfiles();
        const pending = profiles.filter((p: any) => p.status === 'pending' && (p.userType === 'student' || p.userType === 'parent'));
        
        setPendingProfiles((prev) => {
          // Trigger alert notification for any newly added pending profiles
          pending.forEach((newProfile: any) => {
            const alreadyNotified = prev.some((p) => p.userId === newProfile.userId);
            if (!alreadyNotified) {
              addNotification(
                `🔔 Nouvel utilisateur inscrit : ${newProfile.firstName || ''} ${newProfile.lastName || ''} (${newProfile.userType === 'student' ? 'Élève' : 'Parent'}) - En attente d'activation`,
                'warning'
              );
            }
          });
          return pending;
        });
      } catch (err) {
        console.error("Erreur lors du chargement des inscriptions en attente:", err);
      }
    };

    fetchPendingUsers();
    const interval = setInterval(fetchPendingUsers, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [user, userRole]);

  const loadLocalFallback = () => {
    setCourses(INITIAL_COURSES);
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setSessions(INITIAL_SESSIONS);
    setGroups(INITIAL_GROUPS);
    setRooms(INITIAL_ROOMS);
    setThemes(INITIAL_THEMES);
    setObjectives(INITIAL_OBJECTIVES);
    setReceipts([]);
    setIsClosed(false);
    setYearReport('');
  };

  const syncStorage = async (key: string, data: any) => {
    if (isClosed) {
      addNotification("Cette année scolaire est clôturée en lecture seule. Les modifications ne sont pas enregistrées.", "warning");
      return;
    }
    if (auth.currentUser) {
      setSyncStatus('syncing');
      try {
        const dataToSave = {
          courses: key === 'soutien_courses' ? data : courses,
          students: key === 'soutien_students' ? data : students,
          teachers: key === 'soutien_teachers' ? data : teachers,
          sessions: key === 'soutien_sessions' ? data : sessions,
          groups: key === 'soutien_groups' ? data : groups,
          rooms: key === 'soutien_rooms' ? data : rooms,
          themes: key === 'soutien_themes' ? data : themes,
          objectives: key === 'soutien_objectives' ? data : objectives,
          receipts: key === 'soutien_receipts' ? data : receipts,
          isClosed,
          yearReport,
        };
        const backupResult = await saveUserDataToCloud(auth.currentUser.uid, dataToSave, academicYear);
        if (backupResult) {
          setLastBackupTime(backupResult.updatedAt);
        }
        setSyncStatus('saved');
      } catch (err) {
        console.error("Auto-backup failed:", err);
        setSyncStatus('error');
      }
    }
  };

  const handleAcademicYearChange = async (targetYear: string) => {
    if (targetYear === 'new') {
      setShowNewYearModal(true);
      return;
    }
    
    setSyncStatus('syncing');
    try {
      if (user) {
        const cloudData = await getUserDataFromCloud(user.uid, targetYear);
        if (cloudData) {
          // Cloud data exists, load it directly
          setCourses(cloudData.courses || []);
          setStudents(cloudData.students || []);
          setTeachers(cloudData.teachers || []);
          setSessions(cloudData.sessions || []);
          setGroups(cloudData.groups || INITIAL_GROUPS);
          setRooms(cloudData.rooms || INITIAL_ROOMS);
          setThemes(cloudData.themes || INITIAL_THEMES);
          setObjectives(cloudData.objectives || INITIAL_OBJECTIVES);
          setReceipts(cloudData.receipts || []);
          setIsClosed(cloudData.isClosed || false);
          setYearReport(cloudData.yearReport || '');
          setLastBackupTime(cloudData.updatedAt);
          setAcademicYear(targetYear);
          localStorage.setItem('soutien_active_academic_year', targetYear);
          setSyncStatus('saved');
          addNotification(`Année scolaire chargée : ${targetYear}`, 'success');
        } else {
          // No cloud data for this year, prompt to copy from current or start blank
          setPendingNewYear(targetYear);
          setShowTransitionModal(true);
        }
      } else {
        // Not logged in (offline/fallback mode)
        const savedLocal = localStorage.getItem(`soutien_local_fallback_${targetYear}`);
        if (savedLocal) {
          const localData = JSON.parse(savedLocal);
          setCourses(localData.courses || []);
          setStudents(localData.students || []);
          setTeachers(localData.teachers || []);
          setSessions(localData.sessions || []);
          setGroups(localData.groups || INITIAL_GROUPS);
          setRooms(localData.rooms || INITIAL_ROOMS);
          setThemes(localData.themes || INITIAL_THEMES);
          setObjectives(localData.objectives || INITIAL_OBJECTIVES);
          setReceipts(localData.receipts || []);
          setIsClosed(localData.isClosed || false);
          setYearReport(localData.yearReport || '');
          setAcademicYear(targetYear);
          localStorage.setItem('soutien_active_academic_year', targetYear);
          setSyncStatus('saved');
        } else {
          setPendingNewYear(targetYear);
          setShowTransitionModal(true);
        }
      }
    } catch (err) {
      console.error("Error switching academic year:", err);
      setSyncStatus('error');
      addNotification("Erreur lors du changement d'année scolaire.", "warning");
    }
  };

  const applyNewYearInit = async (option: 'copy_all' | 'copy_config' | 'start_fresh') => {
    if (!pendingNewYear) return;
    
    let nextCourses: Course[] = [];
    let nextStudents: Student[] = [];
    let nextTeachers: Teacher[] = [];
    let nextSessions: ClassSession[] = [];
    let nextGroups: Group[] = [];
    let nextRooms: Room[] = [];
    let nextThemes: Theme[] = [];
    let nextObjectives: Objective[] = [];
    let nextReceipts: Receipt[] = [];

    if (option === 'copy_all') {
      nextCourses = [...courses];
      nextStudents = [...students];
      nextTeachers = [...teachers];
      nextSessions = [...sessions];
      nextGroups = [...groups];
      nextRooms = [...rooms];
      nextThemes = [...themes];
      nextObjectives = [...objectives];
      nextReceipts = [...receipts];
    } else if (option === 'copy_config') {
      nextCourses = [...courses];
      nextTeachers = [...teachers];
      nextGroups = [...groups];
      nextRooms = [...rooms];
      nextThemes = [...themes];
      nextObjectives = [...objectives];
      // students, sessions, receipts are cleared for the brand new year
    }

    setCourses(nextCourses);
    setStudents(nextStudents);
    setTeachers(nextTeachers);
    setSessions(nextSessions);
    setGroups(nextGroups);
    setRooms(nextRooms);
    setThemes(nextThemes);
    setObjectives(nextObjectives);
    setReceipts(nextReceipts);

    setAcademicYear(pendingNewYear);
    localStorage.setItem('soutien_active_academic_year', pendingNewYear);
    
    // Add the year to academicYears list if not present
    if (!academicYears.includes(pendingNewYear)) {
      const updatedYears = [...academicYears, pendingNewYear].sort();
      setAcademicYears(updatedYears);
      localStorage.setItem('soutien_academic_years', JSON.stringify(updatedYears));
    }

    setIsClosed(false);
    setYearReport('');

    // Save newly initialized data to cloud or local storage
    if (user) {
      setSyncStatus('syncing');
      try {
        const dataToSave = {
          courses: nextCourses,
          students: nextStudents,
          teachers: nextTeachers,
          sessions: nextSessions,
          groups: nextGroups,
          rooms: nextRooms,
          themes: nextThemes,
          objectives: nextObjectives,
          receipts: nextReceipts,
          isClosed: false,
          yearReport: ''
        };
        const backupResult = await saveUserDataToCloud(user.uid, dataToSave, pendingNewYear);
        if (backupResult) {
          setLastBackupTime(backupResult.updatedAt);
        }
        setSyncStatus('saved');
        addNotification(`Année scolaire ${pendingNewYear} initialisée et sauvegardée !`, 'success');
      } catch (err) {
        console.error("Failed to sync new academic year initialization:", err);
        setSyncStatus('error');
      }
    } else {
      // Save to local fallback
      const localData = {
        courses: nextCourses,
        students: nextStudents,
        teachers: nextTeachers,
        sessions: nextSessions,
        groups: nextGroups,
        rooms: nextRooms,
        themes: nextThemes,
        objectives: nextObjectives,
        receipts: nextReceipts,
        isClosed: false,
        yearReport: ''
      };
      localStorage.setItem(`soutien_local_fallback_${pendingNewYear}`, JSON.stringify(localData));
      setSyncStatus('saved');
      addNotification(`Année scolaire ${pendingNewYear} initialisée localement !`, 'success');
    }

    setShowTransitionModal(false);
    setPendingNewYear(null);
  };

  const handleAddNewYear = () => {
    const trimmed = newYearInput.trim();
    if (!trimmed) return;
    
    if (academicYears.includes(trimmed)) {
      addNotification("Cette année scolaire existe déjà !", "warning");
      return;
    }
    
    const updatedYears = [...academicYears, trimmed].sort();
    setAcademicYears(updatedYears);
    localStorage.setItem('soutien_academic_years', JSON.stringify(updatedYears));
    
    setShowNewYearModal(false);
    setNewYearInput('');
    
    // Automatically switch to the newly created year (which will trigger transition modal)
    handleAcademicYearChange(trimmed);
  };

  const handleSaveYearReport = async (closed: boolean, reportText: string) => {
    setIsClosed(closed);
    setYearReport(reportText);

    if (user) {
      setSyncStatus('syncing');
      try {
        const dataToSave = {
          courses,
          students,
          teachers,
          sessions,
          groups,
          rooms,
          themes,
          objectives,
          receipts,
          isClosed: closed,
          yearReport: reportText,
        };
        const backupResult = await saveUserDataToCloud(user.uid, dataToSave, academicYear);
        if (backupResult) {
          setLastBackupTime(backupResult.updatedAt);
        }
        setSyncStatus('saved');
        addNotification(closed ? "L'année scolaire a été clôturée avec succès." : "Bilan de l'année scolaire enregistré.", "success");
        addAuditLog('update', 'other', academicYear, closed ? `Clôture de l'année scolaire avec bilan` : `Mise à jour du bilan annuel`);
      } catch (err) {
        console.error("Failed to save year status:", err);
        setSyncStatus('error');
        addNotification("Erreur lors de l'enregistrement du bilan.", "warning");
      }
    } else {
      // Local fallback
      const localData = {
        courses,
        students,
        teachers,
        sessions,
        groups,
        rooms,
        themes,
        objectives,
        receipts,
        isClosed: closed,
        yearReport: reportText,
      };
      localStorage.setItem(`soutien_local_fallback_${academicYear}`, JSON.stringify(localData));
      addNotification(closed ? "L'année scolaire a été clôturée localement." : "Bilan annuel enregistré localement.", "success");
    }
  };

  const handleGetYearData = async (targetYear: string) => {
    if (user) {
      return await getUserDataFromCloud(user.uid, targetYear);
    } else {
      const savedLocal = localStorage.getItem(`soutien_local_fallback_${targetYear}`);
      return savedLocal ? JSON.parse(savedLocal) : null;
    }
  };

  const addNotification = (message: string, type: 'success' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const addAuditLog = async (action: AuditLogEntry['action'], entityType: AuditLogEntry['entityType'], entityId: string, description: string, status?: AuditLogEntry['status']) => {
    if (!user) return;
    const entry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
      userId: user.uid,
      userEmail: user.email || 'unknown',
      action,
      entityType,
      entityId,
      description,
      status
    };
    await addAuditLogEntry(entry);
    setAuditLogs(prev => [{...entry, id: 'temp_' + Date.now(), timestamp: new Date().toISOString()}, ...prev]);
  };

  const handleImportDemoData = async (demoData: {
    courses: any[];
    students: any[];
    teachers: any[];
    sessions: any[];
    groups: any[];
    rooms: any[];
    themes: any[];
    objectives: any[];
    receipts: any[];
  }) => {
    setCourses(demoData.courses);
    setStudents(demoData.students);
    setTeachers(demoData.teachers);
    setSessions(demoData.sessions);
    setGroups(demoData.groups);
    setRooms(demoData.rooms);
    setThemes(demoData.themes);
    setObjectives(demoData.objectives);
    setReceipts(demoData.receipts);

    if (user) {
      setSyncStatus('syncing');
      try {
        const dataToSave = {
          ...demoData,
          isClosed: false,
          yearReport: ''
        };
        const backupResult = await saveUserDataToCloud(user.uid, dataToSave, academicYear);
        if (backupResult) {
          setLastBackupTime(backupResult.updatedAt);
        }
        setSyncStatus('saved');
        addNotification("Données de démonstration importées et sauvegardées sur le Cloud !", "success");
        addAuditLog('create', 'other', academicYear, "Importation des données de démonstration");
      } catch (err) {
        console.error("Failed to sync demo data:", err);
        setSyncStatus('error');
        addNotification("Erreur lors de la sauvegarde Cloud des données de démo.", "warning");
      }
    } else {
      const localData = {
        ...demoData,
        isClosed: false,
        yearReport: ''
      };
      localStorage.setItem(`soutien_local_fallback_${academicYear}`, JSON.stringify(localData));
      setSyncStatus('saved');
      addNotification("Données de démonstration chargées localement !", "success");
    }
  };

  const handleAddCourse = (newCourse: Omit<Course, 'id'>) => {
    const id = 'c_' + Date.now();
    const updated = [...courses, { id, ...newCourse }];
    setCourses(updated);
    syncStorage('soutien_courses', updated);
    addNotification(`Le cours "${newCourse.title}" a été créé.`);
    addAuditLog('create', 'course', id, `Création du cours: ${newCourse.title}`);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    const updated = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
    setCourses(updated);
    syncStorage('soutien_courses', updated);
    addAuditLog('update', 'course', updatedCourse.id, `Mise à jour du cours: ${updatedCourse.title}`);
  };

  const handleDeleteCourse = (id: string) => {
    const target = courses.find(c => c.id === id);
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    syncStorage('soutien_courses', updated);
    if (target) addAuditLog('delete', 'course', id, `Suppression du cours: ${target.title}`);
  };

  const handleAddReceipt = (newReceipt: Omit<Receipt, 'id'>) => {
    const id = 'r_' + Date.now();
    const receipt: Receipt = {
      ...newReceipt,
      id
    };
    const updated = [...receipts, receipt];
    setReceipts(updated);
    syncStorage('soutien_receipts', updated);
    addNotification(`Recette pour ${receipt.studentName} (${receipt.amount} ${currency}) saisie !`);
    addAuditLog('create', 'other', id, `Saisie de recette pour ${receipt.studentName} d'un montant de ${receipt.amount} ${currency}`);
  };

  const handleUpdateReceipt = (updatedReceipt: Receipt) => {
    const updated = receipts.map(r => r.id === updatedReceipt.id ? updatedReceipt : r);
    setReceipts(updated);
    syncStorage('soutien_receipts', updated);
    addNotification("La saisie de recette a été mise à jour !");
    addAuditLog('update', 'other', updatedReceipt.id, `Mise à jour recette de ${updatedReceipt.studentName}`);
  };

  const handleDeleteReceipt = (id: string) => {
    const target = receipts.find(r => r.id === id);
    const updated = receipts.filter(r => r.id !== id);
    setReceipts(updated);
    syncStorage('soutien_receipts', updated);
    if (target) {
      addNotification(`Saisie pour ${target.studentName} supprimée.`);
      addAuditLog('delete', 'other', id, `Suppression recette de ${target.studentName}`);
    }
  };

  const handleAddStudent = (newStudent: Omit<Student, 'id' | 'enrollmentDate' | 'grades' | 'progressReports'>) => {
    const id = 's_' + Date.now();
    const initializedStudent: Student = {
      id,
      enrollmentDate: new Date().toISOString().split('T')[0],
      grades: [],
      progressReports: [],
      ...newStudent
    };
    const updated = [...students, initializedStudent];
    setStudents(updated);
    syncStorage('soutien_students', updated);
    addAuditLog('create', 'student', id, `Inscription de l'élève: ${newStudent.firstName} ${newStudent.lastName}`);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    setStudents(updated);
    syncStorage('soutien_students', updated);
    addAuditLog('update', 'student', updatedStudent.id, `Mise à jour de l'élève: ${updatedStudent.firstName} ${updatedStudent.lastName}`);
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    syncStorage('soutien_students', updated);
    if (target) addAuditLog('delete', 'student', id, `Suppression de l'élève: ${target.firstName} ${target.lastName}`);
  };

  const handleAddTeacher = (newTeacher: Omit<Teacher, 'id'>) => {
    const id = 't_' + Date.now();
    const updated = [...teachers, { id, ...newTeacher }];
    setTeachers(updated);
    syncStorage('soutien_teachers', updated);
    addAuditLog('create', 'teacher', id, `Ajout du professeur: ${newTeacher.firstName} ${newTeacher.lastName}`);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const updated = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    setTeachers(updated);
    syncStorage('soutien_teachers', updated);
    addAuditLog('update', 'teacher', updatedTeacher.id, `Mise à jour du professeur: ${updatedTeacher.firstName} ${updatedTeacher.lastName}`);
  };

  const handleDeleteTeacher = (id: string) => {
    const target = teachers.find(t => t.id === id);
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    syncStorage('soutien_teachers', updated);
    if (target) addAuditLog('delete', 'teacher', id, `Suppression du professeur: ${target.firstName} ${target.lastName}`);
  };

  const handleAddSession = (newSession: Omit<ClassSession, 'id'>) => {
    const id = 'sess_' + Date.now();
    const updated = [...sessions, { id, ...newSession }];
    setSessions(updated);
    syncStorage('soutien_sessions', updated);
    addAuditLog('create', 'session', id, `Planification d'une session`);
  };

  const handleUpdateSession = (updatedSession: ClassSession) => {
    const updated = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    setSessions(updated);
    syncStorage('soutien_sessions', updated);
    addAuditLog('update', 'session', updatedSession.id, `Mise à jour d'une session`);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    syncStorage('soutien_sessions', updated);
    addAuditLog('delete', 'session', id, `Suppression d'une session`);
  };

  const handleAddGroup = (newGroup: Omit<Group, 'id'>) => {
    const id = 'g_' + Date.now();
    const updated = [...groups, { id, ...newGroup }];
    setGroups(updated);
    syncStorage('soutien_groups', updated);
    addNotification(`Le groupe "${newGroup.name}" a été créé.`);
    addAuditLog('create', 'group', id, `Création du groupe: ${newGroup.name}`);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    const updated = groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
    setGroups(updated);
    syncStorage('soutien_groups', updated);
    addAuditLog('update', 'group', updatedGroup.id, `Mise à jour du groupe: ${updatedGroup.name}`);
  };

  const handleDeleteGroup = (id: string) => {
    const target = groups.find(g => g.id === id);
    const updated = groups.filter(g => g.id !== id);
    setGroups(updated);
    syncStorage('soutien_groups', updated);
    if (target) addAuditLog('delete', 'group', id, `Suppression du groupe: ${target.name}`);
  };

  const handleAddRoom = (newRoom: Omit<Room, 'id'>) => {
    const id = 'r_' + Date.now();
    const updated = [...rooms, { id, ...newRoom }];
    setRooms(updated);
    syncStorage('soutien_rooms', updated);
    addNotification(`La salle "${newRoom.name}" a été ajoutée.`);
    addAuditLog('create', 'room', id, `Création de la salle: ${newRoom.name}`);
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    const updated = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    setRooms(updated);
    syncStorage('soutien_rooms', updated);
    addAuditLog('update', 'room', updatedRoom.id, `Mise à jour de la salle: ${updatedRoom.name}`);
  };

  const handleDeleteRoom = (id: string) => {
    const target = rooms.find(r => r.id === id);
    const updated = rooms.filter(r => r.id !== id);
    setRooms(updated);
    syncStorage('soutien_rooms', updated);
    if (target) addAuditLog('delete', 'room', id, `Suppression de la salle: ${target.name}`);
  };

  const handleAddTheme = (newTheme: Omit<Theme, 'id'>) => {
    const id = 'th_' + Date.now();
    const updated = [...themes, { id, ...newTheme }];
    setThemes(updated);
    syncStorage('soutien_themes', updated);
    addNotification(`Le thème "${newTheme.name}" a été créé.`);
    addAuditLog('create', 'theme', id, `Création du thème: ${newTheme.name}`);
  };

  const handleUpdateTheme = (updatedTheme: Theme) => {
    const updated = themes.map(t => t.id === updatedTheme.id ? updatedTheme : t);
    setThemes(updated);
    syncStorage('soutien_themes', updated);
    addAuditLog('update', 'theme', updatedTheme.id, `Mise à jour du thème: ${updatedTheme.name}`);
  };

  const handleDeleteTheme = (id: string) => {
    const target = themes.find(t => t.id === id);
    const updated = themes.filter(t => t.id !== id);
    setThemes(updated);
    syncStorage('soutien_themes', updated);
    if (target) addAuditLog('delete', 'theme', id, `Suppression du thème: ${target.name}`);
  };

  const handleAddObjective = (newObjective: Omit<Objective, 'id'>) => {
    const id = 'ob_' + Date.now();
    const updated = [...objectives, { id, ...newObjective }];
    setObjectives(updated);
    syncStorage('soutien_objectives', updated);
    addNotification(`L'objectif "${newObjective.name}" a été créé.`);
    addAuditLog('create', 'objective', id, `Création de l'objectif: ${newObjective.name}`);
  };

  const handleUpdateObjective = (updatedObjective: Objective) => {
    const updated = objectives.map(o => o.id === updatedObjective.id ? updatedObjective : o);
    setObjectives(updated);
    syncStorage('soutien_objectives', updated);
    addAuditLog('update', 'objective', updatedObjective.id, `Mise à jour de l'objectif: ${updatedObjective.name}`);
  };

  const handleDeleteObjective = (id: string) => {
    const target = objectives.find(o => o.id === id);
    const updated = objectives.filter(o => o.id !== id);
    setObjectives(updated);
    syncStorage('soutien_objectives', updated);
    if (target) addAuditLog('delete', 'objective', id, `Suppression de l'objectif: ${target.name}`);
  };

  const handleLogout = async () => {
    await logout();
  };

  const workspaceOptions: { id: Workspace; label: string }[] = [
    { id: 'finance', label: 'Pilotage Financier' },
    { id: 'planning', label: 'Gestion Planning' },
    { id: 'admin', label: 'Administration' },
  ];

  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, workspace: 'finance', roles: ['admin'] },
    { id: 'receipts', label: 'Saisie Recettes', icon: CreditCard, workspace: 'finance', roles: ['admin'] },
    { id: 'student_dashboard', label: 'Mon Tableau de Bord', icon: LayoutDashboard, workspace: 'finance', roles: ['student'] },
    { id: 'student_planning', label: 'Mon Planning & Cours', icon: CalendarDays, workspace: 'finance', roles: ['student'] },
    { id: 'student_grades', label: 'Notes & Compétences', icon: TrendingUp, workspace: 'finance', roles: ['student'] },
    { id: 'student_messages', label: 'Messagerie & Questions', icon: MessageSquare, workspace: 'finance', roles: ['student'] },
    { id: 'student_resources', label: 'Bibliothèque de ressources', icon: BookOpen, workspace: 'finance', roles: ['student'] },
    { id: 'student_history', label: 'Rapports & Bilans', icon: History, workspace: 'finance', roles: ['student'] },
    { id: 'parent_dashboard', label: 'Mon Suivi Enfant', icon: LayoutDashboard, workspace: 'finance', roles: ['parent'] },
    { id: 'parent_planning', label: 'Planning & Séances', icon: CalendarDays, workspace: 'finance', roles: ['parent'] },
    { id: 'parent_grades', label: 'Résultats & Progrès', icon: TrendingUp, workspace: 'finance', roles: ['parent'] },
    { id: 'parent_billing', label: 'Factures & Règlements', icon: CreditCard, workspace: 'finance', roles: ['parent'] },
    { id: 'parent_messages', label: 'Contact & Messagerie', icon: MessageSquare, workspace: 'finance', roles: ['parent'] },
    { id: 'parent_history', label: 'Bilans & Devoirs', icon: History, workspace: 'finance', roles: ['parent'] },
    { id: 'teacher_dashboard', label: 'Mon Espace Enseignant', icon: LayoutDashboard, workspace: 'finance', roles: ['teacher'] },
    { id: 'teacher_planning', label: 'Mes Cours & Émargements', icon: CalendarDays, workspace: 'finance', roles: ['teacher'] },
    { id: 'teacher_students', label: 'Mes Élèves & Notes', icon: Users, workspace: 'finance', roles: ['teacher'] },
    { id: 'teacher_pay', label: 'Mes Heures & Salaires', icon: CreditCard, workspace: 'finance', roles: ['teacher'] },
    { id: 'teacher_messages', label: 'Messagerie & Contacts', icon: MessageSquare, workspace: 'finance', roles: ['teacher'] },
    { id: 'courses', label: 'Cours & Tarifications', icon: BookOpen, workspace: 'finance', roles: ['admin'] },
    { id: 'students', label: 'Élèves & Forfaits', icon: Users, workspace: 'finance', roles: ['admin'] },
    { id: 'groups', label: 'Groupes', icon: Users, workspace: 'planning', roles: ['admin'] },
    { id: 'rooms', label: 'Salles', icon: CalendarDays, workspace: 'planning', roles: ['admin'] },
    { id: 'themes', label: 'Thèmes & Objectifs', icon: Compass, workspace: 'planning', roles: ['admin'] },
    { id: 'teachers', label: 'Professeurs & Paies', icon: GraduationCap, workspace: 'admin', roles: ['admin'] },
    { id: 'users', label: 'Gestion Utilisateurs', icon: Users, workspace: 'admin', roles: ['admin'] },
    { id: 'planning', label: 'Planning & Salles', icon: CalendarDays, workspace: 'planning', roles: ['admin'] },
    { id: 'audit', label: 'Historique Activités', icon: History, workspace: 'admin', roles: ['admin'] },
    { id: 'settings', label: 'Paramètres', icon: Settings, workspace: 'admin', roles: ['admin'] },
  ];

  const filteredWorkspaceOptions = workspaceOptions.filter(ws => 
    navigationItems.some(item => 
      item.workspace === ws.id && 
      (!item.roles || item.roles.includes(userRole))
    )
  );

  const filteredNavItems = navigationItems.filter(item => 
    item.workspace === activeWorkspace && 
    (!item.roles || item.roles.includes(userRole))
  );

  // Strict role security & tab redirection enforcement
  useEffect(() => {
    if (authLoading) return;

    if (userRole === 'student') {
      const studentTabs = ['student_dashboard', 'student_planning', 'student_grades', 'student_messages', 'student_resources', 'student_history'];
      if (!studentTabs.includes(activeTab)) {
        setActiveTab('student_dashboard');
      }
      if (activeWorkspace !== 'finance') {
        setActiveWorkspace('finance');
      }
    } else if (userRole === 'parent') {
      const parentTabs = ['parent_dashboard', 'parent_planning', 'parent_grades', 'parent_billing', 'parent_messages', 'parent_history'];
      if (!parentTabs.includes(activeTab)) {
        setActiveTab('parent_dashboard');
      }
      if (activeWorkspace !== 'finance') {
        setActiveWorkspace('finance');
      }
    } else if (userRole === 'teacher') {
      const teacherTabs = ['teacher_dashboard', 'teacher_planning', 'teacher_students', 'teacher_pay', 'teacher_messages'];
      if (!teacherTabs.includes(activeTab)) {
        setActiveTab('teacher_dashboard');
      }
      if (activeWorkspace !== 'finance') {
        setActiveWorkspace('finance');
      }
    } else {
      // General safety fallback check for admin / teacher
      const currentItem = navigationItems.find(item => item.id === activeTab);
      if (currentItem && currentItem.roles && !currentItem.roles.includes(userRole)) {
        const fallbackItem = navigationItems.find(item => !item.roles || item.roles.includes(userRole));
        if (fallbackItem) {
          setActiveTab(fallbackItem.id);
          setActiveWorkspace(fallbackItem.workspace as Workspace);
        }
      }
    }
  }, [userRole, activeTab, activeWorkspace, authLoading]);

  // Auto-switch workspace if current one becomes empty for user (only relevant if they have options)
  useEffect(() => {
    if (filteredNavItems.length === 0 && filteredWorkspaceOptions.length > 0) {
      setActiveWorkspace(filteredWorkspaceOptions[0].id);
      const firstItem = navigationItems.find(item => item.workspace === filteredWorkspaceOptions[0].id);
      if (firstItem) setActiveTab(firstItem.id);
    }
  }, [userRole, activeWorkspace]);

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      if (profile && profile.role) {
        setUserRole(profile.role as UserRole);
      }
    }
  };

  console.log("App component rendered, authLoading:", authLoading, "user:", user);
  if (authLoading) return <div className="p-10 text-white">Chargement...</div>;
  if (!user) return <Login onLoginSuccess={(u) => setUser(u)} />;

  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans flex flex-col text-slate-100">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center font-display font-black text-white text-xs shadow-md">
              PS
            </div>
            <span className="text-xs font-black font-display tracking-tight text-white uppercase">PILOTAGE SOUTIEN</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-300">{user.displayName || user.email}</span>
              <span className="text-[10px] text-sky-400 uppercase font-black tracking-widest font-mono">Compte Invité</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">Déconnexion</button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <GuestSpace 
            userId={user.uid} 
            userEmail={user.email || ''} 
            onProfileUpdated={refreshUserProfile}
            existingProfile={userProfile}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex text-slate-100">
      <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} lg:flex flex-col absolute lg:relative z-20 w-72 h-full bg-slate-900 border-r border-slate-800`}>
        <div className="p-4 border-b border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Espace de travail</div>
          {filteredWorkspaceOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setActiveWorkspace(opt.id);
                const firstItem = navigationItems.find(item => item.workspace === opt.id);
                if (firstItem) setActiveTab(firstItem.id);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeWorkspace === opt.id ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              {opt.label}
            </button>
          ))}
          <button className="lg:hidden w-full text-center text-xs text-slate-500 mt-2" onClick={() => setIsSidebarOpen(false)}>Fermer</button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-sky-600/20 text-sky-400 shadow-[0_0_10px_rgba(2,132,199,0.2)] border border-sky-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></button>
            {['admin', 'teacher'].includes(userRole) && (
              <GlobalSearch
                students={students}
                teachers={teachers}
                sessions={sessions}
                courses={courses}
                currency={currency}
                onNavigate={(tab, workspace) => {
                  setActiveWorkspace(workspace);
                  setActiveTab(tab);
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Academic Year Selection Dropdown */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm transition-all hover:border-slate-700">
                <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <select
                  value={academicYear}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  className="bg-transparent border-none text-slate-200 text-xs font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-1"
                >
                  {academicYears.map(year => (
                    <option key={year} value={year} className="bg-slate-900 text-slate-200 font-bold">{year}</option>
                  ))}
                  <option value="new" className="bg-slate-900 text-sky-400 font-bold">+ Ajouter une année...</option>
                </select>
              </div>
            )}

            {user && (
              <div 
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 transition-all cursor-default" 
                title={lastBackupTime ? `Dernière sauvegarde: ${new Date(lastBackupTime).toLocaleTimeString('fr-FR')}` : "Aucune sauvegarde"}
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Synchro en cours...</span>
                  </>
                ) : syncStatus === 'saved' ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sauvegardé</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Erreur Cloud</span>
                  </>
                )}
              </div>
            )}
            {userRole === 'admin' && pendingProfiles.length > 0 && (
              <button 
                onClick={() => {
                  setActiveWorkspace('admin');
                  setActiveTab('users');
                }}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/5"
              >
                <Users size={14} className="animate-pulse" />
                <span>{pendingProfiles.length} Inscription{pendingProfiles.length > 1 ? 's' : ''} en attente</span>
              </button>
            )}
            {hasUrgentAlert && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="text-amber-500 animate-pulse"
                title="Actions administratives en attente"
              >
                <Bell size={20} />
              </motion.div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold">{user.displayName}</span>
              <span className="text-xs text-slate-500 capitalize">{userRole}</span>
            </div>
            <button onClick={handleLogout} className="text-rose-400 hover:text-rose-300">Déconnexion</button>
          </div>
        </header>
 
        <main className="flex-1 p-6 md:p-8 font-sans">
          {isClosed && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display">Année Scolaire Archivée / Clôturée ({academicYear})</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Toutes les informations (élèves, recettes, plannings) sont archivées en lecture seule. Vous pouvez consulter ou rédiger le bilan d'activité dans l'onglet Paramètres.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black tracking-widest uppercase bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-xl shrink-0">
                Lecture Seule
              </span>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeTab === 'dashboard' && (
                <DashboardOverview 
                  currency={currency} 
                  courses={courses} 
                  students={students} 
                  teachers={teachers} 
                  sessions={sessions} 
                  onNavigate={(tab) => setActiveTab(tab)} 
                  onAddAuditLog={addAuditLog} 
                  onAddNotification={addNotification} 
                  onUpdateStudent={handleUpdateStudent} 
                  auditLogs={auditLogs}
                  academicYear={academicYear}
                  academicYears={academicYears}
                  receipts={receipts}
                  onGetYearData={handleGetYearData}
                />
              )}
              {['student_dashboard', 'student_planning', 'student_grades', 'student_messages', 'student_resources', 'student_history'].includes(activeTab) && user && (
                <StudentSpace 
                  currentTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab)}
                  student={
                    students.find(s => s.email === user.email) || {
                      id: 'temp_student',
                      firstName: userProfile?.firstName || user.displayName?.split(' ')[0] || 'Élève',
                      lastName: userProfile?.lastName || user.displayName?.split(' ')[1] || '',
                      gradeLevel: userProfile?.gradeLevel || 'Scolaire',
                      email: user.email || '',
                      phone: userProfile?.phone || '',
                      enrollmentDate: new Date().toISOString().split('T')[0],
                      status: 'actif',
                      packageType: 'forfait_10h',
                      totalHours: 10,
                      usedHours: 0,
                      paymentStatus: 'en_attente',
                      balance: 0,
                      grades: [],
                      progressReports: []
                    }
                  } 
                  sessions={sessions} 
                  courses={courses} 
                  objectives={objectives} 
                  themes={themes} 
                  userProfile={userProfile}
                  onUpdateSession={handleUpdateSession}
                />
              )}
              {['parent_dashboard', 'parent_planning', 'parent_grades', 'parent_billing', 'parent_messages', 'parent_history'].includes(activeTab) && user && (
                <ParentSpace 
                  students={students}
                  sessions={sessions}
                  courses={courses}
                  teachers={teachers}
                  objectives={objectives}
                  themes={themes}
                  parentEmail={user.email || ''}
                  currentTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab)}
                  onUpdateStudent={handleUpdateStudent}
                />
              )}
              {['teacher_dashboard', 'teacher_planning', 'teacher_students', 'teacher_pay', 'teacher_messages'].includes(activeTab) && user && (
                <TeacherPortal
                  teacher={
                    teachers.find(t => t.email === user.email) || {
                      id: 'temp_teacher',
                      firstName: userProfile?.firstName || user.displayName?.split(' ')[0] || 'Enseignant',
                      lastName: userProfile?.lastName || user.displayName?.split(' ')[1] || '',
                      subjects: ['Mathématiques', 'Physique-Chimie'],
                      email: user.email || '',
                      phone: userProfile?.phone || '',
                      hourlySalary: 18,
                      status: 'actif'
                    }
                  }
                  students={students}
                  sessions={sessions}
                  courses={courses}
                  objectives={objectives}
                  themes={themes}
                  currentTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab)}
                  onUpdateSession={handleUpdateSession}
                  onUpdateStudent={handleUpdateStudent}
                  onAddAuditLog={addAuditLog}
                />
              )}
               {activeTab === 'receipts' && (
                <ReceiptsManagement
                  receipts={receipts}
                  students={students}
                  currency={currency}
                  onAddReceipt={handleAddReceipt}
                  onUpdateReceipt={handleUpdateReceipt}
                  onDeleteReceipt={handleDeleteReceipt}
                />
              )}
              {activeTab === 'courses' && <CourseManagement courses={courses} onAddCourse={handleAddCourse} onUpdateCourse={handleUpdateCourse} onDeleteCourse={handleDeleteCourse} />}
              {activeTab === 'students' && <StudentManagement students={students} onAddStudent={handleAddStudent} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} />}
              {activeTab === 'groups' && <GroupManagement groups={groups} students={students} onAddGroup={handleAddGroup} onUpdateGroup={handleUpdateGroup} onDeleteGroup={handleDeleteGroup} />}
              {activeTab === 'rooms' && <RoomManagement rooms={rooms} onAddRoom={handleAddRoom} onUpdateRoom={handleUpdateRoom} onDeleteRoom={handleDeleteRoom} />}
              {activeTab === 'themes' && <ThemeManagement themes={themes} objectives={objectives} onAddTheme={handleAddTheme} onUpdateTheme={handleUpdateTheme} onDeleteTheme={handleDeleteTheme} onAddObjective={handleAddObjective} onUpdateObjective={handleUpdateObjective} onDeleteObjective={handleDeleteObjective} />}
              {activeTab === 'teachers' && <TeacherManagement teachers={teachers} sessions={sessions} onAddTeacher={handleAddTeacher} onUpdateTeacher={handleUpdateTeacher} onDeleteTeacher={handleDeleteTeacher} />}
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'planning' && <PlanningManagement sessions={sessions} courses={courses} students={students} teachers={teachers} onAddSession={handleAddSession} onUpdateSession={handleUpdateSession} onDeleteSession={handleDeleteSession} />}
              {activeTab === 'audit' && <AuditLog logs={auditLogs} />}
              {activeTab === 'settings' && (
                <SettingsManagement 
                  currency={currency} 
                  setCurrency={setCurrency}
                  academicYear={academicYear}
                  academicYears={academicYears}
                  isClosed={isClosed}
                  yearReport={yearReport}
                  onSaveYearReport={handleSaveYearReport}
                  students={students}
                  teachers={teachers}
                  sessions={sessions}
                  receipts={receipts}
                  courses={courses}
                  onAcademicYearChange={handleAcademicYearChange}
                  onImportDemoData={handleImportDemoData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Notifications Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 pointer-events-auto cursor-pointer transition-all ${
                n.type === 'warning' 
                  ? 'bg-amber-950/95 border-amber-500/30 text-amber-200' 
                  : 'bg-slate-900/95 border-slate-800 text-slate-200'
              }`}
              onClick={() => {
                if (n.type === 'warning' && userRole === 'admin') {
                  setActiveWorkspace('admin');
                  setActiveTab('users');
                }
              }}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${n.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
                <Bell size={16} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold leading-relaxed">{n.message}</p>
                {n.type === 'warning' && userRole === 'admin' && (
                  <p className="text-[10px] text-amber-400 font-bold underline mt-1">Cliquer pour activer</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal: Ajouter une année scolaire */}
      <AnimatePresence>
        {showNewYearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowNewYearModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <CalendarDays className="text-sky-400 w-5 h-5" />
                <h3 className="text-lg font-bold text-white font-display">Nouvelle Année Scolaire</h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Format exemple : A.S-2026-2027</label>
                <input 
                  type="text" 
                  value={newYearInput} 
                  onChange={(e) => setNewYearInput(e.target.value)} 
                  placeholder="A.S-2026-2027" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowNewYearModal(false)} 
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleAddNewYear} 
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-sky-600/20"
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Transition / Initialisation de l'Année Académique */}
      <AnimatePresence>
        {showTransitionModal && pendingNewYear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => {
                setShowTransitionModal(false);
                setPendingNewYear(null);
              }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative z-10 space-y-5"
            >
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <Compass className="text-sky-400 w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Initialisation : {pendingNewYear}</h3>
                  <p className="text-xs text-slate-400">Aucune donnée n'a été trouvée pour cette année scolaire. Choisissez une méthode d'initialisation :</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Config Only */}
                <button 
                  onClick={() => applyNewYearInit('copy_config')} 
                  className="flex items-start text-left gap-4 p-4 rounded-xl border border-sky-500/20 bg-sky-950/20 hover:bg-sky-950/35 hover:border-sky-500/40 transition-all cursor-pointer group"
                >
                  <div className="p-2 bg-sky-500/15 text-sky-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Copier la Configuration Uniquement (Recommandé)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">
                      Conserve les matières, les enseignants, les groupes, les salles, les thèmes et objectifs pédagogiques. 
                      Remet à zéro la liste des élèves inscrits, les séances planifiées et les reçus financiers.
                    </span>
                  </div>
                </button>

                {/* Option 2: Clone Everything */}
                <button 
                  onClick={() => applyNewYearInit('copy_all')} 
                  className="flex items-start text-left gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/60 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Cloner l'Année Précédente (Copie Intégrale)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">
                      Duplique l'intégralité des données actuelles (cours, élèves, enseignants, planning, reçus) pour poursuivre l'activité sans interruption.
                    </span>
                  </div>
                </button>

                {/* Option 3: Start Fresh */}
                <button 
                  onClick={() => applyNewYearInit('start_fresh')} 
                  className="flex items-start text-left gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/60 hover:border-rose-500/30 transition-all cursor-pointer group"
                >
                  <div className="p-2 bg-rose-500/15 text-rose-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                    <X size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Démarrer à Blanc (Zéro Donnée)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">
                      Crée une nouvelle année scolaire complètement vierge. Tout devra être configuré à partir de zéro.
                    </span>
                  </div>
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowTransitionModal(false);
                    setPendingNewYear(null);
                  }} 
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
