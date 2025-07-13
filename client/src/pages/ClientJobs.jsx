import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Navbar from "../components/Navbar";

const ClientJobs = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.Auth.user);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("open");

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: "/client/posted-jobs", message: "Please login to view your posted jobs" },
      });
    } else if (user.role !== "client") {
      navigate("/", { state: { message: "Only clients can view posted jobs" } });
    } else {
      fetchJobs();
    }
  }, [user, navigate]);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/jobs/my/posted-jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(data.data);
     } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = (status) => {
    return jobs?.filter((job) => job.status === status);
  };
   const NoJobsMessage = () => (
    <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-8 text-center">
      <Briefcase size={48} className="text-[#9333EA] mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">No Jobs Posted Yet</h2>
      <p className="text-gray-400 mb-6">You haven't posted any jobs. Start by creating your first job listing!</p>
      <button
        onClick={() => navigate("/client/post-job")}
        className="bg-[#9333EA] hover:bg-[#a855f7] text-white px-6 py-3 rounded-md transition-colors duration-200"
      >
        Post Your First Job
      </button>
    </div>
  );

  const JobSection = ({ title, status, icon: Icon }) => {
    const filteredJobs = filterJobs(status);
    const [isExpanded, setIsExpanded] = useState(activeSection === status);
     if (jobs.length === 0) {
      return null; // Don't render the section if there are no jobs
    }

    return (
      <div className="mb-8 bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden transition-all duration-300 ease-in-out">
        <div
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => {
            setIsExpanded(!isExpanded);
            setActiveSection(status);
          }}
        >
          <div className="flex items-center">
            <Icon size={24} className="text-[#9333EA] mr-2" />
            <h2 className="text-xl font-bold">{title}</h2>
            <span className="ml-2 bg-[#2d2d3a] text-white px-2 py-1 rounded-full text-sm">
              {filteredJobs.length}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[1000px]" : "max-h-0"
          }`}
        >
          {filteredJobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      </div>
    );
  };

  const JobCard = ({ job }) => {
    const getJobRoute = (job) => {
    if (job.isCrowdsourced && job.status === 'in-progress') {
      return `/client/my-teams/${job._id}`;
    } else if (job.status === 'open') {
      return `/client/jobs/${job._id}`;
    } else {
      return `/client/my-jobs/${job._id}`;
    }
  };
    return (
      <div className="p-4 border-t border-[#2d2d3a] hover:bg-[#1e1e2d] transition-colors duration-200">
        <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
        <p className="text-gray-400 mb-2">{job.description.substring(0, 100)}...</p>
        <div className="flex justify-between items-center">
          <span className="text-[#9333EA]">PKR {job.budget}</span>
          <button
            onClick={() => navigate(getJobRoute(job))}
            className="bg-[#9333EA] hover:bg-[#a855f7] text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#9333EA]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="bg-[#121218] p-8 rounded-lg border border-[#2d2d3a] max-w-md w-full text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-12">
      <Navbar />
      <div className="bg-gradient-to-r mb-6 h-[200px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
            <div>
              <div className="flex items-center">
                <Briefcase className="text-[#9333EA] mr-2" size={24} />
                <h1 className="text-2xl md:text-3xl font-bold">Posted Jobs</h1>
              </div>
              <p className="text-gray-400 mt-1">Manage and track your posted jobs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {jobs.length === 0 ? (
          <NoJobsMessage />
        ) : (
          <>
            <JobSection title="Open Jobs" status="open" icon={Briefcase} />
            <JobSection title="In-Progress Jobs" status="in-progress" icon={Clock} />
            <JobSection title="Completed Jobs" status="completed" icon={CheckCircle} />
           
          </>
        )}
      </div>
    </div>
  );
};

export default ClientJobs;