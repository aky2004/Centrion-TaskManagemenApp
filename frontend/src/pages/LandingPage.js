import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  BoltIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  SparklesIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState('professional');

  const features = [
    {
      name: 'Real-time Collaboration',
      description: 'Work together with your team in real-time. See changes instantly as they happen with our lightning-fast sync engine.',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Smart Kanban Boards',
      description: 'Visualize your workflow with beautiful, customizable boards. Drag and drop tasks effortlessly between stages.',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Advanced Analytics',
      description: 'Gain deep insights into your team\'s performance with interactive charts, progress rings, and detailed reports.',
      icon: BoltIcon,
      color: 'bg-amber-500',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  const pricing = [
    {
      id: 'free',
      name: 'Starter',
      price: '$0',
      description: 'Perfect for individuals and small side projects.',
      features: ['Up to 5 Projects', '10 Team Members', 'Basic Analytics', '5GB Storage', 'Community Support'],
      cta: 'Start for Free',
      popular: false,
    },
    {
      id: 'professional',
      name: 'Pro',
      price: '$12',
      period: '/user/mo',
      description: 'For growing teams that need more power and flexibility.',
      features: ['Unlimited Projects', 'Unlimited Members', 'Advanced Analytics', '100GB Storage', 'Priority Support', 'Custom Fields'],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'from-primary-600 to-blue-600',
    },
    {
      id: 'enterprise',
      name: 'Business',
      price: '$49',
      period: '/user/mo',
      description: 'Advanced features and security for large organizations.',
      features: ['Everything in Pro', 'Unlimited Storage', 'SSO & Audit Logs', 'Dedicated Success Manager', '24/7 Phone Support', 'SLA Guarantee'],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 selection:bg-primary-500/30">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                Centrion
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</a>
              <a href="#" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
              <Link to="/login" className="hidden sm:inline-flex px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                Log in
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                Get Started
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">v2.0 is now live</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 leading-tight">
            Manage tasks with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 animate-gradient">
              superhuman speed
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Beautifully designed workspace for modern teams. Organize, prioritize, and track work with a tool you'll actually love using.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 text-white text-lg font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all duration-300">
              Start Free Trial
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-lg font-semibold hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-300 flex items-center justify-center gap-2">
              <PlayIcon className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* App Preview — Mock Kanban Board */}
          <div className="mt-20 relative mx-auto max-w-5xl perspective-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>
            <div className="relative rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden group transform transition-transform hover:scale-[1.01] duration-500">
              {/* Window Chrome */}
              <div className="h-12 bg-gray-800/50 border-b border-gray-700 flex items-center px-4 gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="ml-4 px-3 py-1 rounded-md bg-gray-800 text-xs text-gray-400 font-mono">centrion.app/projects/kanban</div>
              </div>

              {/* Board Content */}
              <div className="p-4 md:p-6 bg-[#0F172A]">
                {/* Board Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">P</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Product Launch v2.0</h3>
                      <p className="text-[10px] text-gray-500">Sprint 4 · 8 of 14 tasks done</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-[#0F172A] text-[8px] text-white flex items-center justify-center font-bold">JD</div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-[#0F172A] text-[8px] text-white flex items-center justify-center font-bold">AK</div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-[#0F172A] text-[8px] text-white flex items-center justify-center font-bold">MR</div>
                      <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-[#0F172A] text-[8px] text-gray-400 flex items-center justify-center font-bold">+3</div>
                    </div>
                    <div className="hidden md:block h-6 w-px bg-gray-700"></div>
                    <div className="hidden md:flex px-2.5 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold text-primary-400">57% Complete</div>
                  </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                  {/* Column: To Do */}
                  <div className="bg-gray-800/30 rounded-xl p-2.5 border border-gray-800/50">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To Do</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">3</span>
                    </div>
                    <div className="space-y-2">
                      {/* Card 1 */}
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-gray-700/50 hover:border-gray-600 transition-colors">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/20 text-red-400 uppercase">Urgent</span>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-200 mb-2 leading-tight">Setup CI/CD pipeline for staging</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[9px] text-gray-500">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Feb 14
                          </div>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[7px] text-white flex items-center justify-center font-bold">JD</div>
                        </div>
                      </div>
                      {/* Card 2 */}
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-gray-700/50">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-400 uppercase">High</span>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-200 mb-2 leading-tight">Write API documentation</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-gray-700 text-gray-400">Docs</span>
                          </div>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[7px] text-white flex items-center justify-center font-bold">AK</div>
                        </div>
                      </div>
                      {/* Card 3 — subtle */}
                      <div className="bg-gray-800/40 rounded-lg p-2.5 border border-gray-800/50">
                        <p className="text-[11px] font-medium text-gray-400 leading-tight">Create onboarding flow</p>
                      </div>
                    </div>
                  </div>

                  {/* Column: In Progress */}
                  <div className="bg-blue-500/[0.03] rounded-xl p-2.5 border border-blue-500/10">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">In Progress</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-500/70 bg-blue-500/10 px-1.5 py-0.5 rounded">2</span>
                    </div>
                    <div className="space-y-2">
                      {/* Active card with progress */}
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-400 uppercase">High</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-500/20 text-purple-400">Frontend</span>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-200 mb-2 leading-tight">Redesign dashboard components</p>
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-gray-700 rounded-full mb-2">
                          <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-gray-500">3/4 subtasks</span>
                          <div className="flex -space-x-1">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[7px] text-white flex items-center justify-center font-bold border border-gray-800">MR</div>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[7px] text-white flex items-center justify-center font-bold border border-gray-800">JD</div>
                          </div>
                        </div>
                      </div>
                      {/* Card 2 */}
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-gray-700/50">
                        <p className="text-[11px] font-semibold text-gray-200 mb-2 leading-tight">Integrate payment gateway</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-400">Backend</span>
                          </div>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[7px] text-white flex items-center justify-center font-bold">AK</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column: Review */}
                  <div className="bg-amber-500/[0.03] rounded-xl p-2.5 border border-amber-500/10 hidden md:block">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Review</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-500/70 bg-amber-500/10 px-1.5 py-0.5 rounded">2</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-amber-500/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-400 uppercase">Medium</span>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-200 mb-2 leading-tight">User authentication flow</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[9px] text-amber-500/60">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            2 comments
                          </div>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-[7px] text-white flex items-center justify-center font-bold">SL</div>
                        </div>
                      </div>
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-gray-700/50">
                        <p className="text-[11px] font-semibold text-gray-200 mb-2 leading-tight">Email notification templates</p>
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-gray-700 text-gray-400">Design</span>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[7px] text-white flex items-center justify-center font-bold">MR</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column: Done */}
                  <div className="bg-emerald-500/[0.03] rounded-xl p-2.5 border border-emerald-500/10 hidden md:block">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Done</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">8</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-emerald-500/10 opacity-80">
                        <p className="text-[11px] font-semibold text-gray-300 mb-1.5 leading-tight line-through decoration-emerald-500/50">Database schema design</p>
                        <div className="flex items-center gap-1 text-[9px] text-emerald-500/60">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Completed Feb 10
                        </div>
                      </div>
                      <div className="bg-gray-800/80 rounded-lg p-2.5 border border-emerald-500/10 opacity-80">
                        <p className="text-[11px] font-semibold text-gray-300 mb-1.5 leading-tight line-through decoration-emerald-500/50">Setup project repository</p>
                        <div className="flex items-center gap-1 text-[9px] text-emerald-500/60">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Completed Feb 8
                        </div>
                      </div>
                      <div className="bg-gray-800/40 rounded-lg p-2.5 border border-gray-800/50 opacity-60">
                        <p className="text-[10px] font-medium text-gray-500 line-through">+ 6 more completed</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center md:mb-20 mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Everything you need to <br />
              <span className="text-primary-600">ship faster</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-300">
                <div className={`mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Active Users', value: '10k+' },
              { label: 'Tasks Completed', value: '2M+' },
              { label: 'Uptime', value: '99.9%' },
              { label: 'Countries', value: '50+' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                  {stat.value}
                </div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-8 rounded-3xl border ${
                  plan.popular
                    ? 'bg-white dark:bg-gray-800 border-primary-500 ring-4 ring-primary-500/10 shadow-2xl'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                } flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-primary-500' : 'text-gray-400'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl font-bold text-center transition-all duration-200 ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-primary-500/25'
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-primary-900 to-blue-900 overflow-hidden relative text-center px-6 py-16 lg:px-20 lg:py-24 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Ready to ship fast?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join 10,000+ teams who use Centrion to manage their projects and deliverables.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-8 py-4 rounded-xl bg-white text-primary-900 text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl">
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Centrion</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-xs mb-6">
                The all-in-one workspace for teams who want to build products, not manage tools.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; 2026 Centrion Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;