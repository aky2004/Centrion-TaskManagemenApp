import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { taskAPI, projectAPI, notificationAPI } from '../services/api';
import NotificationsPopover from '../components/NotificationsPopover';
import {
  PlusIcon,
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  TrashIcon,
  Cog6ToothIcon,
  XMarkIcon,
  UserPlusIcon,
  BellIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';
import '../styles/KanbanBoard.css';

// ... (keep existing constants) 
const columns = [
  { id: 'todo', status: 'todo', name: 'To Do', color: 'bg-gray-200 dark:bg-gray-700', textColor: 'text-gray-700 dark:text-gray-200' },
  { id: 'in-progress', status: 'in-progress', name: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/40', textColor: 'text-blue-700 dark:text-blue-300' },
  { id: 'review', status: 'review', name: 'Review', color: 'bg-amber-100 dark:bg-amber-900/40', textColor: 'text-amber-700 dark:text-amber-300' },
  { id: 'completed', status: 'completed', name: 'Completed', color: 'bg-emerald-100 dark:bg-emerald-900/40', textColor: 'text-emerald-700 dark:text-emerald-300' },
];

const priorityConfig = {
  urgent: { label: 'Urgent', bg: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' },
  high: { label: 'High', bg: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300' },
  medium: { label: 'Medium', bg: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300' },
  low: { label: 'Low', bg: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300' },
};

// Project Settings Modal
const ProjectSettingsModal = ({ project, onClose, onUpdate, onAddMember, onRemoveMember, onTransferOwnership, user }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');

  const getMyRole = () => {
    if (project.owner?._id === user?._id) return 'owner';
    const member = project.members?.find(m => m.user?._id === user?._id);
    return member?.role || 'viewer';
  };
  
  const myRole = getMyRole();
  const isAdmin = ['owner'].includes(myRole); // Only owner is full admin now

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onUpdate({ name, description });
      toast.success('Project updated');
    } catch (error) {
       // handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsLoading(true);
    try {
      await onAddMember(inviteEmail, inviteRole);
      setInviteEmail('');
      toast.success('Invitation sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferEmail) return;
    // Find member by email
    const member = project.members.find(m => m.user.email === transferEmail);
    if (!member) {
        toast.error('User must be a member of the project first');
        return;
    }
    if (!window.confirm(`Transfer ownership to ${transferEmail}? You will become an editor.`)) return;

    setIsLoading(true);
    try {
        await onTransferOwnership(member.user._id);
        setTransferEmail('');
        toast.success('Ownership transferred');
        onClose();
    } catch (error) {
        toast.error('Failed to transfer ownership');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="kanban-settings-overlay">
      <div className="kanban-settings-modal">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('general')}
            className={`kanban-tab-btn ${activeTab === 'general' ? 'kanban-tab-active' : 'kanban-tab-inactive'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`kanban-tab-btn ${activeTab === 'members' ? 'kanban-tab-active' : 'kanban-tab-inactive'}`}
          >
            Collaborators ({project.members?.length + 1})
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
                <form onSubmit={handleUpdateProject} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="Enter project name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isAdmin}
                    rows="4"
                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    placeholder="Enter project description"
                    />
                </div>
                {isAdmin && (
                    <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    </div>
                )}
                {!isAdmin && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl text-sm">
                    Only the Owner can edit project details.
                    </div>
                )}
                </form>

                {myRole === 'owner' && (
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                         <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Transfer Ownership</h3>
                         <form onSubmit={handleTransfer} className="flex gap-2">
                            <input
                                type="email"
                                value={transferEmail}
                                onChange={(e) => setTransferEmail(e.target.value)}
                                placeholder="Enter member email"
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                            />
                             <button
                                type="submit"
                                disabled={isLoading || !transferEmail}
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                            >
                                Transfer
                            </button>
                         </form>
                         <p className="text-xs text-gray-500 mt-2">Ownership can only be transferred to an existing project member.</p>
                    </div>
                )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              {isAdmin && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserPlusIcon className="w-4 h-4" /> Invite Collaborator
                  </h3>
                  <form onSubmit={handleInvite} className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                      Invite
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Members</h3>
                
                {/* Owner */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-gray-700">
                       {project.owner?.name?.charAt(0)}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                         {project.owner?.name} <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded">OWNER</span>
                       </p>
                       <p className="text-xs text-gray-500">{project.owner?.email}</p>
                     </div>
                   </div>
                </div>

                {/* Members */}
                {project.members?.map((member) => (
                  <div key={member.user._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-sm transition-shadow">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                         {member.user.name?.charAt(0)}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                           {member.user.name} 
                           <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ml-2 ${
                             member.role === 'editor' 
                               ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                               : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                           }`}>
                             {member.role}
                           </span>
                            {member.status === 'pending' && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 uppercase tracking-wide">
                                    Pending
                                </span>
                            )}
                         </p>
                         <p className="text-xs text-gray-500">{member.user.email}</p>
                       </div>
                     </div>
                     
                     {/* Only Owner can remove members. Owner cannot remove themselves here. */}
                     {myRole === 'owner' && (
                       <button
                         onClick={() => onRemoveMember(member.user._id)}
                         className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                         title="Remove Member"
                       >
                         <TrashIcon className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                ))}

                {project.members?.length === 0 && (
                  <p className="text-sm text-center text-gray-400 italic py-4">No other members yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Task card component - Minimal
const TaskCard = ({ task, onMoveTask, onDeleteTask, onOpenTask, columnIndex }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div 
      onClick={() => onOpenTask(task)}
      className="kanban-task-card group animate-fade-in-up"
    >
      <div className="flex justify-between items-start mb-2">
         <span className={`kanban-task-priority ${priority.bg}`}>
           {priority.label}
         </span>
         <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="kanban-task-menu-btn"
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="kanban-task-menu">
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Move to</p>
                {columns.map((col, idx) => (
                  <button
                    key={col.id}
                    disabled={idx === columnIndex}
                    onClick={() => { onMoveTask(task._id, col.id, col.status); setShowMenu(false); }}
                    className={`kanban-menu-item ${idx === columnIndex ? 'text-gray-300 cursor-default' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {col.name}
                  </button>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <button
                  onClick={() => { onDeleteTask(task._id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <TrashIcon className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
         </div>
      </div>
      
      <h3 className="kanban-task-title">
        {task.title}
      </h3>
      
      {task.description && (
        <p className="kanban-task-desc">
          {task.description}
        </p>
      )}

      <div className="kanban-task-footer">
        <div className="flex -space-x-1.5">
          {task.assignees?.slice(0, 3).map((u, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-800">
              {u.name?.charAt(0)}
            </div>
          )) || (
             <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 ring-2 ring-white dark:ring-gray-800">
               <UserIcon className="w-3 h-3" />
             </div>
          )}
        </div>
        
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-500' : 'text-gray-400'}`}>
            <CalendarDaysIcon className="w-3.5 h-3.5" />
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { socket, joinProject, leaveProject } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadProjectData();
    joinProject(projectId);
    if (socket) {
      socket.on('task:created', handleTaskCreated);
      socket.on('task:updated', handleTaskUpdated);
      socket.on('task:deleted', handleTaskDeleted);
      socket.on('task:moved', handleTaskMoved);
    }
    return () => {
      leaveProject(projectId);
      if (socket) {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');
        socket.off('task:moved');
      }
    };
  }, [projectId, socket]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, tasksRes] = await Promise.all([
        projectAPI.getProject(projectId),
        taskAPI.getTasks({ project: projectId })
      ]);
      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks || []);
    } catch (error) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateProject = async (data) => {
    await projectAPI.updateProject(projectId, data);
    setProject(prev => ({ ...prev, ...data }));
  };

  const handleAddMember = async (email, role) => {
     await projectAPI.addMember(projectId, { email, role });
     loadProjectData(); // Reload to get updated member list with details
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
        await projectAPI.removeMember(projectId, userId);
        setProject(prev => ({
            ...prev,
            members: prev.members.filter(m => m.user._id !== userId)
        }));
        toast.success('Member removed');
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
      // Logic handled in Modal, but we might want state update here if modal doesn't do full reload behavior
      // The modal reloads or the parent reloads... actually modal calls API.
      // If modal calls onTransferOwnership, we might want to reload project data.
      await projectAPI.transferOwnership(projectId, newOwnerId);
      loadProjectData();    
  };

  const handleTaskCreated = (newTask) => {
    if ((newTask.project?._id || newTask.project) === projectId) {
       setTasks(prev => [...prev, newTask]);
    }
  };

  const handleTaskUpdated = (updatedTask) => setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  const handleTaskDeleted = ({ id }) => setTasks(prev => prev.filter(t => t._id !== id));
  const handleTaskMoved = (movedTask) => setTasks(prev => prev.map(t => t._id === movedTask._id ? movedTask : t));

  const getTasksByColumn = (col) => {
    return tasks.filter(task => {
      if (task.column === col.id || task.column === col.name) return true;
      if (!task.column && task.status === col.status) return true;
      return false;
    });
  };

  const moveTask = async (taskId, newColumnId, newStatus) => {
    const target = tasks.find(t => t._id === taskId);
    if (!target) return;
    const optimistic = { ...target, status: newStatus, column: newColumnId };
    setTasks(prev => prev.map(t => t._id === taskId ? optimistic : t));
    try {
      await taskAPI.updateTask(taskId, { status: newStatus, column: newColumnId });
      toast.success(`Moved to ${newColumnId}`);
    } catch (e) {
      loadProjectData();
    }
  };

  const deleteTask = async (taskId) => {
    if(!window.confirm('Delete this task?')) return;
    
    setTasks(prev => prev.filter(t => t._id !== taskId));
    try {
      await taskAPI.deleteTask(taskId);
      toast.success('Task deleted');
    } catch (e) {
      loadProjectData();
      toast.error('Failed to delete task');
    }
  };
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="kanban-page">
      {/* Background Blobs - Consistent with Dashboard */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="kanban-bg-blob-1" style={{ animationDuration: '4s' }} />
        <div className="kanban-bg-blob-2" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Header - Minimal & Consistent */}
      <nav className="kanban-header-nav">
        <div className="px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link to="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
               <ArrowLeftIcon className="w-5 h-5" />
             </Link>
             <div>
               <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: project?.color || '#6366F1' }} />
                 {project?.name || 'Project'}
               </h1>
               <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                 <ClockIcon className="w-3 h-3" />
                 <span>{tasks.length} tasks</span>
                 <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                 <UserIcon className="w-3 h-3" />
                 <span>{project?.members?.length + 1} members</span>
               </div>
             </div>
           </div>

           <div className="flex items-center gap-3 relative">
             <Link to={`/tasks/new?projectId=${projectId}`} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
               <PlusIcon className="w-4 h-4" />
               <span className="hidden md:inline">New Task</span>
             </Link>
             
             {/* Bell Icon for Notifications */}
             <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors relative"
                 >
                    <BellIcon className="w-5 h-5" />
                 </button>
                 {showNotifications && <NotificationsPopover onClose={() => setShowNotifications(false)} />}
             </div>

             <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                title="Project Settings"
             >
                <Cog6ToothIcon className="w-5 h-5" />
             </button>
             <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                {theme === 'dark' ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5" />}
             </button>
           </div>
        </div>
      </nav>

      {showSettings && (
        <ProjectSettingsModal 
           project={project} 
           user={user}
           onClose={() => setShowSettings(false)} 
           onUpdate={handleUpdateProject}
           onAddMember={handleAddMember}
           onRemoveMember={handleRemoveMember}
           onTransferOwnership={handleTransferOwnership}
        />
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
             setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
             setSelectedTask(updatedTask);
          }}
          onDelete={(taskId) => {
             deleteTask(taskId);
             setSelectedTask(null);
          }}
        />
      )}

      {/* Board Area */}
      <div className="kanban-board-container">
        <div className="kanban-columns-wrapper">
          {columns.map((col, colIndex) => {
            const colTasks = getTasksByColumn(col);
            return (
              <div key={col.id} className="kanban-column">
                {/* Minimal Column Header */}
                <div className="kanban-column-header">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${col.color} ${col.textColor}`}>
                      {col.name}
                    </span>
                    <span className="text-xs font-bold text-gray-400">{colTasks.length}</span>
                  </div>
                  <Link to={`/tasks/new?projectId=${projectId}&status=${col.status}`} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                  </Link>
                </div>
                
                {/* Task List */}
                <div className="kanban-task-list custom-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="kanban-empty-col">
                      <p className="text-xs font-medium text-gray-300 dark:text-gray-600">No tasks</p>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        onMoveTask={moveTask} 
                        onDeleteTask={deleteTask}
                        onOpenTask={(t) => setSelectedTask(t)}
                        columnIndex={colIndex}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;