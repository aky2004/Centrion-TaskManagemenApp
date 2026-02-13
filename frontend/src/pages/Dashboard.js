import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationsPopover from '../components/NotificationsPopover';
import { projectAPI, taskAPI, workspaceAPI } from '../services/api';
import {
  PlusIcon,
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ChevronRightIcon,

  BellIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  PencilSquareIcon,

  TableCellsIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';


import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null); // null = "All Workspaces"
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [workspaceMenu, setWorkspaceMenu] = useState(null);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectRes, taskRes, workspaceRes] = await Promise.all([
        projectAPI.getProjects(),
        taskAPI.getTasks(),
        workspaceAPI.getWorkspaces(),
      ]);
      setProjects(projectRes.data.projects || []);
      setAllTasks(taskRes.data.tasks || []);
      setWorkspaces(workspaceRes.data.workspaces || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Filter projects by active workspace
  const filteredProjects = useMemo(() => {
    let result = projects;
    if (activeWorkspace) {
      result = result.filter(p => {
        const pwId = typeof p.workspace === 'object' ? p.workspace?._id : p.workspace;
        return pwId === activeWorkspace._id;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [projects, activeWorkspace, searchQuery]);

  // Filter tasks by active workspace's projects
  const filteredTasks = useMemo(() => {
    if (!activeWorkspace) return allTasks;
    const projectIds = new Set(filteredProjects.map(p => p._id));
    return allTasks.filter(t => {
      const pid = typeof t.project === 'object' ? t.project?._id : t.project;
      return projectIds.has(pid);
    });
  }, [allTasks, activeWorkspace, filteredProjects]);

  // Compute stats from filtered tasks
  const stats = useMemo(() => {
    const tasks = filteredTasks;
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress' || t.status === 'In Progress').length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'Completed';
    }).length;
    const total = tasks.length;
    return { total, completed, inProgress, overdue };
  }, [filteredTasks]);

  // Compute per-project metrics
  const projectMetrics = useMemo(() => {
    const map = {};
    filteredProjects.forEach(p => {
      map[p._id] = { total: 0, completed: 0, inProgress: 0, overdue: 0 };
    });
    filteredTasks.forEach(task => {
      const pid = typeof task.project === 'object' ? task.project?._id : task.project;
      if (pid && map[pid]) {
        map[pid].total++;
        if (task.status === 'completed' || task.status === 'Completed') map[pid].completed++;
        if (task.status === 'in-progress' || task.status === 'In Progress') map[pid].inProgress++;
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'Completed') {
          map[pid].overdue++;
        }
      }
    });
    return map;
  }, [filteredProjects, filteredTasks]);

  // Recent tasks
  const recentTasks = useMemo(() => {
    return [...filteredTasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  }, [filteredTasks]);

  // Search results across workspaces
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { workspaces: [], projects: [], tasks: [] };
    const q = searchQuery.toLowerCase();
    return {
      workspaces: workspaces.filter(w => w.name?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q)),
      projects: projects.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)),
      tasks: allTasks.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)),
    };
  }, [searchQuery, workspaces, projects, allTasks]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': case 'Completed': return 'bg-emerald-500';
      case 'in-progress': case 'In Progress': return 'bg-blue-500';
      case 'review': case 'Review': return 'bg-amber-500';
      case 'blocked': case 'Blocked': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      setCreatingWorkspace(true);
      const res = await workspaceAPI.createWorkspace({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDesc.trim(),
      });
      const newWs = res.data.workspace;
      setWorkspaces(prev => [newWs, ...prev]);
      setActiveWorkspace(newWs);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      setShowCreateWorkspace(false);
      toast.success(`Workspace "${newWs.name}" created!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create workspace');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async (ws) => {
    if (!window.confirm(`Delete workspace "${ws.name}"? This cannot be undone.`)) return;
    try {
      await workspaceAPI.deleteWorkspace(ws._id);
      setWorkspaces(prev => prev.filter(w => w._id !== ws._id));
      if (activeWorkspace?._id === ws._id) setActiveWorkspace(null);
      setWorkspaceMenu(null);
      toast.success('Workspace deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    }
  };

  const handleRenameWorkspace = async (ws) => {
    if (!editName.trim() || editName.trim() === ws.name) {
      setEditingWorkspace(null);
      return;
    }
    try {
      const res = await workspaceAPI.updateWorkspace(ws._id, { name: editName.trim() });
      setWorkspaces(prev => prev.map(w => w._id === ws._id ? (res.data.workspace || { ...w, name: editName.trim() }) : w));
      if (activeWorkspace?._id === ws._id) {
        setActiveWorkspace(prev => ({ ...prev, name: editName.trim() }));
      }
      setEditingWorkspace(null);
      toast.success('Workspace renamed');
    } catch (error) {
      toast.error('Failed to rename workspace');
    }
  };

  const wsColors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6'];
  const getWsColor = (index) => wsColors[index % wsColors.length];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-t-primary-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
       {/* Decorative background blobs */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="dashboard-bg-blob-1" style={{ animationDuration: '4s' }} />
        <div className="dashboard-bg-blob-2" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="dashboard-logo-container group">
              <div className="dashboard-logo-icon">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="dashboard-title">
                Centrion
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1 mx-6">
              <Link to="/tasks" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                <TableCellsIcon className="w-4 h-4" /> Tasks
              </Link>
              <Link to="/calendar" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4" /> Calendar
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workspaces, projects, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="dashboard-search-input"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
                {/* Search Dropdown */}
                {showSearch && searchQuery.trim() && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                    {searchResults.workspaces.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-xs text-gray-400 uppercase font-semibold tracking-wider bg-gray-50 dark:bg-gray-800/50">Workspaces</p>
                        {searchResults.workspaces.map(ws => (
                          <button key={ws._id} onClick={() => { setActiveWorkspace(ws); setSearchQuery(''); setShowSearch(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                            <Squares2X2Icon className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{ws.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.projects.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-xs text-gray-400 uppercase font-semibold tracking-wider bg-gray-50 dark:bg-gray-800/50">Projects</p>
                        {searchResults.projects.map(p => (
                          <Link key={p._id} to={`/projects/${p._id}`} onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <FolderIcon className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.tasks.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-xs text-gray-400 uppercase font-semibold tracking-wider bg-gray-50 dark:bg-gray-800/50">Tasks</p>
                        {searchResults.tasks.slice(0, 5).map(t => (
                          <div key={t._id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(t.status)}`} />
                            <span className="text-sm text-gray-900 dark:text-white">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.workspaces.length === 0 && searchResults.projects.length === 0 && searchResults.tasks.length === 0 && (
                      <div className="p-6 text-center text-sm text-gray-400">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/profile" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name}
                </span>
              </Link>

              <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors relative"
                 >
                    <BellIcon className="w-5 h-5" />
                 </button>
                 {showNotifications && <NotificationsPopover onClose={() => setShowNotifications(false)} />}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close search */}
      {showSearch && <div className="fixed inset-0 z-20" onClick={() => setShowSearch(false)} />}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Hero Section */}
        <div className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 animate-fade-in-up">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
              Welcome back,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 animate-gradient">
                {user?.name?.split(' ')[0]}
              </span>
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {activeWorkspace 
                ? <>Viewing <span className="font-semibold text-primary-600 dark:text-primary-400">{activeWorkspace.name}</span> workspace &middot; {stats.total - stats.completed} pending tasks</>
                : <>You have <span className="font-bold text-gray-900 dark:text-white">{stats.total - stats.completed} pending tasks</span> across all workspaces</>
              }
            </p>
          </div>
          
          <div className="flex gap-3">
             <Link to="/tasks/new" className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
               <PlusIcon className="w-4 h-4" /> New Task
             </Link>
             <Link to="/projects/new" className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 text-sm">
               <FolderIcon className="w-4 h-4" /> New Project
             </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* WORKSPACE SECTION */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Squares2X2Icon className="w-5 h-5 text-primary-500" />
              Workspaces
            </h2>
            <button
              onClick={() => setShowCreateWorkspace(true)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              <PlusIcon className="w-4 h-4" /> New Workspace
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* "All" pill */}
            <button
              onClick={() => setActiveWorkspace(null)}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 border ${
                !activeWorkspace
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg shadow-gray-900/20 dark:shadow-white/10'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All Workspaces
            </button>

            {workspaces.map((ws, idx) => (
              <div key={ws._id} className="relative flex-shrink-0 group">
                {editingWorkspace === ws._id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleRenameWorkspace(ws); }} className="flex items-center">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRenameWorkspace(ws)}
                      className="px-5 py-3 rounded-2xl text-sm font-semibold bg-white dark:bg-gray-800 border-2 border-primary-500 outline-none text-gray-900 dark:text-white w-40"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setActiveWorkspace(activeWorkspace?._id === ws._id ? null : ws)}
                    className={`px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 border flex items-center gap-2.5 ${
                      activeWorkspace?._id === ws._id
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg shadow-gray-900/20 dark:shadow-white/10'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: getWsColor(idx) }} 
                    />
                    {ws.name}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeWorkspace?._id === ws._id 
                        ? 'bg-white/20 dark:bg-gray-900/20' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {projects.filter(p => {
                        const pwId = typeof p.workspace === 'object' ? p.workspace?._id : p.workspace;
                        return pwId === ws._id;
                      }).length}
                    </span>
                  </button>
                )}
                
                {/* Workspace context menu */}
                <button
                  onClick={(e) => { e.stopPropagation(); setWorkspaceMenu(workspaceMenu === ws._id ? null : ws._id); }}
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${workspaceMenu === ws._id ? '!opacity-100' : ''}`}
                >
                  <EllipsisHorizontalIcon className="w-3 h-3 text-gray-500" />
                </button>
                
                {workspaceMenu === ws._id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setWorkspaceMenu(null)} />
                    <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                      <button
                        onClick={() => { setEditingWorkspace(ws._id); setEditName(ws.name); setWorkspaceMenu(null); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" /> Rename
                      </button>
                      {ws.owner?._id === user?._id || ws.owner === user?._id ? (
                        <button
                          onClick={() => handleDeleteWorkspace(ws)}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" /> Delete
                        </button>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            ))}

            {workspaces.length === 0 && (
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="flex-shrink-0 px-5 py-3 rounded-2xl font-semibold text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-primary-500 hover:border-primary-400 transition-all flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Create your first workspace
              </button>
            )}
          </div>
        </div>

        {/* Create Workspace Modal */}
        {showCreateWorkspace && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateWorkspace(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Workspace</h3>
                  <button onClick={() => setShowCreateWorkspace(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <form onSubmit={handleCreateWorkspace}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Workspace Name *</label>
                    <input
                      autoFocus
                      type="text"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="e.g., Engineering Team"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newWorkspaceDesc}
                      onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                      placeholder="What's this workspace for?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateWorkspace(false)}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingWorkspace || !newWorkspaceName.trim()}
                      className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20"
                    >
                      {creatingWorkspace ? 'Creating...' : 'Create Workspace'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Stats Row */}
        <div className="dashboard-stats-grid animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {[
            { label: 'Total Tasks', value: stats.total, icon: RocketLaunchIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'In Progress', value: stats.inProgress, icon: ArrowTrendingUpIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Completed', value: stats.completed, icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Overdue', value: stats.overdue, icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className="stat-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {activeWorkspace ? `Projects in ${activeWorkspace.name}` : 'Your Projects'}
            </h2>
            <Link to="/projects/new" className="text-primary-600 font-medium hover:underline text-sm">Create New +</Link>
          </div>
          
          {filteredProjects.length === 0 ? (
             <div className="p-10 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 text-center">
               <FolderIcon className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                 {activeWorkspace ? `No projects in ${activeWorkspace.name}` : 'No projects yet'}
               </h3>
               <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">
                 {activeWorkspace ? 'Create a project in this workspace to get started.' : 'Create your first project to get started.'}
               </p>
               <Link to="/projects/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-colors">
                 Create Project
               </Link>
             </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map(project => {
                 const m = projectMetrics[project._id] || { total: 0, completed: 0 };
                 const progress = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                 return (
                  <Link 
                    key={project._id} 
                    to={`/projects/${project._id}`}
                    className="group p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg"
                        style={{ backgroundColor: project.color || '#6366F1' }}
                      >
                        {project.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 h-8 line-clamp-2 text-sm mb-5">{project.description || 'No description'}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <ClockIcon className="w-4 h-4" /> {m.total} Tasks
                      </span>
                      <span className={`flex items-center gap-1.5 font-bold ${progress === 100 ? 'text-emerald-500' : 'text-primary-500'}`}>
                        <ChartBarIcon className="w-4 h-4" /> {progress}% Done
                      </span>
                    </div>
                    
                    <div className="mt-3 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                         style={{ width: `${progress}%`, backgroundColor: project.color || '#6366F1' }} 
                       />
                    </div>
                  </Link>
                 );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
             {recentTasks.length === 0 ? (
               <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No recent activity</div>
             ) : (
               <div className="divide-y divide-gray-100 dark:divide-gray-700">
                 {recentTasks.map(task => (
                   <div key={task._id} className="p-5 flex items-center gap-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                     <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(task.status)}`} />
                     <div className="flex-1 min-w-0">
                       <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{task.title}</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{task.description || 'No details'}</p>
                     </div>
                     <div className="hidden sm:block text-right">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                         task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                         task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                         'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                       }`}>
                         {task.priority || 'Medium'}
                       </span>
                     </div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                       {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Just now'}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="quick-actions-grid">
             <button
               onClick={() => setShowCreateWorkspace(true)}
               className="quick-action-card"
             >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                  <Squares2X2Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">New Workspace</span>
             </button>

             <Link to="/tasks/new" className="quick-action-card">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <PlusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">New Task</span>
             </Link>
             
             <Link to="/projects/new" className="quick-action-card">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                  <FolderIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">New Project</span>
             </Link>

             <Link to="/tasks" className="quick-action-card">
                <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center group-hover:bg-pink-100 dark:group-hover:bg-pink-900/40 transition-colors">
                  <TableCellsIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">All Tasks</span>
             </Link>

             <Link to="/calendar" className="quick-action-card">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                  <CalendarDaysIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">Calendar</span>
             </Link>

             <Link to="/analytics" className="quick-action-card">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                  <ChartBarIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">Analytics</span>
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;