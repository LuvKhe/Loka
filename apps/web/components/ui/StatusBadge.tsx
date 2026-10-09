import type { TimetableStatus } from '@loka/shared/types'

const config: Record<string, { label: string; className: string }> = {
  in_class:        { label: 'In class',          className: 'loka-badge-in-class' },
  free:            { label: 'Free',               className: 'loka-badge-free' },
  between_classes: { label: 'Between classes',    className: 'loka-badge-between' },
  no_classes_today:{ label: 'No classes today',   className: 'loka-badge-offline' },
  weekend:         { label: 'No classes today',   className: 'loka-badge-offline' },
  unknown:         { label: 'Unknown',            className: 'loka-badge-offline' },
  off_campus:      { label: 'Off campus',         className: 'loka-badge-offline' },
}

export default function StatusBadge({ status }: { status: TimetableStatus | string }) {
  const c = config[status] ?? config.unknown!
  return <span className={c.className}>{c.label}</span>
}
