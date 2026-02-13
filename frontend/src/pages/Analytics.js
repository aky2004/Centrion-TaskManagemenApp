import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { taskAPI, projectAPI } from '../services/api';
import {
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  FireIcon,
  BoltIcon,
  FlagIcon,
  CalendarDaysIcon,
  UserIcon,
  FolderIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusConfig = {
  'todo': { label: 'To Do', color: '#9CA3AF', bg: 'bg-gray-100 dark:bg-gray-700' },
  'in-progress': { label: 'In Progress', color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  'review': { label: 'Review', color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'completed': { label: 'Completed', color: '#10B981', bg: 'bg-green-100 dark:bg-green-900/30' },
  'blocked': { label: 'Blocked', color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30' },
};

const priorityColors = {
  'urgent': '#EF4444',
  'high': '#F97316',
  'medium': '#EAB308',
  'low': '#22C55E',
};

// Simple bar chart
const BarChart = ({ data, maxValue, height = 200 }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-3 justify-between" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
          <div className="relative w-full flex justify-center">
            <span className="absolute -top-6 text-xs font-bold text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{item.value}</span>
          </div>
          <div
            className="w-full rounded-t-xl transition-all duration-700 ease-out hover:opacity-80 relative overflow-hidden"
            style={{
              height: `${Math.max((item.value / max) * (height - 40), 4)}px`,
              backgroundColor: item.color,
              minWidth: '24px',
            }}
          >
             <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          </div>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center uppercase tracking-wide truncate w-full">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Donut chart
const DonutChart = ({ data, size = 180 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-xl">
        {data.map((item, i) => {
          const strokeLen = (item.value / total) * circumference;
          const currentOffset = offset;
          offset += strokeLen;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="24"
              strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out hover:brightness-110 cursor-pointer"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{total}</span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</span>
      </div>
    </div>
  );
};

// Progress ring
const ProgressRing = ({ value, max, size = 100, color = '#3B82F6', label }) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative drop-shadow-lg" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transform group-hover:scale-110 transition-transform duration-300">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
        </div>
      </div>
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );
};

const Analytics = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, projectRes] = await Promise.all([
        taskAPI.getTasks(),
        projectAPI.getProjects(),
      ]);
      setTasks(taskRes.data.tasks || []);
      setProjects(projectRes.data.projects || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks by project
  const filteredTasks = useMemo(() => {
    if (selectedProject === 'all') return tasks;
    return tasks.filter(t => (t.project?._id || t.project) === selectedProject);
  }, [tasks, selectedProject]);

  // Computed analytics
  const analytics = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in-progress').length;
    const review = filteredTasks.filter(t => t.status === 'review').length;
    const todo = filteredTasks.filter(t => t.status === 'todo').length;
    const blocked = filteredTasks.filter(t => t.status === 'blocked').length;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdue = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;
    const noDueDate = filteredTasks.filter(t => !t.dueDate).length;

    // Priority breakdown
    const urgent = filteredTasks.filter(t => t.priority === 'urgent').length;
    const high = filteredTasks.filter(t => t.priority === 'high').length;
    const medium = filteredTasks.filter(t => t.priority === 'medium').length;
    const low = filteredTasks.filter(t => t.priority === 'low').length;

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Engagement score (weighted)
    const engagementScore = total > 0 ? Math.min(100, Math.round(
      (completed * 3 + inProgress * 2 + review * 1.5) / (total * 3) * 100
    )) : 0;

    // On-time rate
    const tasksWithDue = filteredTasks.filter(t => t.dueDate);
    const completedOnTime = filteredTasks.filter(t =>
      t.status === 'completed' && t.dueDate && t.completedAt &&
      new Date(t.completedAt) <= new Date(t.dueDate)
    ).length;
    const onTimeRate = tasksWithDue.filter(t => t.status === 'completed').length > 0
      ? Math.round((completedOnTime / tasksWithDue.filter(t => t.status === 'completed').length) * 100)
      : 0;

    // This week's tasks
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const thisWeekCompleted = filteredTasks.filter(t =>
      t.completedAt && new Date(t.completedAt) >= weekStart
    ).length;

    // Per-project stats
    const projectStats = projects.map(p => {
      const projectTasks = tasks.filter(t => (t.project?._id || t.project) === p._id);
      const projCompleted = projectTasks.filter(t => t.status === 'completed').length;
      const projTotal = projectTasks.length;
      return {
        id: p._id,
        name: p.name,
        color: p.color || '#6B7280',
        total: projTotal,
        completed: projCompleted,
        inProgress: projectTasks.filter(t => t.status === 'in-progress').length,
        review: projectTasks.filter(t => t.status === 'review').length,
        todo: projectTasks.filter(t => t.status === 'todo').length,
        blocked: projectTasks.filter(t => t.status === 'blocked').length,
        overdue: projectTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length,
        progress: projTotal > 0 ? Math.round((projCompleted / projTotal) * 100) : 0,
      };
    });

    return {
      total, completed, inProgress, review, todo, blocked,
      overdue, noDueDate,
      urgent, high, medium, low,
      completionRate, engagementScore, onTimeRate, thisWeekCompleted,
      projectStats,
    };
  }, [filteredTasks, projects, tasks]);

  // Status donut data
  const statusDonutData = [
    { label: 'To Do', value: analytics.todo, color: statusConfig['todo'].color },
    { label: 'In Progress', value: analytics.inProgress, color: statusConfig['in-progress'].color },
    { label: 'Review', value: analytics.review, color: statusConfig['review'].color },
    { label: 'Completed', value: analytics.completed, color: statusConfig['completed'].color },
    { label: 'Blocked', value: analytics.blocked, color: statusConfig['blocked'].color },
  ].filter(d => d.value > 0);

  // Priority bar data
  const priorityBarData = [
    { label: 'Urgent', value: analytics.urgent, color: priorityColors.urgent },
    { label: 'High', value: analytics.high, color: priorityColors.high },
    { label: 'Medium', value: analytics.medium, color: priorityColors.medium },
    { label: 'Low', value: analytics.low, color: priorityColors.low },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-t-primary-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Gathering insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 selection:bg-primary-500/30">
      {/* Background Blobs - Consistent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Navigation - Minimal */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                 <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                Analytics
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="pl-4 pr-10 py-2 text-sm font-medium border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-sm appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name}
                </span>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Tasks</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{analytics.total}</p>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{analytics.noDueDate} without due date</p>
          </div>

          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Completed</span>
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{analytics.completed}</p>
            <p className="text-xs font-medium text-green-500 flex items-center gap-1">
              <ArrowTrendingUpIcon className="w-3 h-3" />
              {analytics.completionRate}% completion rate
            </p>
          </div>

          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">In Progress</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{analytics.inProgress}</p>
            <p className="text-xs font-medium text-amber-500">{analytics.review} in review</p>
          </div>

          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Overdue</span>
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{analytics.overdue}</p>
            <p className="text-xs font-medium text-red-500">{analytics.blocked} blocked tasks</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Score */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary-500" />
              Team Performance
            </h3>
            <div className="flex justify-between items-end mb-8">
               <ProgressRing value={analytics.completionRate} max={100} size={110} color="#10B981" label="Completion" />
               <ProgressRing value={analytics.engagementScore} max={100} size={110} color="#3B82F6" label="Engagement" />
               <ProgressRing value={analytics.onTimeRate} max={100} size={110} color="#8B5CF6" label="On-Time" />
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BoltIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Velocity (This week)</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{analytics.thisWeekCompleted} tasks</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
              Status Breakdown
            </h3>
            <div className="flex justify-center mb-6 py-4">
              {statusDonutData.length > 0 ? (
                <DonutChart data={statusDonutData} size={180} />
              ) : (
                <div className="w-[180px] h-[180px] rounded-full border-4 border-gray-100 dark:border-gray-700 border-dashed flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <p className="text-sm font-medium">No tasks</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {statusDonutData.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-700/30 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label} <span className="opacity-60">({item.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FlagIcon className="w-5 h-5 text-orange-500" />
              Task Priorities
            </h3>
            <div className="h-[180px] flex items-end mb-6">
              <BarChart data={priorityBarData} height={180} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {priorityBarData.map(item => (
                <div key={item.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project-wise breakdown - Span 2 cols */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FolderIcon className="w-5 h-5 text-purple-500" />
              Project Health
            </h3>

            {analytics.projectStats.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <FolderIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No projects found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.projectStats.map(project => (
                  <div key={project.id} className="group p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: project.color, boxShadow: `0 4px 12px ${project.color}40` }}>
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link to={`/projects/${project.id}`} className="font-bold text-gray-900 dark:text-white hover:text-primary-600 transition-colors text-lg">
                            {project.name}
                          </Link>
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{project.total} tasks total</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Done</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-5">
                      <div className="h-full flex">
                        <div className="bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 relative group/bar" style={{ width: `${project.total > 0 ? (project.completed / project.total) * 100 : 0}%` }} title="Completed" />
                        <div className="bg-blue-500 hover:bg-blue-400 transition-all duration-300" style={{ width: `${project.total > 0 ? (project.inProgress / project.total) * 100 : 0}%` }} title="In Progress" />
                        <div className="bg-amber-500 hover:bg-amber-400 transition-all duration-300" style={{ width: `${project.total > 0 ? (project.review / project.total) * 100 : 0}%` }} title="Review" />
                        <div className="bg-red-500 hover:bg-red-400 transition-all duration-300" style={{ width: `${project.total > 0 ? (project.blocked / project.total) * 100 : 0}%` }} title="Blocked" />
                      </div>
                    </div>

                    {/* Status chips */}
                    <div className="flex flex-wrap gap-2">
                       {/* Only show chips if > 0 */}
                       {[
                         { count: project.completed, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Done' },
                         { count: project.inProgress, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'In Progress' },
                         { count: project.review, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Review' },
                         { count: project.overdue, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Overdue' }
                       ].filter(i => i.count > 0).map(chip => (
                         <span key={chip.label} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${chip.color}`}>
                           {chip.count} {chip.label}
                         </span>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Task Details - Span 1 col */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
              Latest Tasks
            </h3>
            
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 -mr-2 space-y-3 custom-scrollbar">
              {filteredTasks.slice(0, 10).map((task, i) => {
                const sc = statusConfig[task.status] || statusConfig['todo'];
                const project = projects.find(p => p._id === (task.project?._id || task.project));
                return (
                  <div key={task._id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0`} style={{ backgroundColor: sc.color }} />
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-gray-900 dark:text-white truncate mb-1">{task.title}</p>
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
                             {project?.name || 'No Project'}
                           </span>
                           {task.priority === 'urgent' && <span className="text-[10px] font-bold text-red-500">Urgent</span>}
                         </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {filteredTasks.length > 10 && (
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                 <Link to="/dashboard" className="text-xs font-bold text-primary-600 hover:text-primary-500">View All Tasks →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
