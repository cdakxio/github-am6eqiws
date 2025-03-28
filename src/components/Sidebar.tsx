import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Image, 
  Wallet, 
  Receipt, 
  Database,
  LayoutDashboard,
  Webhook,
  BookImage,
  GraduationCap,
  FileText,
  Brain,
  Sparkles
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Image, label: 'Image Generations', path: '/generations' },
    { icon: Database, label: 'Loras', path: '/loras' },
    { icon: Wallet, label: 'Wallets', path: '/wallets' },
    { icon: Receipt, label: 'Transactions', path: '/transactions' },
    { icon: FileText, label: 'Factures', path: '/factures' },
    { icon: BookImage, label: 'Training Images', path: '/training-images' },
    { icon: Webhook, label: 'Webhooks', path: '/webhooks' },
    { icon: GraduationCap, label: 'Lora Trainings', path: '/lora-trainings' }
  ];

  return (
    <div className="bg-gradient-to-b from-teal-700 via-emerald-700 to-cyan-800 text-white w-64 min-h-screen px-4 py-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-64 h-64 -top-32 -left-32 bg-teal-500/20 rounded-full mix-blend-overlay filter blur-xl animate-blob"></div>
        <div className="absolute w-64 h-64 -bottom-32 -right-32 bg-emerald-500/20 rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative">
        <div className="flex items-center mb-8 px-2">
          <div className="relative">
            <Brain className="w-8 h-8 text-white" />
            <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="ml-3">
            <span className="text-xl font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">
              TEMIS
            </span>
            <span className="block text-xs text-teal-200/80">Intelligence Artificielle</span>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 backdrop-blur-sm text-white shadow-lg'
                    : 'text-teal-100/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                item.path === '/' ? 'text-teal-300' : ''
              }`} />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm">
          <p className="text-xs text-teal-100/60 text-center">
            TEMIS Admin Dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;