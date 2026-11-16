export interface ScheduleEntry {
  id: string
  subjectCode: string
  subjectName: string | null
  startTime: string
  venue: string | null
  room: string | null
}

export const MORNING_SUMMARY_FROM = 7 * 60
export const MORNING_SUMMARY_UNTIL = 10 * 60

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function minutesUntilStart(entry: ScheduleEntry, nowMinutes: number): number {
  return toMinutes(entry.startTime) - nowMinutes
}

export function dueReminders(entries: ScheduleEntry[], nowMinutes: number, lead: number): Array<{ entry: ScheduleEntry; minutes: number }> {
  return entries
    .map((entry) => ({ entry, minutes: minutesUntilStart(entry, nowMinutes) }))
    .filter((x) => x.minutes > 0 && x.minutes <= lead)
    .sort((a, b) => a.minutes - b.minutes)
}

export function summaryDue(nowMinutes: number): boolean {
  return nowMinutes >= MORNING_SUMMARY_FROM && nowMinutes < MORNING_SUMMARY_UNTIL
}

export function placeOf(entry: ScheduleEntry): string {
  return [entry.venue, entry.room].filter(Boolean).join(' ')
}

export function reminderText(entry: ScheduleEntry, minutes: number): { title: string; body: string } {
  const place = placeOf(entry)
  const name = entry.subjectName && entry.subjectName !== entry.subjectCode ? entry.subjectName : null
  return {
    title: `${entry.subjectCode} starts in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
    body: [name, place ? `at ${place}` : null].filter(Boolean).join(' ') || 'Your class is about to start.',
  }
}

export function summaryText(entries: ScheduleEntry[]): { title: string; body: string } {
  const sorted = [...entries].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
  const first = sorted[0]!
  const place = placeOf(first)
  const count = sorted.length
  return {
    title: count === 1 ? '1 class today' : `${count} classes today`,
    body: `First: ${first.subjectCode} at ${first.startTime.slice(0, 5)}${place ? ` in ${place}` : ''}.`,
  }
}
