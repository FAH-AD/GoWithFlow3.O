import { ExternalLink } from "lucide-react"

const ProjectCard = ({ project }) => {
  // Helper function to determine status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case "in_progress":
        return { bg: "bg-blue-900/20", text: "text-blue-400", label: "In Progress" }
      case "review":
        return { bg: "bg-yellow-900/20", text: "text-yellow-400", label: "In Review" }
      case "completed":
        return { bg: "bg-green-900/20", text: "text-green-400", label: "Completed" }
      case "draft":
        return { bg: "bg-gray-900/20", text: "text-gray-400", label: "Draft" }
      default:
        return { bg: "bg-gray-900/20", text: "text-gray-400", label: "Unknown" }
    }
  }

  const statusBadge = getStatusBadge(project.status)

  return (
    <div className="bg-[#1e1e2d] rounded-lg p-4 border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{project.title}</h3>
          <p className="text-gray-400 text-sm mt-1 line-clamp-1">{project.description}</p>
        </div>
        <div className={`${statusBadge.bg} ${statusBadge.text} px-2 py-1 rounded-md text-xs font-medium`}>
          {statusBadge.label}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <div className="w-full h-2 bg-[#2d2d3a] rounded-full mt-1">
          <div className="h-full bg-[#9333EA] rounded-full" style={{ width: `${project.progress}%` }}></div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#2d2d3a] flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
            <img
              src={project.freelancer?.avatar || "/placeholder.svg"}
              alt={project.freelancer?.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium">{project.freelancer?.name}</p>
            <div className="flex items-center">
              <span className="text-[#9333EA] text-xs font-medium">{project.freelancer?.rating}</span>
              <svg
                className="w-3 h-3 text-[#9333EA] ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-400">Budget</p>
            <p className="text-sm font-medium">${project.budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Deadline</p>
            <p className="text-sm font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
          </div>
          <button className="bg-[#2d2d3a] hover:bg-[#3d3d4a] p-2 rounded-md transition-colors">
            <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
