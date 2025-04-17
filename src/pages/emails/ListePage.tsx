import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Search, Filter, Mail, ChevronDown, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EmailModal from '../../components/EmailModal';

interface Email {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
  response?: string;
  response_at?: string;
  response_by?: string;
}

const ITEMS_PER_PAGE = 10;

export default function ListePage() {
  const { addNotification } = useNotifications();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  useEffect(() => {
    fetchEmails();
  }, [searchTerm, currentPage]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('emails')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `subject.ilike.%${searchTerm}%,to_email.ilike.%${searchTerm}%,from_email.ilike.%${searchTerm}%`
        );
      }

      // Add pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setEmails(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching emails:', error);
      addNotification(
        'Erreur lors du chargement des emails',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Brain className="w-8 h-8 text-emerald-500" />
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-emerald-800">Emails</h1>
              <p className="text-sm text-emerald-500 mt-1">Historique des emails envoyés</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
              <input
                type="text"
                placeholder="Rechercher un email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtres
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun email trouvé</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Aucun email ne correspond à vos critères' : 'Aucun email n\'a été envoyé'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">De</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">À</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Sujet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Réponse</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(email.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {email.from_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {email.to_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {email.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {email.response && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Réponse générée
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedEmail(email)}
                          className="relative p-2 rounded-full text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Voir les détails"
                        >
                          <Brain className="w-5 h-5" />
                          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-lg border border-emerald-50 px-4 py-3">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Affichage de{' '}
                  <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>
                  {' '}à{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                  </span>
                  {' '}sur{' '}
                  <span className="font-medium">{totalCount}</span>
                  {' '}résultats
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-1 text-sm text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === page
                          ? 'bg-emerald-500 text-white'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-1 text-sm text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Email Details Modal */}
      {selectedEmail && (
        <EmailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  );
}
