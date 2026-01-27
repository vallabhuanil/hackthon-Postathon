import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_url from "../components/Base_url";

const OfficerDashboardPage = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null); // Track which complaint is being processed

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
  });

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
  });

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("officer_token");
    if (!token) navigate("/officer/login");
  }, [navigate]);

  /* ---------------- FETCH COMPLAINTS ---------------- */
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem("officer_token");

        const { data } = await axios.get(`${Base_url}/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setComplaints(data);
        setFilteredComplaints(data);
        calculateStats(data);
      } catch (err) {
        setError("Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  /* ---------------- URGENT ATTENTION FILTER LOGIC ---------------- */
  const isComplaintUrgent = (complaint) => {
    if (complaint.status === "RESOLVED") return false;

    const now = new Date();
    const createdAt = new Date(complaint.created_at);
    const diffHours = (now - createdAt) / (1000 * 60 * 60);

    return diffHours >= 48;
  };

  /* ---------------- FILTER LOGIC ---------------- */
  useEffect(() => {
    let result = complaints;

    if (filters.status !== "all") {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.priority !== "all") {
      if (filters.priority === "URGENT_ATTENTION") {
        // Apply the urgent attention filter (≥ 48 hours and not resolved)
        result = result.filter(isComplaintUrgent);
      } else {
        // Regular priority filter
        result = result.filter((c) => c.priority_level === filters.priority);
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.complaint_id.toLowerCase().includes(q) ||
          c.service_type.toLowerCase().includes(q) ||
          c.ai_category?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    setFilteredComplaints(result);
  }, [filters, complaints]);

  /* ---------------- HELPERS ---------------- */
  const calculateStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter((c) => c.status === "ACTIVE").length,
      inProgress: data.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: data.filter((c) => c.status === "RESOLVED").length,
      critical: data.filter((c) => c.priority_level === "CRITICAL").length,
    });
  };

  const getOutOfDateCount = () => {
    return complaints.filter(isComplaintUrgent).length;
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: "all", priority: "all", search: "" });
  };

  /* ---------------- STATUS UPDATE ---------------- */
  const handleStartInvestigation = async (complaintId) => {
    setProcessingId(complaintId);
    try {
      const token = localStorage.getItem("officer_token");

      await axios.patch(
        `${Base_url}/complaints/${complaintId}/status`,
        { status: "IN_PROGRESS" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = complaints.map((c) =>
        c.complaint_id === complaintId ? { ...c, status: "IN_PROGRESS" } : c
      );

      setComplaints(updated);
      calculateStats(updated);

      // Show success message
      alert("Investigation started successfully!");
    } catch {
      alert("Failed to start investigation");
    } finally {
      setProcessingId(null);
    }
  };

  /* ---------------- UI HELPERS ---------------- */
  const getPriorityColor = (p) =>
    p === "CRITICAL"
      ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
      : p === "HIGH"
      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
      : p === "MEDIUM"
      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
      : p === "LOW"
      ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
      : "bg-gradient-to-r from-gray-500 to-gray-600 text-white";

  const getStatusColor = (s) =>
    s === "ACTIVE"
      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
      : s === "IN_PROGRESS"
      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
      : s === "RESOLVED"
      ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
      : "bg-gradient-to-r from-gray-500 to-gray-600 text-white";

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return "⏳";
      case "IN_PROGRESS":
        return "🔍";
      case "RESOLVED":
        return "✅";
      default:
        return "📝";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Officer Dashboard
                </h1>
                <p className="text-red-100">
                  Manage and track all complaints efficiently
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="font-bold text-xl">{stats.total}</span>
                  <span className="text-sm ml-2">Total</span>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="font-bold text-xl">{stats.pending}</span>
                  <span className="text-sm ml-2">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          {/* ... (existing stats cards remain the same) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Complaints</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.pending}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.inProgress}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.resolved}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.critical}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-semibold">
                  Urgent Attention Needed
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Out of date (≥ 48 hrs, not resolved)
                </p>
                <p className="text-3xl font-bold text-red-600 mt-3">
                  {getOutOfDateCount()}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Complaints List
              </h2>
              <p className="text-gray-600 text-sm">
                Manage and track all registered complaints
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {filteredComplaints.length} complaints
              </span>
              {(filters.status !== "all" ||
                filters.priority !== "all" ||
                filters.search) && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-lg hover:bg-red-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="URGENT_ATTENTION">
                  ⚠️ Urgent Attention Needed
                </option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          {loading ? (
            <div className="text-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-red-600 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-gray-600">Loading complaints...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50"
              >
                Try again
              </button>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No complaints found
              </h3>
              <p className="text-gray-600 mb-4">
                Try changing your filters or search term
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white font-medium py-2 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Complaint Details
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Category & Priority
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((complaint) => (
                    <tr
                      key={complaint.complaint_id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="bg-red-100 p-2 rounded-lg mr-4">
                            <span className="text-red-600 font-bold">
                              {getStatusIcon(complaint.status)}
                            </span>
                          </div>
                          <div>
                            <div className="font-mono font-bold text-gray-900 text-sm">
                              {complaint.complaint_id}
                            </div>
                            <div className="text-gray-700 font-medium mt-1">
                              {complaint.service_type}
                            </div>
                            <div className="text-gray-500 text-sm mt-1">
                              {complaint.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-gray-700 mb-2">
                            {complaint.ai_category || "General"}
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(
                                complaint.priority_level
                              )}`}
                            >
                              {complaint.priority_level}
                            </span>
                            {isComplaintUrgent(complaint) && (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white">
                                ⚠️ Urgent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                            complaint.status
                          )}`}
                        >
                          {complaint.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {formatDate(complaint.created_at)}
                          {isComplaintUrgent(complaint) && (
                            <div className="text-xs text-red-600 font-semibold mt-1">
                              ⚠️ Overdue
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-2">
                          {complaint.status === "ACTIVE" ? (
                            <button
                              onClick={() =>
                                handleStartInvestigation(complaint.complaint_id)
                              }
                              disabled={processingId === complaint.complaint_id}
                              className="relative flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium overflow-hidden group"
                            >
                              {/* Animated background effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              {/* Loading animation */}
                              {processingId === complaint.complaint_id ? (
                                <div className="flex items-center">
                                  <svg
                                    className="animate-spin h-4 w-4 mr-2 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  <span className="relative z-10">
                                    Starting...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-2 relative z-10"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                  <span className="relative z-10">
                                    Start Investigation
                                  </span>

                                  {/* Pulsing animation on hover */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 opacity-0 group-hover:opacity-100 animate-pulse"></div>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                navigate(
                                  `/officer/complaints/${complaint.complaint_id}`
                                )
                              }
                              className="relative flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium overflow-hidden group"
                            >
                              {/* Animated background effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              <svg
                                className="w-4 h-4 mr-2 relative z-10"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              <span className="relative z-10">
                                View Details
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stats & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              Priority Distribution
            </h3>
            <div className="space-y-3">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((priority) => {
                const count = complaints.filter(
                  (c) => c.priority_level === priority
                ).length;
                const percentage =
                  stats.total > 0
                    ? ((count / stats.total) * 100).toFixed(1)
                    : 0;
                return (
                  <div
                    key={priority}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          priority === "CRITICAL"
                            ? "bg-red-500"
                            : priority === "HIGH"
                            ? "bg-orange-500"
                            : priority === "MEDIUM"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      ></div>
                      <span className="text-gray-700">{priority}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{count}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/officer/analytics")}
                className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center"
              >
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    View Analytics
                  </div>
                  <div className="text-xs text-gray-500">
                    Performance metrics & reports
                  </div>
                </div>
              </button>
              <button
                onClick={() => alert("Export feature coming soon!")}
                className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center"
              >
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Export Report</div>
                  <div className="text-xs text-gray-500">
                    Download complaint data
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              System Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Officer Role:</span>
                <span className="font-semibold bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                  Complaint Handler
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Session Active:</span>
                <span className="font-semibold text-green-600">2h 15m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">AI Accuracy:</span>
                <span className="font-semibold text-green-600">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Avg. Resolution Time:</span>
                <span className="font-semibold">24h 42m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboardPage;
