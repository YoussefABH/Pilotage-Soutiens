import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Lock, 
  Unlock, 
  FileText, 
  Sparkles, 
  Printer, 
  CalendarDays, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Coins,
  ChevronRight,
  Database,
  Play
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsManagementProps {
  currency: string;
  setCurrency: (currency: string) => void;
  academicYear: string;
  academicYears: string[];
  isClosed: boolean;
  yearReport: string;
  onSaveYearReport: (closed: boolean, report: string) => Promise<void>;
  students: any[];
  teachers: any[];
  sessions: any[];
  receipts: any[];
  courses: any[];
  onAcademicYearChange: (year: string) => Promise<void>;
  onImportDemoData?: (demoData: any) => Promise<void>;
}

interface StructuredReport {
  moralReport: string;
  pedagogicalReport: string;
  futurePerspectives: string;
  closedAt?: string;
  closedBy?: string;
}

export default function SettingsManagement({
  currency,
  setCurrency,
  academicYear,
  academicYears,
  isClosed,
  yearReport,
  onSaveYearReport,
  students,
  teachers,
  sessions,
  receipts,
  courses,
  onAcademicYearChange,
  onImportDemoData
}: SettingsManagementProps) {
  // Parse the structured report state
  const [structuredReport, setStructuredReport] = useState<StructuredReport>(() => {
    try {
      if (yearReport) {
        return JSON.parse(yearReport);
      }
    } catch (e) {
      // fallback if it was saved as flat string
    }
    return {
      moralReport: '',
      pedagogicalReport: '',
      futurePerspectives: ''
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'report'>('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmActionType, setConfirmActionType] = useState<'close' | 'reopen' | null>(null);

  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const handleGenerateDemoData = async () => {
    if (!onImportDemoData) {
      alert("La fonction d'importation des données de démonstration n'est pas disponible.");
      return;
    }
    setIsGeneratingDemo(true);
    setDemoSuccess(false);

    try {
      // 1. Courses
      const demoCourses = [
        { id: 'c1', title: 'Mathématiques - Prépa Bac', description: 'Cours intensif de préparation à l’épreuve de spécialité mathématiques du Baccalauréat.', subject: 'Mathématiques', level: 'Lycée', hourlyRate: 35, color: '#06b6d4' },
        { id: 'c2', title: 'Physique-Chimie - Renforcement', description: 'Soutien hebdomadaire pour consolider les bases en physique et en chimie, exercices pratiques.', subject: 'Physique-Chimie', level: 'Lycée', hourlyRate: 30, color: '#3b82f6' },
        { id: 'c3', title: 'Français - Objectif Brevet', description: 'Préparation approfondie de l’épreuve de français du Brevet des collèges : grammaire, rédaction.', subject: 'Français', level: 'Collège', hourlyRate: 25, color: '#eab308' },
        { id: 'c4', title: 'Anglais - Expression Orale', description: 'Développement de l’aisance à l’oral et maîtrise de la grammaire pour tous niveaux scolaires.', subject: 'Anglais', level: 'Tous Niveaux', hourlyRate: 28, color: '#8b5cf6' },
        { id: 'c5', title: 'Sciences de la Vie & Terre', description: 'Comprendre la géologie et la biologie du programme officiel avec des fiches de synthèse.', subject: 'SVT', level: 'Lycée', hourlyRate: 32, color: '#ec4899' },
        { id: 'c6', title: 'Aide aux devoirs primaire', description: 'Accompagnement quotidien des élèves de primaire pour l’apprentissage de la lecture et du calcul.', subject: 'Général', level: 'Primaire', hourlyRate: 20, color: '#10b981' }
      ];

      // 2. Teachers
      const demoTeachers = [
        { id: 't1', firstName: 'Jean-Marc', lastName: 'Lefebvre', subjects: ['Mathématiques', 'SVT'], email: 'jm.lefebvre@soutienscolaire.fr', phone: '06 11 22 33 44', hourlySalary: 25, status: 'actif' },
        { id: 't2', firstName: 'Sophie', lastName: 'Rousseau', subjects: ['Physique-Chimie', 'Mathématiques'], email: 'sophie.rousseau@gmail.com', phone: '06 22 33 44 55', hourlySalary: 23, status: 'actif' },
        { id: 't3', firstName: 'Michel', lastName: 'Guerin', subjects: ['Français'], email: 'm.guerin@ac-paris.fr', phone: '06 33 44 55 66', hourlySalary: 20, status: 'actif' },
        { id: 't4', firstName: 'Amandine', lastName: 'Duval', subjects: ['Anglais'], email: 'amandine.duval@gmail.com', phone: '06 44 55 66 77', hourlySalary: 20, status: 'actif' },
        { id: 't5', firstName: 'Pierre', lastName: 'Gauthier', subjects: ['Général'], email: 'p.gauthier@gmail.com', phone: '06 55 66 77 88', hourlySalary: 18, status: 'actif' }
      ];

      // 3. Rooms
      const demoRooms = [
        { id: 'r1', name: 'Salle 101', capacity: 10, features: ['projecteur'] },
        { id: 'r2', name: 'Salle 102', capacity: 8, features: ['tableau blanc'] },
        { id: 'r3', name: 'Salle d’Anglais', capacity: 6, features: ['tableau blanc', 'audio'] },
        { id: 'r4', name: 'Salle Primaire', capacity: 12, features: ['tableau blanc', 'jeux'] },
        { id: 'r5', name: 'Salle 104', capacity: 6, features: ['projecteur'] }
      ];

      // 4. Themes & Objectives
      const demoThemes = [
        { id: 'th1', name: 'Maths - Analyse', description: 'Étude des fonctions, dérivées, intégrales' },
        { id: 'th2', name: 'Français - Rédaction', description: 'Structuration des idées, orthographe, style' },
        { id: 'th3', name: 'Anglais - Oral', description: 'Pratique de la conversation, vocabulaire courant' },
        { id: 'th4', name: 'Physique - Cinématique', description: 'Mouvements, forces et trajectoires' }
      ];

      const demoObjectives = [
        { id: 'ob1', themeId: 'th1', name: 'Calcul de dérivées', description: 'Maîtriser les formules de dérivation' },
        { id: 'ob2', themeId: 'th1', name: 'Étude de fonctions', description: 'Rechercher les extremas, variations' },
        { id: 'ob3', themeId: 'th2', name: 'Structure de texte', description: 'Organiser un texte argumentatif' },
        { id: 'ob4', themeId: 'th3', name: 'Aisance orale', description: 'Savoir s’exprimer sans notes' },
        { id: 'ob5', themeId: 'th4', name: 'Équations horaires', description: 'Résoudre les équations de trajectoire' }
      ];

      // 5. Students
      const demoStudents = [
        {
          id: 's1', firstName: 'Thomas', lastName: 'Dubois', gradeLevel: 'Terminale', email: 'thomas.dubois@gmail.com', phone: '06 12 34 56 78', enrollmentDate: '2025-09-05', status: 'actif',
          packageType: 'groupe_mensuel', totalHours: 16, usedHours: 12, paymentStatus: 'paye', balance: 120, notes: 'Très motivé, vise mention bien.', grades: [
            { id: 'g1', subject: 'Mathématiques', title: 'DS n°1 - Dérivées', score: 14.5, maxScore: 20, date: '2025-10-12' },
            { id: 'g2', subject: 'Mathématiques', title: 'DS n°2 - Limites', score: 16.5, maxScore: 20, date: '2025-12-05' },
            { id: 'g3', subject: 'Mathématiques', title: 'DS n°3 - Intégrales', score: 15.0, maxScore: 20, date: '2026-03-10' }
          ], progressReports: []
        },
        {
          id: 's2', firstName: 'Léa', lastName: 'Martin', gradeLevel: 'Terminale', email: 'lea.martin@outlook.fr', phone: '06 23 45 67 89', enrollmentDate: '2025-09-10', status: 'actif',
          packageType: 'forfait_20h', totalHours: 20, usedHours: 18, paymentStatus: 'paye', balance: 450, notes: 'Prépare le concours d’entrée post-bac.', grades: [
            { id: 'g4', subject: 'Physique-Chimie', title: 'DS n°1 - Énergies', score: 13.0, maxScore: 20, date: '2025-11-15' },
            { id: 'g5', subject: 'Mathématiques', title: 'Interrogation - Complexes', score: 15.5, maxScore: 20, date: '2026-02-12' }
          ], progressReports: []
        },
        {
          id: 's3', firstName: 'Lucas', lastName: 'Bernard', gradeLevel: '3ème', email: 'lucas.bernard@gmail.com', phone: '07 34 56 78 90', enrollmentDate: '2025-10-01', status: 'actif',
          packageType: 'individuel_seance', totalHours: 10, usedHours: 8, paymentStatus: 'paye', balance: 250, notes: 'Difficultés de méthodologie.', grades: [
            { id: 'g6', subject: 'Français', title: 'Dictée Brevet', score: 9.5, maxScore: 20, date: '2025-11-20' },
            { id: 'g7', subject: 'Français', title: 'Rédaction argumentée', score: 12.0, maxScore: 20, date: '2026-04-12' }
          ], progressReports: []
        },
        {
          id: 's4', firstName: 'Chloé', lastName: 'Petit', gradeLevel: '1ère', email: 'chloe.petit@wanadoo.fr', phone: '06 45 67 89 01', enrollmentDate: '2025-09-12', status: 'actif',
          packageType: 'groupe_mensuel', totalHours: 16, usedHours: 14, paymentStatus: 'paye', balance: 120, notes: 'Travaille sérieusement.', grades: [], progressReports: []
        },
        {
          id: 's5', firstName: 'Hugo', lastName: 'Robert', gradeLevel: 'CM2', email: 'hugo.robert@laposte.net', phone: '06 56 78 90 12', enrollmentDate: '2025-10-15', status: 'actif',
          packageType: 'individuel_seance', totalHours: 12, usedHours: 10, paymentStatus: 'paye', balance: 300, notes: 'Besoin de canaliser son attention.', grades: [
            { id: 'g8', subject: 'Général', title: 'Calcul mental', score: 16.0, maxScore: 20, date: '2025-12-10' }
          ], progressReports: []
        },
        {
          id: 's6', firstName: 'Inès', lastName: 'Richard', gradeLevel: '3ème', email: 'ines.richard@gmail.com', phone: '07 67 89 01 23', enrollmentDate: '2025-09-08', status: 'actif',
          packageType: 'abonnement_mensuel', totalHours: 16, usedHours: 16, paymentStatus: 'paye', balance: 150, notes: 'Progrès constants en Anglais et Français.', grades: [], progressReports: []
        },
        {
          id: 's7', firstName: 'Nathan', lastName: 'Durand', gradeLevel: '1ère', email: 'nathan.durand@outlook.com', phone: '06 78 90 12 34', enrollmentDate: '2025-09-15', status: 'actif',
          packageType: 'groupe_mensuel', totalHours: 16, usedHours: 15, paymentStatus: 'paye', balance: 120, notes: 'Prend des cours de soutien de groupe.', grades: [], progressReports: []
        },
        {
          id: 's8', firstName: 'Sarah', lastName: 'Moreau', gradeLevel: 'Terminale', email: 'sarah.moreau@gmail.com', phone: '06 89 01 23 45', enrollmentDate: '2025-09-20', status: 'actif',
          packageType: 'forfait_30h', totalHours: 30, usedHours: 26, paymentStatus: 'paye', balance: 600, notes: 'Élève brillante, perfectionne ses rédactions de Bac.', grades: [
            { id: 'g9', subject: 'Mathématiques', title: 'DS Probabilités', score: 18.0, maxScore: 20, date: '2026-02-14' }
          ], progressReports: []
        },
        {
          id: 's9', firstName: 'Antoine', lastName: 'Dupont', gradeLevel: 'Seconde', email: 'antoine.dupont@gmail.com', phone: '06 12 23 34 45', enrollmentDate: '2025-11-05', status: 'actif',
          packageType: 'forfait_10h', totalHours: 10, usedHours: 8, paymentStatus: 'paye', balance: 250, notes: 'Soutien en Physique-Chimie.', grades: [], progressReports: []
        },
        {
          id: 's10', firstName: 'Manon', lastName: 'Leroy', gradeLevel: '6ème', email: 'manon.leroy@outlook.fr', phone: '06 55 44 33 22', enrollmentDate: '2025-10-10', status: 'actif',
          packageType: 'abonnement_mensuel', totalHours: 12, usedHours: 12, paymentStatus: 'paye', balance: 150, notes: 'Transition Collège réussie.', grades: [], progressReports: []
        },
        {
          id: 's11', firstName: 'Maxime', lastName: 'Morel', gradeLevel: '4ème', email: 'maxime.morel@gmail.com', phone: '07 88 77 66 55', enrollmentDate: '2025-09-25', status: 'actif',
          packageType: 'individuel_seance', totalHours: 8, usedHours: 8, paymentStatus: 'paye', balance: 200, notes: 'Orthographe à travailler.', grades: [], progressReports: []
        },
        {
          id: 's12', firstName: 'Camille', lastName: 'Bonnet', gradeLevel: 'Lycée', email: 'camille.bonnet@wanadoo.fr', phone: '06 99 88 77 66', enrollmentDate: '2025-10-12', status: 'actif',
          packageType: 'forfait_20h', totalHours: 20, usedHours: 18, paymentStatus: 'en_attente', balance: 450, notes: 'Manque de confiance en elle.', grades: [], progressReports: []
        }
      ];

      // 6. Groups
      const demoGroups = [
        { id: 'g1', name: 'Groupe Terminale Math', description: 'Préparation intensive Bac Mathématiques', studentIds: ['s1', 's2', 's8'] },
        { id: 'g2', name: 'Groupe Physique 1ère', description: 'Renforcement Physique-Chimie', studentIds: ['s4', 's7'] }
      ];

      // 7. Dynamic Sessions & Receipts Generation covering past 10 months (Sep 2025 - June 2026)
      const demoSessions: any[] = [];
      const demoReceipts: any[] = [];
      
      const academicMonths = [
        "2025-09", "2025-10", "2025-11", "2025-12",
        "2026-01", "2026-02", "2026-03", "2026-04",
        "2026-05", "2026-06"
      ];

      let sessIdCounter = 1;
      let recIdCounter = 1;

      // For each month, let's generate realistic sessions and financial receipts
      academicMonths.forEach((month, mIdx) => {
        // Generate receipts (payments)
        const monthlyStudents = demoStudents.filter(s => s.packageType === 'groupe_mensuel' || s.packageType === 'abonnement_mensuel');
        monthlyStudents.forEach(student => {
          const isAbonnement = student.packageType === 'abonnement_mensuel';
          demoReceipts.push({
            id: `rec_${recIdCounter++}`,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            gradeLevel: student.gradeLevel,
            amount: isAbonnement ? 150 : 120,
            paymentDate: `${month}-05`,
            paymentMethod: mIdx % 3 === 0 ? 'espèces' : mIdx % 3 === 1 ? 'virement' : 'carte',
            status: 'payé',
            category: isAbonnement ? 'Abonnement Mensuel' : 'Forfait Groupe Mensuel',
            notes: `Paiement automatisé - Mois de ${month}`
          });
        });

        // Let's also generate package/forfait purchase receipts on enrollment month
        demoStudents.forEach(student => {
          if (student.packageType.startsWith('forfait_') || student.packageType === 'individuel_seance') {
            const enrollMonth = student.enrollmentDate.substring(0, 7);
            if (enrollMonth === month) {
              let amount = 250;
              let label = 'Forfait Horaire';
              if (student.packageType === 'forfait_10h') { amount = 250; label = 'Forfait 10h'; }
              else if (student.packageType === 'forfait_20h') { amount = 450; label = 'Forfait 20h'; }
              else if (student.packageType === 'forfait_30h') { amount = 600; label = 'Forfait 30h'; }
              else if (student.packageType === 'individuel_seance') { amount = 300; label = 'Forfait 10 séances'; }
              
              demoReceipts.push({
                id: `rec_${recIdCounter++}`,
                studentId: student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                gradeLevel: student.gradeLevel,
                amount,
                paymentDate: student.enrollmentDate,
                paymentMethod: 'virement',
                status: 'payé',
                category: label,
                notes: `Achat de forfait à l'inscription`
              });
            }
          }
        });

        // Generate 10 sessions per month
        for (let sIdx = 1; sIdx <= 10; sIdx++) {
          const dayNum = 3 + sIdx * 2.5;
          const dayFormatted = String(Math.floor(dayNum)).padStart(2, '0');
          const dateStr = `${month}-${dayFormatted}`;
          
          const isFuture = dateStr >= "2026-06-23";
          
          const courseIdx = (sIdx + mIdx) % 6;
          const course = demoCourses[courseIdx];
          
          let teacherId = 't5';
          if (course.id === 'c1' || course.id === 'c5') teacherId = 't1';
          else if (course.id === 'c2') teacherId = 't2';
          else if (course.id === 'c3') teacherId = 't3';
          else if (course.id === 'c4') teacherId = 't4';

          let sessionStudentIds: string[] = [];
          if (course.level === 'Lycée') {
            sessionStudentIds = ['s1', 's2', 's4', 's7', 's8'].slice(sIdx % 3, (sIdx % 3) + 3);
          } else if (course.level === 'Collège') {
            sessionStudentIds = ['s3', 's6', 's10', 's11'].slice(sIdx % 2, (sIdx % 2) + 2);
          } else {
            sessionStudentIds = ['s5', 's10', 's11'].slice(sIdx % 2, (sIdx % 2) + 2);
          }

          if (sessionStudentIds.length === 0) sessionStudentIds = ['s1'];

          const startTimes = ["10:00", "14:00", "16:30", "18:00"];
          const endTimes = ["12:00", "16:00", "18:00", "19:30"];
          const timeSlot = sIdx % 4;

          const session: any = {
            id: `sess_auto_${sessIdCounter++}`,
            courseId: course.id,
            teacherId,
            studentIds: sessionStudentIds,
            date: dateStr,
            startTime: startTimes[timeSlot],
            endTime: endTimes[timeSlot],
            room: demoRooms[sIdx % 5].name,
            roomId: demoRooms[sIdx % 5].id,
            status: isFuture ? 'planifié' : 'terminé'
          };

          if (!isFuture) {
            session.attendance = sessionStudentIds.map((stId, sStIdx) => ({
              studentId: stId,
              status: sStIdx === 2 && sIdx % 5 === 0 ? 'absent_justifie' : 'present',
              comment: sStIdx === 2 && sIdx % 5 === 0 ? 'Indisposé' : undefined
            }));

            session.summary = {
              workDone: `Séance thématique sur le chapitre de ${course.subject}. Travail d'exercices d'approfondissement théorique et pratique.`,
              homework: `Faire les exercices d'application directe n°${sIdx + 1} et réviser la synthèse de cours.`,
              globalBehavior: sIdx % 6 === 0 ? 'bon' : sIdx % 8 === 0 ? 'moyen' : 'excellent',
              reportedToParents: true
            };

            if (sIdx % 4 === 0) {
              const studentToReport = demoStudents.find(s => s.id === sessionStudentIds[0]);
              if (studentToReport) {
                studentToReport.progressReports.push({
                  id: `pr_${month}_${sIdx}`,
                  date: dateStr,
                  sessionTitle: `Suivi hebdomadaire - ${course.subject}`,
                  workDone: `Résolution autonome d'exercices sur le programme d'enseignement.`,
                  homework: `Terminer le sujet de préparation d'examen.`,
                  behaviorRating: sIdx % 6 === 0 ? 4 : 5,
                  comment: `Élève très attentif et impliqué. De réels progrès sont visibles par rapport aux premières séances.`,
                  reportedToParents: true
                });
              }
            }
          }

          demoSessions.push(session);
        }
      });

      await onImportDemoData({
        courses: demoCourses,
        teachers: demoTeachers,
        rooms: demoRooms,
        themes: demoThemes,
        objectives: demoObjectives,
        students: demoStudents,
        groups: demoGroups,
        sessions: demoSessions,
        receipts: demoReceipts
      });

      setDemoSuccess(true);
      setTimeout(() => setDemoSuccess(false), 6000);
    } catch (e) {
      console.error(e);
      alert("Une erreur s'est produite lors de la génération des données.");
    } finally {
      setIsGeneratingDemo(false);
    }
  };


  // Sync state if yearReport updates externally
  useEffect(() => {
    try {
      if (yearReport) {
        setStructuredReport(JSON.parse(yearReport));
      } else {
        setStructuredReport({
          moralReport: '',
          pedagogicalReport: '',
          futurePerspectives: ''
        });
      }
    } catch (e) {
      setStructuredReport({
        moralReport: yearReport || '',
        pedagogicalReport: '',
        futurePerspectives: ''
      });
    }
  }, [yearReport, academicYear]);

  // Compute stats of the active year
  const totalEnrolled = students.length;
  const activeStudents = students.filter(s => s.status === 'actif').length;
  const totalHoursTaught = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalSessions = sessions.length;
  const activeTeachers = teachers.filter(t => t.status === 'actif').length;
  const totalRevenue = receipts.reduce((acc, r) => acc + (r.amount || 0), 0);
  const currencySymbol = currency || 'MAD';

  // Group revenue by payment package type
  const monthlyCount = students.filter(s => s.packageType === 'groupe_mensuel' || s.packageType === 'abonnement_mensuel').length;
  const sessionCount = students.filter(s => s.packageType === 'individuel_seance' || s.packageType?.startsWith('forfait')).length;

  const handleTextChange = (field: keyof StructuredReport, value: string) => {
    setStructuredReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAutoGenerateReport = () => {
    const formattedDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const autoMoral = `L'année scolaire ${academicYear} s'est clôturée avec succès. Nous avons accueilli un total de ${totalEnrolled} élèves (${activeStudents} actifs au moment de la clôture). L'organisation générale a permis une excellente coordination entre l'équipe administrative et pédagogique. Le volume global d'activité a généré un chiffre d'affaires cumulé de ${totalRevenue.toLocaleString('fr-FR')} ${currencySymbol}.`;

    const autoPedagogical = `Sur le plan pédagogique, ${totalSessions} séances individuelles et de groupe ont été dispensées, représentant un total de ${totalHoursTaught} heures d'apprentissage effectif. Notre équipe composée de ${activeTeachers} enseignants actifs a assuré un encadrement rigoureux. Les matières principales ont été suivies avec assiduité et de réels progrès ont été constatés chez la majorité des élèves de forfait horaire ou mensuel.`;

    const autoPerspectives = `Pour la prochaine rentrée scolaire, nous recommandons de :\n1. Renforcer l'accompagnement personnalisé pour les élèves en forfait individuel.\n2. Élargir l'offre d'abonnements de groupe pour optimiser l'occupation des salles de cours.\n3. Intégrer de nouveaux outils de suivi de compétences pour faciliter l'échange d'informations avec les parents.`;

    setStructuredReport({
      moralReport: autoMoral,
      pedagogicalReport: autoPedagogical,
      futurePerspectives: autoPerspectives,
      closedAt: new Date().toISOString()
    });
  };

  const saveReport = async (newClosedStatus: boolean) => {
    setIsSaving(true);
    try {
      const updatedReport = {
        ...structuredReport,
        closedAt: newClosedStatus ? new Date().toISOString() : undefined,
        closedBy: 'Administration'
      };
      await onSaveYearReport(newClosedStatus, JSON.stringify(updatedReport));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
    }
  };

  const handlePrint = () => {
    // Generate a beautiful, isolated printable report in a new frame or window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres contextuelles pour pouvoir imprimer le bilan.");
      return;
    }

    const formattedDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Bilan Annuel Final - ${academicYear}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              background: #ffffff;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 800;
              color: #0284c7;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header-meta {
              text-align: right;
              font-size: 12px;
              color: #64748b;
            }
            .status-badge {
              display: inline-block;
              background: #fef3c7;
              color: #d97706;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              margin-top: 5px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .card {
              background: #f8fafc;
              border: 1px solid #f1f5f9;
              padding: 16px;
              border-radius: 12px;
              text-align: center;
            }
            .card-title {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .card-value {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h2 {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
              border-left: 4px solid #0284c7;
              padding-left: 10px;
              margin-bottom: 15px;
              text-transform: uppercase;
            }
            .section p {
              font-size: 14px;
              color: #334155;
              white-space: pre-wrap;
              background: #fafafa;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #f1f5f9;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              font-size: 11px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Bilan Annuel d'Activité</h1>
              <div class="status-badge">Année Scolaire Clôturée • ${academicYear}</div>
            </div>
            <div class="header-meta">
              <div>Édité le : ${formattedDate}</div>
              <div>Générateur : Pilotage Soutien</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Élèves inscrits</div>
              <div class="card-value">${totalEnrolled}</div>
            </div>
            <div class="card">
              <div class="card-title">Heures de cours</div>
              <div class="card-value">${totalHoursTaught} h</div>
            </div>
            <div class="card">
              <div class="card-title">Professeurs Actifs</div>
              <div class="card-value">${activeTeachers}</div>
            </div>
            <div class="card">
              <div class="card-title">Recettes Financières</div>
              <div class="card-value">${totalRevenue.toLocaleString('fr-FR')} ${currencySymbol}</div>
            </div>
          </div>

          <div class="section">
            <h2>1. Synthèse Générale & Rapport Moral</h2>
            <p>${structuredReport.moralReport || 'Aucun commentaire renseigné.'}</p>
          </div>

          <div class="section">
            <h2>2. Analyse de l\'Activité Pédagogique</h2>
            <p>${structuredReport.pedagogicalReport || 'Aucun commentaire renseigné.'}</p>
          </div>

          <div class="section">
            <h2>3. Perspectives d\'Avenir & Recommandations</h2>
            <p>${structuredReport.futurePerspectives || 'Aucun commentaire renseigné.'}</p>
          </div>

          <div class="footer">
            <div>Document officiel - Clôture de l'exercice académique ${academicYear}</div>
            <div>Signé par la direction pédagogique</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 font-display">
            <Settings className="text-sky-400 w-7 h-7" /> Paramètres du Système
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configuration de la plateforme, gestion des exercices scolaires et bilans annuels d'activité.</p>
        </div>

        <div className="flex items-center gap-2 p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'settings' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Général & Devises
          </button>
          <button 
            onClick={() => setActiveSubTab('report')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'report' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Clôture & Bilan Annuel
          </button>
        </div>
      </div>

      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* CURRENCY PANEL */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <Coins className="text-sky-400 w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Configuration Monétaire</h3>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Symbole de la Devise (par défaut : MAD)</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="Ex. MAD, EUR, USD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">Le symbole saisi sera automatiquement répercuté sur l'intégralité du pilotage financier, des reçus d'inscription et des tableaux de bord administratifs.</p>
              </div>
            </div>

            {/* ACTIVE YEAR RECAP SIDE CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <CalendarDays className="text-sky-400 w-5 h-5" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Exercice en cours</h3>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-semibold">Année Scolaire Active</span>
                  <span className="text-2xl font-black text-sky-400 block font-mono">{academicYear}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {isClosed ? (
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                      <Lock size={11} /> Clôturée (Lecture seule)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                      <Unlock size={11} /> Active & Modifiable
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setActiveSubTab('report')}
                className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700/50"
              >
                Gérer la clôture <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Database className="text-emerald-400 w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Base de Données & Outil de Démo</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Générez instantanément un ensemble complet de données réalistes et cohérentes réparties sur les 10 derniers mois. 
                  Cet outil va écraser les données de l'année scolaire en cours pour y injecter :
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-2">
                  <li>6 cours thématiques complets avec leurs couleurs distinctes.</li>
                  <li>5 profils d'enseignants qualifiés avec leurs tarifs horaires et matières associées.</li>
                  <li>12 fiches d'élèves détaillées (niveaux Primaire, Collège, Lycée) avec suivi de forfaits.</li>
                  <li>Plus de 100 séances de cours réelles (séances passées "terminées" avec présence/absences et comptes rendus pédagogiques complets, séances futures "planifiées").</li>
                  <li>Plus de 40 reçus financiers répartis de manière fluide (abonnements mensuels, achats de forfaits d'inscription).</li>
                </ul>
                <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  ⚠️ Attention : Cette action remplace l'ensemble des données de l'exercice actuel ({academicYear}) par les données simulées.
                </p>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  <Play size={20} className={isGeneratingDemo ? "animate-spin" : ""} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Générateur Automatique</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Données cohérentes à 100%</p>
                </div>
                
                <button
                  onClick={handleGenerateDemoData}
                  disabled={isGeneratingDemo}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    isGeneratingDemo
                      ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-700 text-white shadow-lg shadow-emerald-950/40'
                  }`}
                >
                  {isGeneratingDemo ? (
                    <>Génération en cours...</>
                  ) : (
                    <>Générer la base démo</>
                  )}
                </button>

                {demoSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-emerald-400 font-bold"
                  >
                    ✓ Données générées avec succès !
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeSubTab === 'report' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* YEAR CLOTURE CONTROL CENTER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-sky-400 w-6 h-6" />
                  <h3 className="text-lg font-bold text-white font-display">Clôture de l'exercice : <span className="font-mono text-sky-400">{academicYear}</span></h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  La clôture d'une année scolaire archive définitivement les cours, plannings, émargements et reçus.
                  Cette action verrouille l'année en <strong className="text-slate-300">lecture seule</strong> pour assurer l'intégrité historique des audits scolaires et financiers, tout en libérant la configuration pour l'exercice suivant.
                </p>

                {isClosed && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-center gap-2 max-w-xl">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                    <span>Cette année scolaire est archivée. Aucune inscription, séance ou recette financière ne peut être ajoutée ou modifiée.</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                {isClosed ? (
                  <button
                    onClick={() => {
                      setConfirmActionType('reopen');
                      setShowConfirmModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg"
                  >
                    <Unlock size={14} className="text-emerald-400" /> Réouvrir l'Année Scolaire
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmActionType('close');
                      setShowConfirmModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-rose-600/10"
                  >
                    <Lock size={14} /> Clôturer et Verrouiller l'Année
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* KEY PERFORMANCE INDICATORS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users size={12} className="text-sky-400" /> Inscriptions Élèves
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {totalEnrolled} <span className="text-xs text-slate-500 font-bold">({activeStudents} actifs)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {monthlyCount} mensuels • {sessionCount} séance/horaires
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BookOpen size={12} className="text-emerald-400" /> Activité Pédagogique
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {totalHoursTaught} <span className="text-xs text-slate-500 font-bold">heures</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Réparties sur {totalSessions} séances de cours
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <GraduationCap size={12} className="text-purple-400" /> Corps Enseignant
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {activeTeachers} <span className="text-xs text-slate-500 font-bold">professeurs</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Intervenants actifs cette année
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Coins size={12} className="text-amber-400" /> Bilan Financier
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {totalRevenue.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-400">{currencySymbol}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Recettes globales cumulées et validées
              </div>
            </div>
          </div>

          {/* BILAN / REPORT COMPILER AND WRITER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <FileText className="text-sky-400 w-5 h-5" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display">Bilan Complet de Fin d'Année</h4>
                  <p className="text-[10px] text-slate-500">Rédigez la synthèse académique de l'exercice clôturé.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoGenerateReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-sky-500/20"
                >
                  <Sparkles size={13} /> Remplir avec les stats
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
                >
                  <Printer size={13} /> Imprimer / PDF
                </button>
              </div>
            </div>

            {/* TEXT AREAS */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wide">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span> 1. Synthèse Générale & Rapport Moral
                </label>
                <textarea
                  value={structuredReport.moralReport}
                  onChange={(e) => handleTextChange('moralReport', e.target.value)}
                  placeholder="Saisissez un résumé d'activité général (Inscriptions, climat d'enseignement, retours des familles, faits marquants de l'année)..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wide">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> 2. Bilan Pédagogique (Volume d'activité & Progrès)
                </label>
                <textarea
                  value={structuredReport.pedagogicalReport}
                  onChange={(e) => handleTextChange('pedagogicalReport', e.target.value)}
                  placeholder="Saisissez les conclusions pédagogiques (Heures dispensées, évolution globale des élèves, implication des professeurs, compétences clés développées)..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono tracking-wide">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> 3. Perspectives d'Avenir & Recommandations
                </label>
                <textarea
                  value={structuredReport.futurePerspectives}
                  onChange={(e) => handleTextChange('futurePerspectives', e.target.value)}
                  placeholder="Saisissez les recommandations ou plans d'actions pour la rentrée ou l'année suivante (Ajustements de forfaits, développement d'outils, restructurations)..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => saveReport(isClosed)}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/10"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="animate-spin w-3.5 h-3.5" /> Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} /> Sauvegarder le Bilan
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative z-10 space-y-4">
            <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
              <div className={`p-2 rounded-lg shrink-0 ${confirmActionType === 'close' ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white font-display">
                  {confirmActionType === 'close' 
                    ? "Clôturer définitivement l'exercice académique ?" 
                    : "Réouvrir l'exercice académique ?"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Année Scolaire : <strong className="font-mono text-sky-400">{academicYear}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmActionType === 'close' 
                ? "En fermant l'année scolaire, toutes les écritures financières, plannings et fiches d'élèves correspondantes seront scellées en lecture seule. Vous pourrez toujours consulter et imprimer ce bilan complet à tout moment." 
                : "La réouverture permettra à nouveau d'apporter des modifications à cette année scolaire (inscriptions d'élèves, recettes financières, planification des séances)."}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={() => saveReport(confirmActionType === 'close')}
                disabled={isSaving}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${confirmActionType === 'close' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10'}`}
              >
                {isSaving ? "Traitement..." : confirmActionType === 'close' ? "Oui, Clôturer" : "Oui, Réouvrir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
