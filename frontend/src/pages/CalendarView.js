import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { taskAPI, projectAPI } from '../services/api';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  FlagIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const statusConfig = {
  'todo': { label: 'To Do', color: 'bg-gray-400', textColor: 'text-gray-600 dark:text-gray-400', dotColor: 'bg-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  'review': { label: 'In Review', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  'completed': { label: 'Completed', color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400', dotColor: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  'blocked': { label: 'Blocked', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
};

const priorityConfig = {
  'urgent': { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  'high': { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  'medium': { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  'low': { label: 'Low', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
};

const CalendarView = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = {};
    const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

    filteredTasks.forEach(task => {
      // Add task to its due date
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push({ ...task, dateType: 'due' });
      }
      // Add task to its start date
      if (task.startDate) {
        const d = new Date(task.startDate);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        // Avoid duplicate if same day
        if (!task.dueDate || new Date(task.dueDate).toDateString() !== d.toDateString()) {
          map[key].push({ ...task, dateType: 'start' });
        }
      }
      // Add task to its completed date
      if (task.completedAt) {
        const d = new Date(task.completedAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        const dueSame = task.dueDate && new Date(task.dueDate).toDateString() === d.toDateString();
        const startSame = task.startDate && new Date(task.startDate).toDateString() === d.toDateString();
        if (!dueSame && !startSame) {
          map[key].push({ ...task, dateType: 'completed' });
        }
      }
    });
    return map;
  }, [tasks, filterStatus]);

  // Get tasks for a date cell
  const getTasksForDate = (day) => {
    const key = `${year}-${month}-${day}`;
    return tasksByDate[key] || [];
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getProjectColor = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project?.color || '#6B7280';
  };

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isPast = (day) => {
    const date = new Date(year, month, day);
    return date < today;
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  // Calendar cells
  const cells = [];
  // Empty cells for padding
  for (let i = 0; i < startPad; i++) {
    cells.push(null);
  }
  // Day cells
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-t-primary-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading calendar...</p>
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
                Calendar
              </span>
            </div>

            <div className="flex items-center gap-4">
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar main area */}
          <div className="flex-1">
            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {MONTHS[month]} {year}
                </h1>
                <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                   <button onClick={prevMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                    <ChevronRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 text-sm font-medium border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-sm transition-shadow"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                {DAYS.map(day => (
                  <div key={day} className="py-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-700/30 gap-px">
                {cells.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="min-h-[140px] bg-gray-50/30 dark:bg-gray-900/30" />;
                  }

                  const dayTasks = getTasksForDate(day);
                  const todayClass = isToday(day);
                  const isSelected = selectedDate === day;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`min-h-[140px] p-2 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-900
                        ${isSelected ? 'ring-2 ring-inset ring-primary-500 z-10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-all
                            ${todayClass 
                              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                              : isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          {day}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task, idx) => {
                          const config = statusConfig[task.status] || statusConfig['todo'];
                          return (
                            <div
                              key={`${task._id}-${idx}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                              className={`group px-2 py-1 rounded-lg text-[11px] truncate cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700
                                ${config.bgColor.replace('bg-', 'bg-opacity-50 ')}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
                                <span className={`truncate font-medium ${config.textColor}`}>
                                  {task.title}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {dayTasks.length > 3 && (
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 pl-2 font-bold">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Mobile Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 lg:hidden">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-96 flex-shrink-0">
            {selectedTask ? (
              /* Task detail panel */
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-28 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                    Task Detail
                  </span>
                  <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">{selectedTask.title}</h2>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{selectedTask.description}</p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  {/* Status & Priority Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Status</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[selectedTask.status]?.dotColor}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {statusConfig[selectedTask.status]?.label}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Priority</span>
                      <div className="flex items-center gap-2">
                        <FlagIcon className={`w-4 h-4 ${priorityConfig[selectedTask.priority]?.color.replace('text-', 'text-opacity-80 ')}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {priorityConfig[selectedTask.priority]?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Project</span>
                    <Link
                      to={`/projects/${selectedTask.project?._id || selectedTask.project}`}
                      className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-primary-600 transition-colors"
                    >
                      <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-800" style={{ backgroundColor: getProjectColor(selectedTask.project?._id || selectedTask.project) }} />
                      {getProjectName(selectedTask.project?._id || selectedTask.project)}
                    </Link>
                  </div>

                  {/* Dates */}
                  {selectedTask.dueDate && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 text-red-500">
                        <CalendarDaysIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70 font-bold uppercase tracking-wide">Due Date</p>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">
                          {new Date(selectedTask.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to={`/projects/${selectedTask.project?._id || selectedTask.project}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  View in Board <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </Link>
              </div>
            ) : selectedDate ? (
              /* Date detail panel */
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-28 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {MONTHS[month]} {selectedDate}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} scheduled
                    </p>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {selectedDateTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                      <CalendarDaysIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No tasks on this date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateTasks.map((task, idx) => {
                      const config = statusConfig[task.status] || statusConfig['todo'];
                      return (
                        <div
                          key={`${task._id}-${idx}`}
                          onClick={() => setSelectedTask(task)}
                          className="group p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/20 hover:bg-white dark:hover:bg-gray-700/40 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 cursor-pointer transition-all duration-300"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${config.dotColor} ring-4 ring-white dark:ring-gray-800 group-hover:ring-transparent transition-all`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>{config.label}</span>
                                {task.dateType && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                                    {task.dateType === 'due' ? 'Due' : task.dateType === 'start' ? 'Start' : 'Done'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Summary panel */
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-28">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full bg-primary-500"></span>
                  Overview
                </h3>

                <div className="space-y-4 mb-8">
                  {Object.entries(statusConfig).map(([key, cfg]) => {
                    const count = tasks.filter(t => t.status === key).length;
                    return (
                      <div key={key} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${cfg.dotColor} shadow-sm`} />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{cfg.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-md min-w-[32px] text-center">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Overdue */}
                {tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed').length > 0 && (
                  <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4">
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Attention Needed
                    </h4>
                    <div className="space-y-3">
                      {tasks
                        .filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed')
                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                        .slice(0, 3)
                        .map(task => (
                          <div
                            key={task._id}
                            onClick={() => setSelectedTask(task)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-all"
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{task.title}</p>
                              <p className="text-[10px] text-red-500 font-medium">
                                Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
