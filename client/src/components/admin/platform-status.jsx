import { CheckCircle, AlertTriangle } from "lucide-react"

const PlatformStatus = ({ data }) => {
  // Use provided data or fallback to sample data
  const services = data ? [
    { 
      name: "Server", 
      status: data.server.status, 
      uptime: `${data.server.uptime}%`,
      responseTime: `${data.server.responseTime}ms`
    },
    { 
      name: "Database", 
      status: data.database.status, 
      uptime: `${data.database.uptime}%`,
      responseTime: `${data.database.responseTime}ms`
    },
    { 
      name: "User Management", 
      status: data.users.status, 
      uptime: `${data.users.uptime}%`,
      responseTime: `${data.users.activeCount} active`
    },
    { 
      name: "Job System", 
      status: data.jobs.status, 
      uptime: `${data.jobs.uptime}%`,
      responseTime: `${data.jobs.activeCount} active`
    },
    { 
      name: "Payment Processing", 
      status: data.payments.status, 
      uptime: `${data.payments.uptime}%`,
      responseTime: `${data.payments.responseTime}ms`
    },
  ] : [
    { name: "API Services", status: "operational", uptime: "99.98%", responseTime: "25ms" },
    { name: "Web Application", status: "operational", uptime: "99.95%", responseTime: "32ms" },
    { name: "Database", status: "operational", uptime: "99.99%", responseTime: "15ms" },
    { name: "Payment Processing", status: "degraded", uptime: "98.75%", responseTime: "45ms" },
    { name: "Search Engine", status: "operational", uptime: "99.92%", responseTime: "28ms" },
  ]

  const overallStatus = services.every(s => s.status === "operational") ? "operational" : "degraded"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${overallStatus === "operational" ? "bg-green-500" : "bg-yellow-500"}`}></div>
          <span className="font-medium">
            {overallStatus === "operational" ? "System Operational" : "System Degraded"}
          </span>
        </div>
        <span className="text-sm text-gray-400">Updated 5 min ago</span>
      </div>

      <div className="space-y-3 mt-4">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-[#1e1e2d] rounded-lg">
            <div className="flex items-center">
              {service.status === "operational" ? (
                <CheckCircle size={16} className="text-green-500 mr-2" />
              ) : (
                <AlertTriangle size={16} className="text-yellow-500 mr-2" />
              )}
              <span>{service.name}</span>
            </div>
            <div className="flex items-center">
              <span className={`text-sm ${service.status === "operational" ? "text-green-400" : "text-yellow-400"}`}>
                {service.status === "operational" ? "Operational" : "Degraded Performance"}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                ({service.uptime} | {service.responseTime})
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[#2d2d3a]">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Last Incident</span>
          <span className="text-sm">July 28, 2023</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Payment processing service degradation (Resolved)</p>
      </div>
    </div>
  )
}

export default PlatformStatus
