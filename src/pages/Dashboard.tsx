import React from 'react';
import { Users, Image, Wallet, Receipt, Brain, Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Jan', generations: 400 },
  { name: 'Feb', generations: 300 },
  { name: 'Mar', generations: 600 },
  { name: 'Apr', generations: 800 },
  { name: 'May', generations: 500 },
  { name: 'Jun', generations: 700 },
];

const areaData = [
  { name: 'Jan', users: 100 },
  { name: 'Feb', users: 200 },
  { name: 'Mar', users: 150 },
  { name: 'Apr', users: 300 },
  { name: 'May', users: 250 },
  { name: 'Jun', users: 400 },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 rounded-2xl shadow-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 -top-32 -left-32 bg-teal-500/20 rounded-full mix-blend-overlay filter blur-xl animate-blob"></div>
          <div className="absolute w-64 h-64 -bottom-32 -right-32 bg-emerald-500/20 rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard TEMIS</h1>
            <p className="text-teal-100/80 text-sm">Vue d'ensemble de vos activités</p>
          </div>
          <div className="relative">
            <Brain className="w-10 h-10 text-white" />
            <Sparkles className="h-4 w-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Utilisateurs Actifs', value: '1,234', icon: Users, color: 'from-blue-500 to-blue-600', trend: '+12%' },
          { title: 'Générations IA', value: '5,678', icon: Image, color: 'from-emerald-500 to-emerald-600', trend: '+8%' },
          { title: 'Portefeuilles', value: '892', icon: Wallet, color: 'from-purple-500 to-purple-600', trend: '+5%' },
          { title: 'Transactions', value: '12,345€', icon: Receipt, color: 'from-amber-500 to-amber-600', trend: '+15%' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className="flex items-center text-sm font-medium text-emerald-600">
                  {stat.trend}
                  <TrendingUp className="h-4 w-4 ml-1" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Générations par Mois</h2>
              <p className="text-sm text-gray-500">Evolution des générations d'images</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-emerald-600">+24.5%</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <defs>
                  <linearGradient id="colorGeneration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="generations" fill="url(#colorGeneration)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Croissance Utilisateurs</h2>
              <p className="text-sm text-gray-500">Evolution du nombre d'utilisateurs</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-emerald-600">+12.3%</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#0D9488" 
                  fillOpacity={1}
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;