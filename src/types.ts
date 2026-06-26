export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'guest';
export type Workspace = 'finance' | 'planning' | 'admin';

export interface Group {
  id: string;
  name: string;
  description: string;
  studentIds: string[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  features: string[]; // e.g., ["projecteur", "tableau blanc"]
}

export interface Theme {
  id: string;
  name: string;
  description: string;
}

export interface Objective {
  id: string;
  themeId: string;
  name: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string; // e.g. "Primaire", "Collège", "Lycée"
  hourlyRate: number; // rate paid by students per hour (e.g., 25 €)
  color: string; // Tailwind class color for visual badges and schedules
  themeIds?: string[]; // Linked themes
}

export interface StudentGrade {
  id: string;
  subject: string;
  title: string; // e.g. "Contrôle dérivées"
  score: number;
  maxScore: number;
  date: string;
}

export interface ProgressReport {
  id: string;
  date: string;
  sessionTitle: string;
  workDone: string;
  homework: string;
  behaviorRating: number; // 1 to 5
  comment: string;
  reportedToParents: boolean;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string; // e.g. "Terminale", "3ème", "CM2"
  email: string;
  phone: string;
  enrollmentDate: string; // YYYY-MM-DD
  status: 'actif' | 'suspendu';
  notes?: string;
  
  // Package and financial tracking
  packageType: 'groupe_mensuel' | 'individuel_seance' | 'forfait_10h' | 'forfait_20h' | 'forfait_30h' | 'abonnement_mensuel';
  totalHours: number;
  usedHours: number;
  paymentStatus: 'paye' | 'en_attente' | 'en_retard';
  balance: number; // Total amount due or paid
  
  // Pedagogical reports
  grades: StudentGrade[];
  progressReports: ProgressReport[];
  groupIds?: string[]; // Linked groups
  parentId?: string; // Optional parent link
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subjects: string[]; // e.g. ["Mathématiques", "Physique-Chimie"]
  email: string;
  phone: string;
  hourlySalary: number; // what the school pays the teacher per hour (e.g., 18 €)
  status: 'actif' | 'inactif';
}

export interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent_justifie' | 'absent_non_justifie';
  comment?: string;
}

export interface SessionSummary {
  workDone: string;
  homework: string;
  globalBehavior: 'excellent' | 'bon' | 'moyen' | 'difficile';
  reportedToParents: boolean;
  objectiveIds?: string[]; // Linked objectives
}

export interface ClassSession {
  id: string;
  courseId: string;
  teacherId: string;
  studentIds: string[]; // students attending this session
  groupId?: string; // Optional group link
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "14:00"
  endTime: string; // e.g. "16:00"
  roomId?: string; // e.g. "room_1"
  room: string; // e.g. "Salle 101"
  status: 'planifié' | 'terminé' | 'annulé';
  themeIds?: string[];
  objectiveIds?: string[];
  
  // Attendance and summary for pedagogical follow-up
  attendance?: AttendanceRecord[];
  summary?: SessionSummary;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue: number;
  revenueChangePercent: number;
  popularCourses: { name: string; count: number; revenue: number; color: string }[];
  weeklyRevenue: { day: string; value: number }[];
  studentGradesDist: { name: string; count: number }[];
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'course' | 'student' | 'teacher' | 'session' | 'group' | 'room' | 'theme' | 'objective' | 'other';
  entityId: string;
  description: string;
  timestamp: string; // ISO string
  status?: 'envoyé' | 'en_attente';
}

export interface Receipt {
  id: string;
  studentId?: string;
  studentName: string;
  gradeLevel: string; // e.g., "5ème", "7ème", "8ème", "9ème", etc.
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: 'espèces' | 'virement' | 'chèque' | 'carte' | 'autre';
  status: 'payé' | 'en_attente' | 'partiel';
  category: string; // e.g., "Mensualité Juin", "Forfait", etc.
  notes?: string;
}

