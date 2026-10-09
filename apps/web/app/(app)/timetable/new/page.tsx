// Add timetable entry
import TimetableEntryForm from '../_components/TimetableEntryForm'

export default function NewTimetableEntryPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Add Class</h1>
      </div>
      <TimetableEntryForm />
    </div>
  )
}
