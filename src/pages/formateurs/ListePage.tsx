import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Search, Filter, PlusCircle, Mail, Phone, MapPin, Edit2, Trash2, ChevronDown, LayoutGrid, List, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import FormateurModal from '../../components/FormateurModal';
import { EditFormateurModal } from '../../components/EditFormateurModal';

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  code_postal: string;
  ville: string;
  created_at: string;
  is_active: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function ListePage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedFormateur, setSelectedFormateur] = useState<Formateur | null>(null);
  const [editingFormateur, setEditingFormateur] = useState<Formateur | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchFormateurs();
  }, [searchTerm, currentPage]);

  const fetchFormateurs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('formateurs')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('nom', { ascending: true });

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Add pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setFormateurs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching formateurs:', error);
      addNotification(
        'Erreur lors du chargement des formateurs',
        'error',
        {
          table: 'Formateurs',
          action: 'Lecture'
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('formateurs')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      addNotification(
        'Formateur supprimé avec succès',
        'success',
        {
          table: 'Formateurs',
          action: 'Suppression'
        }
      );
      fetchFormateurs();
    } catch (error) {
      console.error('Error deleting formateur:', error);
      addNotification(
        'Erreur lors de la suppression du formateur',
        'error',
        {
          table: 'Formateurs',
          action: 'Suppression'
        }
      );
    }
  };

  const handleFormateurUpdated = (updatedFormateur: Formateur) => {
    setFormateurs(prevFormateurs =>
      prevFormateurs.map(f =>
        f.id === updatedFormateur.id ? updatedFormateur : f
      )
    );
    setEditingFormateur(null);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const TableView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Adresse</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {formateurs.map((formateur) => (
              <tr 
                key={formateur.id} 
                className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedFormateur(formateur)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formateur.prenom} {formateur.nom}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <a 
                      href={`mailto:${formateur.email}`} 
                      className="text-emerald-600 hover:text-emerald-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    {formateur.telephone && (
                      <a 
                        href={`tel:${formateur.telephone}`} 
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formateur.adresse && (
                      <>
                        {formateur.adresse}, {formateur.code_postal} {formateur.ville}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFormateur(formateur);
                      }}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(formateur.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {formateurs.map((formateur) => (
        <div
          key={formateur.id}
          className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedFormateur(formateur)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-emerald-800">
                  {formateur.prenom} {formateur.nom}
                </h3>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFormateur(formateur);
                }}
                className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(formateur.id);
                }}
                className="p-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-emerald-400" />
              <a 
                href={`mailto:${formateur.email}`} 
                className="hover:text-emerald-600"
                onClick={(e) => e.stopPropagation()}
              >
                {formateur.email}
              </a>
            </div>

            {formateur.telephone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                <a 
                  href={`tel:${formateur.telephone}`} 
                  className="hover:text-emerald-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formateur.telephone}
                </a>
              </div>
            )}

            {formateur.adresse && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                <div>
                  <p>{formateur.adresse}</p>
                  <p>{formateur.code_postal} {formateur.ville}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

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
              <h1 className="text-2xl font-medium text-emerald-800">Liste des Formateurs</h1>
              <p className="text-sm text-emerald-500 mt-1">Gérer les formateurs</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-emerald-50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => navigate('/formateurs/nouveau')}
              className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Nouveau Formateur
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
              <input
                type="text"
                placeholder="Rechercher un formateur..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
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
      ) : formateurs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <User className="h-12 w-12 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun formateur trouvé</h3>
          <p className="text-gray-500">Commencez par ajouter un nouveau formateur.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? <GridView /> : <TableView />}
          
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

      {/* Modals */}
      {selectedFormateur && (
        <FormateurModal
          formateur={selectedFormateur}
          onClose={() => setSelectedFormateur(null)}
        />
      )}

      {editingFormateur && (
        <EditFormateurModal
          formateur={editingFormateur}
          onClose={() => setEditingFormateur(null)}
          onFormateurUpdated={handleFormateurUpdated}
        />
      )}
    </div>
  );
}