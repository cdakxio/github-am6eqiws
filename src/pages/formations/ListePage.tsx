import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PlusCircle, Calendar, MapPin, Clock, Mail, Phone, Video, Edit2, Trash2, ChevronDown, Brain, Sparkles, LayoutGrid, List, Users, Star, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import FormationModal from '../../components/FormationModal';
import { EditFormationModal } from '../../components/EditFormationModal';
import { DuplicateFormationModal } from '../../components/DuplicateFormationModal';

interface Location {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
}

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface Formation {
  id: string;
  titre: string;
  lieu_id: string | null;
  lieu?: Location;
  categorie: string;
  date: string;
  nombre_heures: number;
  nombre_places: number | null;
  url_visio: string;
  telephone: string;
  email: string;
  participant_count: number;
  rating: number;
  formateurs?: Formateur[];
}

export default function ListePage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [duplicatingFormation, setDuplicatingFormation] = useState<Formation | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>();

  useEffect(() => {
    fetchFormations();
  }, [searchTerm, filterCategory, filterDate, filterLocation]);

  useEffect(() => {
    if (selectedFormation?.lieu) {
      const address = `${selectedFormation.lieu.adresse}, ${selectedFormation.lieu.code_postal} ${selectedFormation.lieu.ville}`;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
          if (data && data[0]) {
            setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        })
        .catch(error => {
          console.error('Error fetching coordinates:', error);
          setCoordinates(undefined);
        });
    }
  }, [selectedFormation]);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('formations')
        .select(`
          *,
          lieu:lieux (*),
          participant_count:formation_participants(count),
          formateurs:formation_formateurs(formateurs:formateur_id(*))
        `)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (searchTerm) {
        query = query.or(`titre.ilike.%${searchTerm}%,categorie.ilike.%${searchTerm}%`);
      }

      if (filterCategory) {
        query = query.eq('categorie', filterCategory);
      }

      if (filterDate) {
        query = query.eq('date', filterDate);
      }

      if (filterLocation) {
        query = query.eq('lieu_id', filterLocation);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formationsWithFormateurs = data?.map(formation => ({
        ...formation,
        formateurs: formation.formateurs?.map((f: any) => f.formateurs),
        participant_count: formation.participant_count?.[0]?.count || 0
      })) || [];

      setFormations(formationsWithFormateurs);
    } catch (error) {
      console.error('Error fetching formations:', error);
      addNotification(
        'Erreur lors du chargement des formations',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('formations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      addNotification('Formation supprimée avec succès', 'success');
      fetchFormations();
    } catch (error) {
      console.error('Error deleting formation:', error);
      addNotification(
        'Erreur lors de la suppression de la formation',
        'error'
      );
    }
  };

  const handleDuplicateFormation = (newFormation: Formation) => {
    addNotification('Formation dupliquée avec succès', 'success');
    fetchFormations();
    setDuplicatingFormation(null);
  };

  const getParticipantRatio = (formation: Formation) => {
    const count = formation.participant_count || 0;
    if (formation.nombre_places === null) {
      return `${count}/∞`;
    }
    return `${count}/${formation.nombre_places}`;
  };

  const getParticipantColor = (formation: Formation) => {
    if (formation.nombre_places === null) return 'text-gray-600';
    const count = formation.participant_count || 0;
    if (count >= formation.nombre_places) return 'text-red-600';
    if (count >= formation.nombre_places * 0.8) return 'text-orange-600';
    return 'text-emerald-600';
  };

  const uniqueLocations = Array.from(new Set(formations.map(f => f.lieu?.nom))).filter(Boolean);

  const TableView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Titre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Lieu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Formateurs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Heures</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Satisfaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {formations.map((formation) => (
              <tr 
                key={formation.id} 
                className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedFormation(formation)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{formation.titre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(formation.date), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formation.lieu?.nom || 'Non spécifié'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formation.formateurs?.map(f => `${f.prenom} ${f.nom}`).join(', ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formation.nombre_heures}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center text-sm ${getParticipantColor(formation)}`}>
                    <Users className="w-4 h-4 mr-2" />
                    {getParticipantRatio(formation)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm">
                    <Star className={`w-4 h-4 mr-2 ${formation.rating >= 70 ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <span className={`${formation.rating >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {formation.rating}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {formation.email && (
                      <a 
                        href={`mailto:${formation.email}`} 
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {formation.telephone && (
                      <a 
                        href={`tel:${formation.telephone}`} 
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {formation.url_visio && (
                      <a 
                        href={formation.url_visio} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuplicatingFormation(formation);
                      }}
                      className="text-emerald-600 hover:text-emerald-700"
                      title="Dupliquer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFormation(formation);
                      }}
                      className="text-emerald-600 hover:text-emerald-700"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(formation.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                      title="Supprimer"
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
      {formations.map((formation) => (
        <div
          key={formation.id}
          className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedFormation(formation)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-emerald-800">{formation.titre}</h3>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDuplicatingFormation(formation);
                }}
                className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                title="Dupliquer"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFormation(formation);
                }}
                className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                title="Modifier"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(formation.id);
                }}
                className="p-1 text-red-600 hover:text-red-700 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
              {format(new Date(formation.date), 'dd MMMM yyyy', { locale: fr })}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
              {formation.lieu?.nom || 'Non spécifié'}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-emerald-400" />
              {formation.formateurs?.map(f => `${f.prenom} ${f.nom}`).join(', ')}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-emerald-400" />
              {formation.nombre_heures} heures
            </div>

            <div className={`flex items-center text-sm ${getParticipantColor(formation)}`}>
              <Users className="w-4 h-4 mr-2" />
              {getParticipantRatio(formation)} participants
            </div>

            <div className="flex items-center text-sm">
              <Star className={`w-4 h-4 mr-2 ${formation.rating >= 70 ? 'text-yellow-400' : 'text-gray-400'}`} />
              <span className={`${formation.rating >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
                {formation.rating}% de satisfaction
              </span>
            </div>

            {formation.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-emerald-400" />
                <a 
                  href={`mailto:${formation.email}`} 
                  className="hover:text-emerald-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formation.email}
                </a>
              </div>
            )}

            {formation.telephone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                <a 
                  href={`tel:${formation.telephone}`} 
                  className="hover:text-emerald-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formation.telephone}
                </a>
              </div>
            )}

            {formation.url_visio && (
              <div className="flex items-center text-sm text-gray-600">
                <Video className="w-4 h-4 mr-2 text-emerald-400" />
                <a
                  href={formation.url_visio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  Lien visioconférence
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
              <h1 className="text-2xl font-medium text-emerald-800">Formations</h1>
              <p className="text-sm text-emerald-500 mt-1">Liste des formations disponibles</p>
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
              onClick={() => navigate('/formations/nouvelle')}
              className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Nouvelle Formation
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
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
            <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Lieu
                </label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                >
                  <option value="">Tous les lieux</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
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
      ) : formations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation trouvée</h3>
          <p className="text-gray-500">Aucune formation ne correspond à vos critères de recherche.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <GridView />
      ) : (
        <TableView />
      )}

      {selectedFormation && (
        <FormationModal
          formation={selectedFormation}
          onClose={() => setSelectedFormation(null)}
          onFormationUpdated={(updatedFormation) => {
            setFormations(prevFormations =>
              prevFormations.map(f =>
                f.id === updatedFormation.id ? updatedFormation : f
              )
            );
          }}
        />
      )}

      {editingFormation && (
        <EditFormationModal
          formation={editingFormation}
          onClose={() => setEditingFormation(null)}
          onFormationUpdated={(updatedFormation) => {
            setFormations(prevFormations =>
              prevFormations.map(f =>
                f.id === updatedFormation.id ? updatedFormation : f
              )
            );
            setEditingFormation(null);
          }}
        />
      )}

      {duplicatingFormation && (
        <DuplicateFormationModal
          formation={duplicatingFormation}
          onClose={() => setDuplicatingFormation(null)}
          onDuplicated={handleDuplicateFormation}
        />
      )}
    </div>
  );
}