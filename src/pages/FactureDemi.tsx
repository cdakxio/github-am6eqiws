import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Printer, Plus, Search, Brain, Sparkles } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface FactureDemi {
  id: number;
  created_at: string;
  nom_client: string;
  articles: string;
  prix: number;
  nfacture: string;
  quantité: number;
}

const FactureDemi = () => {
  const [factures, setFactures] = useState<FactureDemi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchFactures();

    const subscription = supabase
      .channel('FactureDemi_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'FactureDemi'
        },
        (payload) => {
          console.log('Change received!', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                addNotification(
                  `Nouvelle facture créée - Client: ${payload.new.nom_client || 'Non spécifié'} - Montant: ${payload.new.prix || 0}€ - N° ${payload.new.nfacture || 'Non spécifié'}`,
                  'success',
                  payload.new
                );
              }
              break;
            case 'UPDATE':
              if (payload.old && payload.new) {
                const changes = Object.keys(payload.new)
                  .filter(key => payload.old[key] !== payload.new[key])
                  .map(key => `${key}: ${payload.old[key] || 'Non spécifié'} → ${payload.new[key] || 'Non spécifié'}`)
                  .join(', ');
                addNotification(
                  `Facture modifiée - Client: ${payload.new.nom_client || 'Non spécifié'} - Modifications: ${changes}`,
                  'info',
                  { old: payload.old, new: payload.new, changes }
                );
              }
              break;
            case 'DELETE':
              if (payload.old) {
                addNotification(
                  `Facture supprimée - N° ${payload.old.nfacture || 'Non spécifié'} - Client: ${payload.old.nom_client || 'Non spécifié'}`,
                  'error',
                  payload.old
                );
              }
              break;
          }
          
          fetchFactures();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [addNotification]);

  const fetchFactures = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('FactureDemi')
        .select('id, created_at, nom_client, articles, prix, nfacture, quantité')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to fetch data from Supabase (empty error)');
      }

      if (!data) {
        throw new Error('No data received from Supabase');
      }
      
      setFactures(data);
    } catch (err) {
      console.error('Failed to fetch factures:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="relative">
          <Brain className="w-12 h-12 text-teal-600 animate-pulse" />
          <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-ping" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 rounded-2xl shadow-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 -top-32 -left-32 bg-teal-500/20 rounded-full mix-blend-overlay filter blur-xl animate-blob"></div>
          <div className="absolute w-64 h-64 -bottom-32 -right-32 bg-emerald-500/20 rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Factures</h1>
            <p className="text-teal-100/80 text-sm">Gestion des factures TEMIS</p>
          </div>
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
            </div>
            <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Nouvelle Facture</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Articles</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factures.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{facture.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(facture.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {facture.nom_client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {facture.articles}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-emerald-600">{facture.prix}€</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facture.nfacture}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facture.quantité}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <button className="text-teal-600 hover:text-teal-800 transition-colors">
                        <Download className="h-5 w-5" />
                      </button>
                      <button className="text-emerald-600 hover:text-emerald-800 transition-colors">
                        <Printer className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FactureDemi;