import React, { useState, useEffect } from 'react';
import { Users, ArrowUpRight, ArrowDownRight, GraduationCap, MapPin, UserCog, Mail, Workflow, Calendar, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { supabase } from '../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Stats {
  participants: number;
  formations: number;
  formateurs: number;
  lieux: number;
  workflows: number;
  emails: number;
  aVenir: number;
  passees: number;
}

interface ChartData {
  name: string;
  value: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    participants: 0,
    formations: 0,
    formateurs: 0,
    lieux: 0,
    workflows: 0,
    emails: 0,
    aVenir: 0,
    passees: 0
  });
  const [formationTrend, setFormationTrend] = useState<ChartData[]>([]);
  const [participantTrend, setParticipantTrend] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchTrends();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get participants count
      const { count: participantsCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get formations count
      const { count: formationsCount } = await supabase
        .from('formations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get formateurs count
      const { count: formateursCount } = await supabase
        .from('formateurs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get lieux count
      const { count: lieuxCount } = await supabase
        .from('lieux')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get upcoming formations count
      const { count: upcomingCount } = await supabase
        .from('formations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('date', today);

      // Get past formations count
      const { count: pastCount } = await supabase
        .from('formations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('date', today);

      setStats({
        participants: participantsCount || 0,
        formations: formationsCount || 0,
        formateurs: formateursCount || 0,
        lieux: lieuxCount || 0,
        workflows: 0, // These would come from a workflow system
        emails: 0, // These would come from an email system
        aVenir: upcomingCount || 0,
        passees: pastCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTrends = async () => {
    try {
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
          start: startOfMonth(date).toISOString(),
          end: endOfMonth(date).toISOString(),
          name: format(date, 'MMM', { locale: fr })
        };
      }).reverse();

      // Fetch formation trends
      const formationData = await Promise.all(
        months.map(async (month) => {
          const { count } = await supabase
            .from('formations')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .gte('date', month.start)
            .lte('date', month.end);

          return {
            name: month.name,
            value: count || 0
          };
        })
      );

      // Fetch participant trends
      const participantData = await Promise.all(
        months.map(async (month) => {
          const { count } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .gte('created_at', month.start)
            .lte('created_at', month.end);

          return {
            name: month.name,
            value: count || 0
          };
        })
      );

      setFormationTrend(formationData);
      setParticipantTrend(participantData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trends:', error);
      setLoading(false);
    }
  };

  const calculateTrendPercentage = (data: ChartData[]) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formationTrendPercentage = calculateTrendPercentage(formationTrend);
  const participantTrendPercentage = calculateTrendPercentage(participantTrend);

  const mainStats = [
    { title: 'Participants', value: stats.participants.toString(), icon: Users },
    { title: 'Formations', value: stats.formations.toString(), icon: GraduationCap },
    { title: 'Formateurs', value: stats.formateurs.toString(), icon: UserCog },
    { title: 'Lieux', value: stats.lieux.toString(), icon: MapPin },
  ];

  const workflowStats = [
    { title: 'Workflows', value: stats.workflows.toString(), icon: Workflow, description: 'Ce mois' },
    { title: 'Emails', value: stats.emails.toString(), icon: Mail, description: 'Ce mois' },
    { title: 'À Venir', value: stats.aVenir.toString(), icon: Calendar, description: 'Prochains 30 jours' },
    { title: 'Passées', value: stats.passees.toString(), icon: History, description: 'Ce mois' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-emerald-800">Dashboard</h1>
          <p className="text-sm text-emerald-500 mt-1">Vue d'ensemble</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 border border-emerald-50 shadow-sm">
            <div className="flex items-center space-x-4">
              <stat.icon className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-emerald-500">{stat.title}</p>
                <p className="text-xl font-medium text-emerald-700 mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {workflowStats.map((stat, index) => (
          <div key={index} className="bg-emerald-50 rounded-lg p-6 border border-emerald-100">
            <div className="flex items-center space-x-4">
              <stat.icon className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-emerald-600">{stat.title}</p>
                <p className="text-xl font-medium text-emerald-700 mt-1">{stat.value}</p>
                <p className="text-xs text-emerald-500 mt-1">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formations Chart */}
        <div className="bg-white rounded-lg p-6 border border-emerald-50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium text-emerald-700">Formations</h2>
              <p className="text-xs text-emerald-500">Evolution mensuelle</p>
            </div>
            <div className="flex items-center text-sm text-emerald-700">
              {formationTrendPercentage > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400 mr-1" />
              )}
              {Math.abs(formationTrendPercentage).toFixed(1)}%
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formationTrend}>
                <XAxis dataKey="name" stroke="#34d399" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#34d399" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#34d399" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Participants Chart */}
        <div className="bg-white rounded-lg p-6 border border-emerald-50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium text-emerald-700">Participants</h2>
              <p className="text-xs text-emerald-500">Evolution mensuelle</p>
            </div>
            <div className="flex items-center text-sm text-emerald-700">
              {participantTrendPercentage > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400 mr-1" />
              )}
              {Math.abs(participantTrendPercentage).toFixed(1)}%
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={participantTrend}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#34d399" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#34d399" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#34d399" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)" 
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