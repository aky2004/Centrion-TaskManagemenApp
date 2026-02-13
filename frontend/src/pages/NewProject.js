import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, workspaceAPI } from '../services/api';
import { 
  ArrowLeftIcon, 
  BriefcaseIcon, 
  SwatchIcon, 
  DocumentTextIcon, 
  BuildingOfficeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PROJECT_COLORS = [
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#10B981', name: 'Emerald' },
  { hex: '#6366F1', name: 'Indigo' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#06B6D4', name: 'Cyan' },
];

const NewProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workspace: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceAPI.getWorkspaces();
      setWorkspaces(res.data.workspaces || []);
      if (res.data.workspaces?.length > 0) {
        setFormData(prev => ({ ...prev, workspace: res.data.workspaces[0]._id }));
      }
    } catch (error) {
      toast.error('Failed to load workspaces');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!formData.workspace) {
      toast.error('Please select a workspace');
      return;
    }

    try {
      setLoading(true);
      const res = await projectAPI.createProject(formData);
      toast.success('Project created successfully!');
      navigate(`/projects/${res.data.project._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex flex-col">
      {/* Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
              <ArrowLeftIcon className="h-4 w-4 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
            </div>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/60 dark:border-gray-700/50 overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="bg-gray-50/50 dark:bg-gray-700/20 px-8 py-6 border-b border-gray-100 dark:border-gray-700/50">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  <BriefcaseIcon className="w-6 h-6" />
                </div>
                Create New Project
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 ml-14">
                Initialize a new project space for your team.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Project Name */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                  Project Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Q4 Marketing Campaign"
                  className="w-full px-5 py-4 text-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-400 dark:text-white"
                  autoFocus
                  required
                />
              </div>

              {/* Workspace */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <BuildingOfficeIcon className="w-4 h-4" /> Workspace
                </label>
                <div className="relative">
                  <select
                    name="workspace"
                    value={formData.workspace}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    required
                  >
                    <option value="" disabled>Select workspace</option>
                    {workspaces.map(ws => (
                      <option key={ws._id} value={ws._id}>{ws.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                {workspaces.length === 0 && (
                   <p className="text-xs text-amber-500 mt-1">
                     No workspaces found. <button type="button" onClick={() => navigate('/workspaces/new')} className="font-bold underline">Create one first.</button>
                   </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <DocumentTextIcon className="w-4 h-4" /> Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What is this project about?"
                  rows="3"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-400 dark:text-white"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <SwatchIcon className="w-4 h-4" /> Theme Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.hex }))}
                      className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${
                        formData.color === color.hex 
                          ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {formData.color === color.hex && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                       )}
                    </button>
                  ))}
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <div className="relative group">
                     <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400">
                        <PlusIcon className="w-4 h-4" />
                     </div>
                     {/* Custom color picker - native input hidden opacity 0 on top */}
                     <input 
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Custom Color"
                     />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProject;
