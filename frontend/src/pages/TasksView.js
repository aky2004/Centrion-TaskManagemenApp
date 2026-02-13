import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { taskAPI, projectAPI } from '../services/api';
import {
  ListBulletIcon, Squares2X2Icon, CalendarDaysIcon, ChartBarIcon,
  PhotoIcon, FunnelIcon, ArrowsUpDownIcon, ChevronDownIcon,
  XMarkIcon, PlusIcon, ArrowLeftIcon, SunIcon, MoonIcon,
  CheckCircleIcon, ClockIcon, ExclamationTriangleIcon,
  BookmarkIcon, TrashIcon, ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import NotificationsPopover from '../components/NotificationsPopover';
import TaskModal from '../components/TaskModal';
import { BellIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import '../styles/TasksView.css';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-400', dot: 'bg-gray-400' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-500', dot: 'bg-blue-500' },
  { value: 'review', label: 'Review', color: 'bg-amber-500', dot: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500', dot: 'bg-red-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  { value: 'high', label: 'High', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  { value: 'low', label: 'Low', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'dueDate-asc', label: 'Due Date (Earliest)' },
  { value: 'dueDate-desc', label: 'Due Date (Latest)' },
  { value: 'priority-desc', label: 'Priority (High → Low)' },
  { value: 'priority-asc', label: 'Priority (Low → High)' },
  { value: 'title-asc', label: 'Alphabetical (A-Z)' },
  { value: 'title-desc', label: 'Alphabetical (Z-A)' },
];

const GROUP_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'project', label: 'By Project' },
  { value: 'status', label: 'By Status' },
  { value: 'priority', label: 'By Priority' },
  { value: 'assignee', label: 'By Assignee' },
];

const VIEW_MODES = [
  { id: 'list', label: 'List', icon: ListBulletIcon },
  { id: 'kanban', label: 'Kanban', icon: Squares2X2Icon },
  { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
  { id: 'timeline', label: 'Timeline', icon: ChartBarIcon },
  { id: 'gallery', label: 'Gallery', icon: PhotoIcon },
];

const PRIORITY_ORDER = { urgent: 4, high: 3, medium: 2, low: 1 };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const TasksView = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Filters
  const [filters, setFilters] = useState({ status: [], priority: [], project: [], dueDateRange: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [groupBy, setGroupBy] = useState('none');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  // Filter presets
  const [savedPresets, setSavedPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('taskFilterPresets') || '[]'); } catch { return []; }
  });
  const [presetName, setPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);

  // Calendar
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, projectRes] = await Promise.all([taskAPI.getTasks(), projectAPI.getProjects()]);
      setTasks(taskRes.data.tasks || []);
      setProjects(projectRes.data.projects || []);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter(v => v !== value) : [...prev[type], value],
    }));
  };

  const clearFilters = () => setFilters({ status: [], priority: [], project: [], dueDateRange: '' });

  const activeFilterCount = filters.status.length + filters.priority.length + filters.project.length + (filters.dueDateRange ? 1 : 0);

  // Filtered + Sorted tasks
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    if (filters.status.length) result = result.filter(t => filters.status.includes(t.status));
    if (filters.priority.length) result = result.filter(t => filters.priority.includes(t.priority));
    if (filters.project.length) {
      result = result.filter(t => {
        const pid = typeof t.project === 'object' ? t.project?._id : t.project;
        return filters.project.includes(pid);
      });
    }
    if (filters.dueDateRange) {
      const now = new Date();
      result = result.filter(t => {
        if (!t.dueDate) return filters.dueDateRange === 'none';
        const due = new Date(t.dueDate);
        switch (filters.dueDateRange) {
          case 'overdue': return due < now && t.status !== 'completed';
          case 'today': return due.toDateString() === now.toDateString();
          case 'week': { const end = new Date(now); end.setDate(end.getDate() + 7); return due >= now && due <= end; }
          case 'month': { const end = new Date(now); end.setMonth(end.getMonth() + 1); return due >= now && due <= end; }
          case 'none': return !t.dueDate;
          default: return true;
        }
      });
    }

    // Sort
    const [field, dir] = sortBy.split('-');
    result.sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case 'title': cmp = (a.title || '').localeCompare(b.title || ''); break;
        case 'priority': cmp = (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0); break;
        case 'dueDate': cmp = (new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999')); break;
        default: cmp = new Date(a.createdAt) - new Date(b.createdAt);
      }
      return dir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [tasks, filters, sortBy]);

  // Grouped tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') return { 'All Tasks': processedTasks };
    const map = {};
    processedTasks.forEach(t => {
      let key;
      switch (groupBy) {
        case 'status': key = STATUS_OPTIONS.find(s => s.value === t.status)?.label || t.status; break;
        case 'priority': key = PRIORITY_OPTIONS.find(p => p.value === t.priority)?.label || t.priority; break;
        case 'project': {
          const pid = typeof t.project === 'object' ? t.project?._id : t.project;
          key = projects.find(p => p._id === pid)?.name || 'Unknown Project'; break;
        }
        case 'assignee': key = t.assignees?.length > 0 ? 'Assigned' : 'Unassigned'; break;
        default: key = 'All';
      }
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [processedTasks, groupBy, projects]);

  const getProjectName = (t) => {
    const pid = typeof t.project === 'object' ? t.project?._id : t.project;
    return projects.find(p => p._id === pid)?.name || '';
  };
  const getProjectColor = (t) => {
    const pid = typeof t.project === 'object' ? t.project?._id : t.project;
    return projects.find(p => p._id === pid)?.color || '#6366F1';
  };
  const getStatusDot = (s) => STATUS_OPTIONS.find(o => o.value === s)?.dot || 'bg-gray-400';
  const getStatusLabel = (s) => STATUS_OPTIONS.find(o => o.value === s)?.label || s;
  const getPriorityBg = (p) => PRIORITY_OPTIONS.find(o => o.value === p)?.bg || '';

  const savePreset = () => {
    if (!presetName.trim()) return;
    const preset = { name: presetName.trim(), filters: { ...filters }, sortBy, groupBy, id: Date.now() };
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem('taskFilterPresets', JSON.stringify(updated));
    setPresetName('');
    setShowPresetSave(false);
    toast.success('Filter preset saved!');
  };

  const loadPreset = (preset) => {
    setFilters(preset.filters);
    setSortBy(preset.sortBy);
    setGroupBy(preset.groupBy);
    toast.success(`Loaded "${preset.name}"`);
  };

  const deletePreset = (id) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('taskFilterPresets', JSON.stringify(updated));
  };

  // === RENDER HELPERS ===
  const TaskRow = ({ task }) => (
    <div className="tasks-view-list-row group">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusDot(task.status)}`} />
      <div className="flex-1 min-w-0">
        <p className="tasks-view-list-title">{task.title}</p>
        <p className="tasks-view-list-subtitle">{getProjectName(task)}</p>
      </div>
      <span className={`tasks-view-list-priority ${getPriorityBg(task.priority)}`}>
        {task.priority}
      </span>
      <span className="tasks-view-list-status">{getStatusLabel(task.status)}</span>
      <span className="tasks-view-list-date">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
      </span>
      <button onClick={() => setSelectedTask(task)} className="tasks-view-list-action">
        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );

  const KanbanColumn = ({ status, tasks: colTasks }) => (
    <div className="tasks-view-kanban-column">
      <div className="tasks-view-kanban-header">
        <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{status.label}</span>
        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full font-bold">{colTasks.length}</span>
      </div>
      <div className="space-y-2">
        {colTasks.map(task => (
          <div key={task._id} onClick={() => setSelectedTask(task)}
            className="tasks-view-kanban-card">
            <p className="tasks-view-kanban-card-title">{task.title}</p>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityBg(task.priority)}`}>{task.priority}</span>
              {task.dueDate && <span className="text-[10px] text-gray-400">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </div>
            <p className="tasks-view-kanban-card-project">{getProjectName(task)}</p>
          </div>
        ))}
        {colTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No tasks</p>}
      </div>
    </div>
  );

  // Calendar helpers
  const calYear = calendarDate.getFullYear(), calMonth = calendarDate.getMonth();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calTotalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const calTasksByDate = useMemo(() => {
    const map = {};
    processedTasks.forEach(t => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [processedTasks]);

  // Timeline helpers
  const timelineTasks = useMemo(() => {
    return processedTasks.filter(t => t.dueDate || t.startDate).sort((a, b) => new Date(a.startDate || a.dueDate) - new Date(b.startDate || b.dueDate));
  }, [processedTasks]);

  const timelineRange = useMemo(() => {
    if (!timelineTasks.length) return { start: new Date(), end: new Date(), days: 30 };
    const dates = timelineTasks.flatMap(t => [t.startDate, t.dueDate].filter(Boolean).map(d => new Date(d)));
    const min = new Date(Math.min(...dates)); min.setDate(min.getDate() - 2);
    const max = new Date(Math.max(...dates)); max.setDate(max.getDate() + 5);
    return { start: min, end: max, days: Math.max(14, Math.ceil((max - min) / (1000 * 60 * 60 * 24))) };
  }, [timelineTasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative"><div className="w-14 h-14 rounded-full border-[3px] border-gray-200 dark:border-gray-700" /><div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-t-primary-500 animate-spin" /></div>
          <p className="text-sm text-gray-400 animate-pulse">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-view-page">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="tasks-view-bg-blob-1" style={{ animationDuration: '4s' }} />
        <div className="tasks-view-bg-blob-2" style={{ animationDuration: '5s' }} />
      </div>

      {/* Nav */}
      <nav className="tasks-view-nav">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"><ArrowLeftIcon className="w-5 h-5" /></Link>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Tasks</span>
              <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-bold">{processedTasks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"><BellIcon className="w-5 h-5" /></button>
                {showNotifications && <NotificationsPopover onClose={() => setShowNotifications(false)} />}
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button onClick={logout} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"><ArrowRightOnRectangleIcon className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-6 relative z-10">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* View Switcher */}
          <div className="tasks-view-switcher">
            {VIEW_MODES.map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`tasks-view-switcher-btn ${
                  viewMode === v.id ? 'tasks-view-switcher-btn-active' : 'tasks-view-switcher-btn-inactive'
                }`}>
                <v.icon className="w-4 h-4" /> <span className="hidden md:inline">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* New Task Button */}
            <Link to="/tasks/new" className="tasks-view-action-btn tasks-view-btn-primary">
              <PlusIcon className="w-4 h-4" /> New Task
            </Link>

            {/* Filter Button */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`tasks-view-action-btn ${
                activeFilterCount > 0 ? 'tasks-view-btn-active' : 'tasks-view-btn-secondary'
              }`}>
              <FunnelIcon className="w-4 h-4" /> Filter {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">{activeFilterCount}</span>}
            </button>

            {/* Sort */}
            <div className="relative">
              <button onClick={() => { setShowSortMenu(!showSortMenu); setShowGroupMenu(false); }}
                className="tasks-view-action-btn tasks-view-btn-secondary">
                <ArrowsUpDownIcon className="w-4 h-4" /> Sort <ChevronDownIcon className="w-3 h-3" />
              </button>
              {showSortMenu && (
                <><div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <div className="tasks-view-dropdown-menu">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setSortBy(o.value); setShowSortMenu(false); }}
                      className={`tasks-view-dropdown-item ${sortBy === o.value ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      {o.label}
                    </button>
                  ))}
                </div></>
              )}
            </div>

            {/* Group */}
            <div className="relative">
              <button onClick={() => { setShowGroupMenu(!showGroupMenu); setShowSortMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-all">
                <Squares2X2Icon className="w-4 h-4" /> Group <ChevronDownIcon className="w-3 h-3" />
              </button>
              {showGroupMenu && (
                <><div className="fixed inset-0 z-40" onClick={() => setShowGroupMenu(false)} />
                <div className="tasks-view-dropdown-menu">
                  {GROUP_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setGroupBy(o.value); setShowGroupMenu(false); }}
                      className={`tasks-view-dropdown-item ${groupBy === o.value ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      {o.label}
                    </button>
                  ))}
                </div></>
              )}
            </div>

            {/* Save Preset */}
            {activeFilterCount > 0 && (
              <button onClick={() => setShowPresetSave(true)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <BookmarkIcon className="w-4 h-4" /> Save
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="tasks-view-filter-panel animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear All</button>}
                <button onClick={() => setShowFilters(false)}><XMarkIcon className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div>
                <p className="tasks-view-filter-label">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => toggleFilter('status', s.value)}
                      className={`tasks-view-filter-tag ${
                        filters.status.includes(s.value) ? 'tasks-view-filter-tag-active' : 'tasks-view-filter-tag-inactive'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} /> {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Priority */}
              <div>
                <p className="tasks-view-filter-label">Priority</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITY_OPTIONS.map(p => (
                    <button key={p.value} onClick={() => toggleFilter('priority', p.value)}
                      className={`tasks-view-filter-tag ${
                        filters.priority.includes(p.value) ? 'tasks-view-filter-tag-active' : 'tasks-view-filter-tag-inactive'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Project */}
              <div>
                <p className="tasks-view-filter-label">Project</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {projects.map(p => (
                    <button key={p._id} onClick={() => toggleFilter('project', p._id)}
                      className={`tasks-view-filter-tag truncate max-w-[140px] ${
                        filters.project.includes(p._id) ? 'tasks-view-filter-tag-active' : 'tasks-view-filter-tag-inactive'
                      }`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Due Date */}
              <div>
                <p className="tasks-view-filter-label">Due Date</p>
                <div className="flex flex-wrap gap-1.5">
                  {[{ v: 'overdue', l: 'Overdue' }, { v: 'today', l: 'Today' }, { v: 'week', l: 'This Week' }, { v: 'month', l: 'This Month' }, { v: 'none', l: 'No Due Date' }].map(d => (
                    <button key={d.v} onClick={() => setFilters(prev => ({ ...prev, dueDateRange: prev.dueDateRange === d.v ? '' : d.v }))}
                      className={`tasks-view-filter-tag ${
                        filters.dueDateRange === d.v ? 'tasks-view-filter-tag-active' : 'tasks-view-filter-tag-inactive'
                      }`}>
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved Presets */}
            {savedPresets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="tasks-view-filter-label">Saved Presets</p>
                <div className="flex flex-wrap gap-2">
                  {savedPresets.map(p => (
                    <div key={p.id} className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg overflow-hidden">
                      <button onClick={() => loadPreset(p)} className="px-3 py-1.5 text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">{p.name}</button>
                      <button onClick={() => deletePreset(p.id)} className="px-1.5 py-1.5 text-primary-400 hover:text-red-500 transition-colors"><XMarkIcon className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Preset Modal */}
        {showPresetSave && (
          <><div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setShowPresetSave(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="tasks-view-preset-modal">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Save Filter Preset</h3>
              <input autoFocus value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name..." className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:border-primary-500 mb-4" onKeyDown={e => e.key === 'Enter' && savePreset()} />
              <div className="flex gap-2">
                <button onClick={() => setShowPresetSave(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm">Cancel</button>
                <button onClick={savePreset} disabled={!presetName.trim()} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm disabled:opacity-50">Save</button>
              </div>
            </div>
          </div></>
        )}

        {/* ═══ VIEW CONTENT ═══ */}
        {viewMode === 'list' && (
          <div>
            {Object.entries(groupedTasks).map(([group, gTasks]) => (
              <div key={group} className="mb-6">
                {groupBy !== 'none' && (
                  <div className="tasks-view-group-header">
                    <h3 className="tasks-view-group-title">{group}</h3>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">{gTasks.length}</span>
                  </div>
                )}
                <div className="tasks-view-list-container">
                  {gTasks.length === 0 ? <p className="p-8 text-center text-sm text-gray-400">No tasks match filters</p> : gTasks.map(t => <TaskRow key={t._id} task={t} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_OPTIONS.map(s => (
              <KanbanColumn key={s.value} status={s} tasks={processedTasks.filter(t => t.status === s.value)} />
            ))}
          </div>
        )}

        {viewMode === 'calendar' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{MONTHS[calMonth]} {calYear}</h2>
              <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"><ChevronDownIcon className="w-4 h-4 text-gray-500 rotate-90" /></button>
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"><ChevronDownIcon className="w-4 h-4 text-gray-500 -rotate-90" /></button>
              </div>
              <button onClick={() => setCalendarDate(new Date())} className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">Today</button>
            </div>
            <div className="tasks-view-calendar-container">
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {DAYS.map(d => <div key={d} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700/30">
                {Array(calFirstDay).fill(null).map((_, i) => <div key={`e-${i}`} className="min-h-[110px] bg-gray-50/30 dark:bg-gray-900/30" />)}
                {Array.from({ length: calTotalDays }, (_, i) => i + 1).map(day => {
                  const key = `${calYear}-${calMonth}-${day}`;
                  const dayTasks = calTasksByDate[key] || [];
                  const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
                  return (
                    <div key={day} className="min-h-[110px] p-1.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-md mb-1 ${isToday ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}>{day}</span>
                      {dayTasks.slice(0, 3).map((t, j) => (
                        <div key={`${t._id}-${j}`} className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate mb-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(t.status)}`} />
                          <span className="truncate text-gray-700 dark:text-gray-300 font-medium">{t.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && <p className="text-[9px] text-gray-400 pl-1 font-bold">+{dayTasks.length - 3} more</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {timelineTasks.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">No tasks with dates to display. Add start dates and due dates to see the timeline.</div>
            ) : (
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <div className="w-56 flex-shrink-0 p-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Task</div>
                  <div className="flex-1 flex">
                    {Array.from({ length: Math.min(timelineRange.days, 60) }, (_, i) => {
                      const d = new Date(timelineRange.start); d.setDate(d.getDate() + i);
                      const isToday = d.toDateString() === new Date().toDateString();
                      return <div key={i} className={`flex-1 min-w-[30px] p-1 text-center text-[9px] font-bold border-r border-gray-100 dark:border-gray-700/50 ${isToday ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-400'}`}>{d.getDate()}</div>;
                    })}
                  </div>
                </div>
                {/* Rows */}
                {timelineTasks.map(task => {
                  const start = new Date(task.startDate || task.dueDate);
                  const end = new Date(task.dueDate || task.startDate);
                  const startOffset = Math.max(0, (start - timelineRange.start) / (1000 * 60 * 60 * 24));
                  const duration = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1);
                  const totalDays = Math.min(timelineRange.days, 60);
                  return (
                    <div key={task._id} className="tasks-view-timeline-row">
                      <div className="w-56 flex-shrink-0 p-3 border-r border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{task.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{getProjectName(task)}</p>
                      </div>
                      <div className="flex-1 relative" style={{ minHeight: '40px' }}>
                        <div className={`absolute top-2 h-6 rounded-full flex items-center px-2 text-[9px] font-bold text-white shadow-sm ${
                          task.status === 'completed' ? 'bg-emerald-500' : task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : 'bg-primary-500'
                        }`} style={{
                          left: `${(startOffset / totalDays) * 100}%`,
                          width: `${Math.max(2, (duration / totalDays) * 100)}%`,
                          minWidth: '24px'
                        }}>
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'gallery' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {processedTasks.map(task => (
              <div key={task._id} onClick={() => setSelectedTask(task)}
                className="tasks-view-gallery-card group">
                <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${getProjectColor(task)}66, ${getProjectColor(task)}33)` }}>
                  <div className="h-full flex items-center justify-center">
                    <span className="text-3xl font-black text-white/30">{task.title?.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusDot(task.status)}`} />
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getPriorityBg(task.priority)}`}>{task.priority}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">{task.title}</h3>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mb-3">{task.description || 'No description'}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="truncate max-w-[100px]">{getProjectName(task)}</span>
                    {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                </div>
              </div>
            ))}
            {processedTasks.length === 0 && (
              <div className="col-span-full p-12 text-center text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">No tasks match your filters</div>
            )}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
            setSelectedTask(updatedTask);
          }}
          onDelete={(taskId) => {
             setTasks(prev => prev.filter(t => t._id !== taskId));
             setSelectedTask(null);
             toast.success('Task deleted');
          }}
        />
      )}
    </div>
  );
};

export default TasksView;
