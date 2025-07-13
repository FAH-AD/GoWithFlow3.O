import { Clock, CheckCircle, AlertTriangle } from "lucide-react"

const ProjectTimeline = ({ projects }) => {
  // Sort projects by deadline
  const sortedProjects = [...projects].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  // Helper function to determine if a deadline is approaching
  const isDeadlineApproaching = (deadline) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  // Helper function to determine if a deadline is overdue
  const isDeadlineOverdue = (deadline) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    return deadlineDate < today
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <div className="space-y-4">
      {sortedProjects.map((project) => {
        const isApproaching = isDeadlineApproaching(project.deadline)
        const isOverdue = isDeadlineOverdue(project.deadline)

        let statusIcon = <Clock size={16} className="text-gray-400" />
        let statusClass = "text-gray-400"

        if (isApproaching) {
          statusIcon = <AlertTriangle size={16} className="text-yellow-400" />
          statusClass = "text-yellow-400"
        } else if (isOverdue) {
          statusIcon = <AlertTriangle size={16} className="text-red-400" />
          statusClass = "text-red-400"
        } else if (project.status === "completed") {
          statusIcon = <CheckCircle size={16} className="text-green-400" />
          statusClass = "text-green-400"
        }

        return (
          <div key={project.id} className="flex items-start">
            <div className={`p-2 rounded-full bg-[#2d2d3a] mr-3 flex-shrink-0 ${statusClass}`}>{statusIcon}</div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{project.title}</h4>
                <span className={`text-xs font-medium ${statusClass}`}>{formatDate(project.deadline)}</span>
              </div>
              <div className="flex items-center mt-1">
                <div className="h-5 w-5 rounded-full overflow-hidden mr-1">
                  <img
                    src={project.freelancer?.image || "/placeholder.svg"}
                    alt={project.freelancer?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-gray-400 text-xs">{project.freelancer?.name}</span>
              </div>
              <div className="w-full h-1 bg-[#2d2d3a] rounded-full mt-2">
                <div className="h-full bg-[#9333EA] rounded-full" style={{ width: `${project.progress}%` }}></div>
              </div>
            </div>
          </div>
        )
      })}

      {sortedProjects.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">No projects scheduled</p>
        </div>
      )}
    </div>
  )
}

export default ProjectTimeline
