import { Course, Student, Teacher, ClassSession, Group, Room, Theme, Objective } from '../types';

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Groupe Terminale Math',
    description: 'Préparation intensive Bac Mathématiques',
    studentIds: ['s1', 's2', 's8']
  },
  {
    id: 'g2',
    name: 'Groupe Physique 1ère',
    description: 'Renforcement Physique-Chimie',
    studentIds: ['s4', 's7']
  }
];

export const INITIAL_ROOMS: Room[] = [
  { id: 'r1', name: 'Salle 101', capacity: 10, features: ['projecteur'] },
  { id: 'r2', name: 'Salle 102', capacity: 8, features: ['tableau blanc'] }
];

export const INITIAL_THEMES: Theme[] = [
  { id: 'th1', name: 'Maths - Analyse', description: 'Étude des fonctions, dérivées, intégrales' },
  { id: 'th2', name: 'Français - Rédaction', description: 'Structuration des idées, orthographe, style' }
];

export const INITIAL_OBJECTIVES: Objective[] = [
  { id: 'ob1', themeId: 'th1', name: 'Calcul de dérivées', description: 'Maîtriser les formules de dérivation' },
  { id: 'ob2', themeId: 'th1', name: 'Étude de fonctions', description: 'Rechercher les extremas, variations' },
  { id: 'ob3', themeId: 'th2', name: 'Structure de texte', description: 'Organiser un texte argumentatif' }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Mathématiques - Prépa Bac',
    description: 'Cours intensif de préparation à l’épreuve de spécialité mathématiques du Baccalauréat.',
    subject: 'Mathématiques',
    level: 'Lycée',
    hourlyRate: 35,
    color: '#06b6d4', // Neon Cyan
  },
  {
    id: 'c2',
    title: 'Physique-Chimie - Renforcement',
    description: 'Soutien hebdomadaire pour consolider les bases en physique et en chimie, exercices pratiques.',
    subject: 'Physique-Chimie',
    level: 'Lycée',
    hourlyRate: 30,
    color: '#3b82f6', // Neon Blue
  },
  {
    id: 'c3',
    title: 'Français - Objectif Brevet',
    description: 'Préparation approfondie de l’épreuve de français du Brevet des collèges : grammaire, rédaction.',
    subject: 'Français',
    level: 'Collège',
    hourlyRate: 25,
    color: '#eab308', // Yellow/Amber
  },
  {
    id: 'c4',
    title: 'Anglais - Expression Orale',
    description: 'Développement de l’aisance à l’oral et maîtrise de la grammaire pour tous niveaux scolaires.',
    subject: 'Anglais',
    level: 'Tous Niveaux',
    hourlyRate: 28,
    color: '#8b5cf6', // Violet
  },
  {
    id: 'c5',
    title: 'Sciences de la Vie & Terre',
    description: 'Comprendre la géologie et la biologie du programme officiel avec des fiches de synthèse.',
    subject: 'SVT',
    level: 'Lycée',
    hourlyRate: 32,
    color: '#ec4899', // Pink
  },
  {
    id: 'c6',
    title: 'Aide aux devoirs primaire',
    description: 'Accompagnement quotidien des élèves de primaire pour l’apprentissage de la lecture et du calcul.',
    subject: 'Général',
    level: 'Primaire',
    hourlyRate: 20,
    color: '#10b981', // Emerald Green
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    firstName: 'Thomas',
    lastName: 'Dubois',
    gradeLevel: 'Terminale',
    email: 'thomas.dubois@gmail.com',
    phone: '06 12 34 56 78',
    enrollmentDate: '2026-01-10',
    status: 'actif',
    notes: 'Très motivé, a besoin d’approfondir les limites et dérivées en Mathématiques.',
    packageType: 'groupe_mensuel',
    totalHours: 16,
    usedHours: 7,
    paymentStatus: 'paye',
    balance: 120, // Groupe mensuel 120€
    grades: [
      { id: 'g1', subject: 'Mathématiques', title: 'DS n°1 - Dérivées', score: 14.5, maxScore: 20, date: '2026-05-12' },
      { id: 'g2', subject: 'Mathématiques', title: 'DS n°2 - Limites de suites', score: 16.5, maxScore: 20, date: '2026-06-05' },
    ],
    progressReports: [
      {
        id: 'pr1',
        date: '2026-06-15',
        sessionTitle: 'Limites de fonctions et comportement asymptotique',
        workDone: 'Exercices types bac sur les limites et les asymptotes obliques.',
        homework: 'Finir l’exercice 4 de la fiche d’entraînement.',
        behaviorRating: 5,
        comment: 'Excellent travail, Thomas est concentré et assimile très vite les notions complexes.',
        reportedToParents: true
      },
      {
        id: 'pr2',
        date: '2026-06-22',
        sessionTitle: 'Étude de fonctions exponentielles',
        workDone: 'Résolution de problèmes concrets utilisant l’exponentielle.',
        homework: 'Faire le sujet de bac Antilles 2024 (partie A).',
        behaviorRating: 4,
        comment: 'Très bonne participation, Thomas commence à prendre de l’assurance dans ses rédactions.',
        reportedToParents: true
      }
    ]
  },
  {
    id: 's2',
    firstName: 'Léa',
    lastName: 'Martin',
    gradeLevel: 'Terminale',
    email: 'lea.martin@outlook.fr',
    phone: '06 23 45 67 89',
    enrollmentDate: '2026-02-15',
    status: 'actif',
    notes: 'Prépare le concours d’entrée en école d’ingénieur.',
    packageType: 'individuel_seance',
    totalHours: 10,
    usedHours: 8,
    paymentStatus: 'en_attente',
    balance: 300, // 10 séances à 30€
    grades: [
      { id: 'g3', subject: 'Physique-Chimie', title: 'DS n°1 - Cinétique chimique', score: 15, maxScore: 20, date: '2026-05-18' },
      { id: 'g4', subject: 'Mathématiques', title: 'Interrogation - Complexes', score: 12, maxScore: 20, date: '2026-06-10' },
    ],
    progressReports: [
      {
        id: 'pr3',
        date: '2026-06-18',
        sessionTitle: 'Mécanique de Newton',
        workDone: 'Étude des forces, lois de Newton appliquées à un projectile.',
        homework: 'Revoir la démonstration des équations horaires.',
        behaviorRating: 4,
        comment: 'Léa est volontaire mais bloque parfois sur l’étape de projection des vecteurs. Des progrès notables à la fin de la séance.',
        reportedToParents: true
      }
    ]
  },
  {
    id: 's3',
    firstName: 'Lucas',
    lastName: 'Bernard',
    gradeLevel: '3ème',
    email: 'lucas.bernard@gmail.com',
    phone: '07 34 56 78 90',
    enrollmentDate: '2026-03-01',
    status: 'actif',
    notes: 'Difficultés en orthographe et rédaction.',
    packageType: 'individuel_seance',
    totalHours: 10,
    usedHours: 4,
    paymentStatus: 'en_retard',
    balance: 300, // 10 séances à 30€
    grades: [
      { id: 'g5', subject: 'Français', title: 'Dictée officielle Brevet', score: 8, maxScore: 20, date: '2026-05-20' },
      { id: 'g6', subject: 'Français', title: 'Rédaction argumentative', score: 11.5, maxScore: 20, date: '2026-06-12' },
    ],
    progressReports: [
      {
        id: 'pr4',
        date: '2026-06-10',
        sessionTitle: 'Accord du participe passé et homophones',
        workDone: 'Exercices d’application directe et dictée de phrases piégées.',
        homework: 'Faire les exercices de la fiche d’orthographe p.12-13.',
        behaviorRating: 3,
        comment: 'Lucas est facilement distrait mais se reprend bien quand on le sollicite. L’orthographe grammaticale reste son point faible.',
        reportedToParents: false
      }
    ]
  },
  {
    id: 's4',
    firstName: 'Chloé',
    lastName: 'Petit',
    gradeLevel: '1ère',
    email: 'chloe.petit@wanadoo.fr',
    phone: '06 45 67 89 01',
    enrollmentDate: '2026-01-20',
    status: 'actif',
    notes: 'Travaille sérieusement mais manque de confiance en elle en sciences.',
    packageType: 'groupe_mensuel',
    totalHours: 16, // 16h par mois
    usedHours: 9,
    paymentStatus: 'paye',
    balance: 120,
    grades: [
      { id: 'g7', subject: 'Physique-Chimie', title: 'Évaluation - Forces de liaison', score: 13, maxScore: 20, date: '2026-05-25' },
    ],
    progressReports: []
  },
  {
    id: 's5',
    firstName: 'Hugo',
    lastName: 'Robert',
    gradeLevel: 'CM2',
    email: 'hugo.robert@laposte.net',
    phone: '06 56 78 90 12',
    enrollmentDate: '2026-04-12',
    status: 'actif',
    notes: 'A besoin d’un cadre structuré pour les devoirs après l’école.',
    packageType: 'individuel_seance',
    totalHours: 10,
    usedHours: 2,
    paymentStatus: 'paye',
    balance: 300,
    grades: [
      { id: 'g8', subject: 'Général', title: 'Calcul mental et divisions', score: 15, maxScore: 20, date: '2026-06-02' }
    ],
    progressReports: []
  },
  {
    id: 's6',
    firstName: 'Inès',
    lastName: 'Richard',
    gradeLevel: '3ème',
    email: 'ines.richard@gmail.com',
    phone: '07 67 89 01 23',
    enrollmentDate: '2026-02-10',
    status: 'suspendu',
    notes: 'Absente temporairement pour raisons familiales.',
    packageType: 'groupe_mensuel',
    totalHours: 16,
    usedHours: 16,
    paymentStatus: 'paye',
    balance: 120,
    grades: [],
    progressReports: []
  },
  {
    id: 's7',
    firstName: 'Nathan',
    lastName: 'Durand',
    gradeLevel: '1ère',
    email: 'nathan.durand@outlook.com',
    phone: '06 78 90 12 34',
    enrollmentDate: '2026-01-05',
    status: 'actif',
    notes: 'Prend des cours de maths et physique.',
    packageType: 'groupe_mensuel',
    totalHours: 16,
    usedHours: 15,
    paymentStatus: 'paye',
    balance: 120,
    grades: [],
    progressReports: []
  },
  {
    id: 's8',
    firstName: 'Sarah',
    lastName: 'Moreau',
    gradeLevel: 'Terminale',
    email: 'sarah.moreau@gmail.com',
    phone: '06 89 01 23 45',
    enrollmentDate: '2026-05-20',
    status: 'actif',
    notes: 'Vise une mention très bien au Baccalauréat.',
    packageType: 'individuel_seance',
    totalHours: 10,
    usedHours: 4,
    paymentStatus: 'en_attente',
    balance: 300,
    grades: [
      { id: 'g9', subject: 'Mathématiques', title: 'DS Probabilités', score: 18.5, maxScore: 20, date: '2026-06-14' }
    ],
    progressReports: []
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't1',
    firstName: 'Jean-Marc',
    lastName: 'Lefebvre',
    subjects: ['Mathématiques', 'SVT'],
    email: 'jm.lefebvre@soutienscolaire.fr',
    phone: '06 11 22 33 44',
    hourlySalary: 25,
    status: 'actif',
  },
  {
    id: 't2',
    firstName: 'Sophie',
    lastName: 'Rousseau',
    subjects: ['Physique-Chimie', 'Mathématiques'],
    email: 'sophie.rousseau@gmail.com',
    phone: '06 22 33 44 55',
    hourlySalary: 23,
    status: 'actif',
  },
  {
    id: 't3',
    firstName: 'Michel',
    lastName: 'Guerin',
    subjects: ['Français'],
    email: 'm.guerin@ac-paris.fr',
    phone: '06 33 44 55 66',
    hourlySalary: 20,
    status: 'actif',
  },
  {
    id: 't4',
    firstName: 'Amandine',
    lastName: 'Duval',
    subjects: ['Anglais'],
    email: 'amandine.duval@gmail.com',
    phone: '06 44 55 66 77',
    hourlySalary: 20,
    status: 'actif',
  },
  {
    id: 't5',
    firstName: 'Pierre',
    lastName: 'Gauthier',
    subjects: ['Général'],
    email: 'p.gauthier@gmail.com',
    phone: '06 55 66 77 88',
    hourlySalary: 18,
    status: 'actif',
  }
];

export const INITIAL_SESSIONS: ClassSession[] = [
  // Past sessions (status 'terminé') with full attendance list and summaries
  {
    id: 'sess1',
    courseId: 'c1',
    teacherId: 't1',
    studentIds: ['s1', 's2', 's8'],
    date: '2026-06-22',
    startTime: '10:00',
    endTime: '12:00',
    room: 'Salle 101',
    status: 'terminé',
    attendance: [
      { studentId: 's1', status: 'present' },
      { studentId: 's2', status: 'present' },
      { studentId: 's8', status: 'present' }
    ],
    summary: {
      workDone: 'Introduction aux probabilités conditionnelles et arbres pondérés.',
      homework: 'Exercices 5, 8 et 10 de la fiche de préparation.',
      globalBehavior: 'excellent',
      reportedToParents: true
    }
  },
  {
    id: 'sess2',
    courseId: 'c2',
    teacherId: 't2',
    studentIds: ['s4', 's7'],
    date: '2026-06-22',
    startTime: '14:00',
    endTime: '15:30',
    room: 'Salle 102',
    status: 'terminé',
    attendance: [
      { studentId: 's4', status: 'present' },
      { studentId: 's7', status: 'absent_justifie', comment: 'Rendez-vous médical' }
    ],
    summary: {
      workDone: 'Correction des exercices sur la cinétique. Synthèse de l’aspirine.',
      homework: 'Apprendre le cours chap. 4 et faire l’activité 2.',
      globalBehavior: 'bon',
      reportedToParents: true
    }
  },
  // Scheduled sessions (today & future)
  {
    id: 'sess3',
    courseId: 'c3',
    teacherId: 't3',
    studentIds: ['s3'],
    date: '2026-06-23', // today!
    startTime: '14:00',
    endTime: '16:00',
    room: 'Salle 103',
    status: 'planifié',
    attendance: [
      { studentId: 's3', status: 'present' }
    ]
  },
  {
    id: 'sess4',
    courseId: 'c4',
    teacherId: 't4',
    studentIds: ['s1', 's4', 's8'],
    date: '2026-06-24',
    startTime: '16:30',
    endTime: '18:00',
    room: 'Salle d’Anglais',
    status: 'planifié'
  },
  {
    id: 'sess5',
    courseId: 'c1',
    teacherId: 't1',
    studentIds: ['s2', 's7'],
    date: '2026-06-25',
    startTime: '09:00',
    endTime: '11:00',
    room: 'Salle 101',
    status: 'planifié'
  },
  {
    id: 'sess6',
    courseId: 'c6',
    teacherId: 't5',
    studentIds: ['s5'],
    date: '2026-06-23', // today!
    startTime: '16:30',
    endTime: '18:30',
    room: 'Salle Primaire',
    status: 'planifié',
    attendance: [
      { studentId: 's5', status: 'present' }
    ]
  },
  {
    id: 'sess7',
    courseId: 'c5',
    teacherId: 't1',
    studentIds: ['s1', 's2'],
    date: '2026-06-26',
    startTime: '14:00',
    endTime: '16:00',
    room: 'Salle 104',
    status: 'planifié'
  },
  {
    id: 'sess8',
    courseId: 'c2',
    teacherId: 't2',
    studentIds: ['s4'],
    date: '2026-06-27',
    startTime: '10:30',
    endTime: '12:00',
    room: 'Salle 102',
    status: 'planifié'
  }
];
