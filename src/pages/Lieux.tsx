import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Search, Filter, PlusCircle, Mail, Phone, MapPin, Edit2, Trash2, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { CreateLocationModal } from '../components/CreateLocationModal';
import { LocationFormationsModal } from '../components/LocationFormationsModal';
import { useNavigate } from 'react-router-dom';

interface Location {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  type: string;
  created_at: string;
  is_active: boolean;
}

export default function Lieux() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    fetchLocations();
  }, [searchTerm, filterType]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('lieux')
        .select('*')
        .eq('is_active', true)
        .order('nom', { ascending: true });

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,ville.ilike.%${searchTerm}%,code_postal.ilike.%${searchTerm}%`);
      }

      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      addNotification(
        'Erreur lors du chargement des lieux',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lieux')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      addNotification('Lieu supprimé avec succès', 'success');
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      addNotification(
        'Erreur lors de la suppression du lieu',
        'error'
      );
    }
  };

  const TableView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Adresse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((location) => (
              <tr 
                key={location.id} 
                className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedLocation(location)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{location.nom}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {location.type && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {location.type}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {location.adresse && (
                      <>
                        {location.adresse}, {location.code_postal} {location.ville}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {location.email && (
                      <a 
                        href={`mailto:${location.email}`} 
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {location.telephone && (
                      <a 
                        href={`tel:${location.telephone}`} 
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLocation(location);
                      }}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(location.id);
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
      {locations.map((location) => (
        <div
          key={location.id}
          className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedLocation(location)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-emerald-800">{location.nom}</h3>
              {location.type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-1">
                  {location.type}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingLocation(location);
                }}
                className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(location.id);
                }}
                className="p-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {location.adresse && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                <div>
                  <p>{location.adresse}</p>
                  <p>{location.code_postal} {location.ville}</p>
                </div>
              </div>
            )}

            {location.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-emerald-400" />
                <a 
                  href={`mailto:${location.email}`} 
                  className="hover:text-emerald-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {location.email}
                </a>
              </div>
            )}

            {location.telephone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                <a 
                  href={`tel:${location.telephone}`} 
                  className="hover:text-emerald-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {location.telephone}
                </a>
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
              <h1 className="text-2xl font-medium text-emerald-800">Lieux</h1>
              <p className="text-sm text-emerald-500 mt-1">Gestion des lieux de formation</p>
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
              onClick={() => navigate('/lieux/nouveau')}
              className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Nouveau Lieu
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
                placeholder="Rechercher un lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

          {showFilters && (
            <div className="p-4 bg-emerald-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Type de lieu
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                >
                  <option value="">Tous les types</option>
                  <option value="Institut">Institut</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <MapPin className="h-12 w-12 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lieu trouvé</h3>
          <p className="text-gray-500">Commencez par ajouter un nouveau lieu.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <GridView />
      ) : (
        <TableView />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateLocationModal
          onClose={() => setShowCreateModal(false)}
          onLocationCreated={(location) => {
            setLocations(prev => [...prev, location]);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingLocation && (
        <CreateLocationModal
          onClose={() => setEditingLocation(null)}
          onLocationCreated={(location) => {
            setLocations(prev =>
              prev.map(l => l.id === location.id ? location : l)
            );
            setEditingLocation(null);
          }}
          initialLocation={editingLocation}
        />
      )}

      {selectedLocation && (
        <LocationFormationsModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}