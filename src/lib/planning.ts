import { ClassSession } from '../types';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function checkPlanningConflicts(sessions: ClassSession[]): Array<{
  type: 'teacher' | 'room';
  id1: string;
  id2: string;
  date: string;
  targetName: string;
  timeSlot: string;
}> {
  const activeSessions = sessions.filter(s => s.status === 'planifié');
  const conflicts: Array<{
    type: 'teacher' | 'room';
    id1: string;
    id2: string;
    date: string;
    targetName: string;
    timeSlot: string;
  }> = [];

  for (let i = 0; i < activeSessions.length; i++) {
    for (let j = i + 1; j < activeSessions.length; j++) {
      const s1 = activeSessions[i];
      const s2 = activeSessions[j];

      if (s1.date === s2.date) {
        const start1 = timeToMinutes(s1.startTime);
        const end1 = timeToMinutes(s1.endTime);
        const start2 = timeToMinutes(s2.startTime);
        const end2 = timeToMinutes(s2.endTime);

        // Check time overlap
        const isOverlapping = Math.max(start1, start2) < Math.min(end1, end2);

        if (isOverlapping) {
          // 1. Teacher conflict
          if (s1.teacherId === s2.teacherId && s1.teacherId) {
            conflicts.push({
              type: 'teacher',
              id1: s1.id,
              id2: s2.id,
              date: s1.date,
              targetName: s1.teacherId, // Will resolve name in parent render
              timeSlot: `${s1.startTime}-${s1.endTime} vs ${s2.startTime}-${s2.endTime}`,
            });
          }
          // 2. Room conflict
          if (s1.roomId === s2.roomId && s1.roomId) {
            conflicts.push({
              type: 'room',
              id1: s1.id,
              id2: s2.id,
              date: s1.date,
              targetName: s1.roomId,
              timeSlot: `${s1.startTime}-${s1.endTime} vs ${s2.startTime}-${s2.endTime}`,
            });
          }
        }
      }
    }
  }
  return conflicts;
}
