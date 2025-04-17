import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Search, Filter, PlusCircle, Mail, Phone, MapPin, Building2, Edit2, Trash2, ChevronDown, LayoutGrid, List, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import ParticipantModal from '../../components/ParticipantModal';

interface Participant {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  fonction: string;
  is_responsable: boolean;
  type_institution: string;
  nom_institution: string;
  rue: string;
  code_postal: string;
  ville: string;
  telephone_institution: string;
  adresse_facturation: string;
  commentaire: string;
  created_at: string;
  is_active: boolean;
  created_by: string;
}

export default function ListePage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResponsable, setFilterResponsable] = useState<boolean | null>(null);
  const [filterInstitution, setFilterInstitution] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [institutionTypes, setInstitutionTypes] = useState<string[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    fetchParticipants();
    fetchInstitutionTypes();
  }, [searchTerm, filterResponsable, filterInstitution]);

  const fetchInstitutionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('parametres')
        .select('libelle')
        .eq('type', 'type_institution')
        .eq('is_active', true)
        .order('ordre');

      if (error) throw error;

      setInstitutionTypes(data.map(item => item.libelle));
    } catch (error) {
      console.error('Error fetching institution types:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('participants')
        .select('*')
        .eq('is_active', true)
        .order('nom', { ascending: true });

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,nom_institution.ilike.%${searchTerm}%`);
      }

      if (filterResponsable !== null) {
        query = query.eq('is_responsable', filterResponsable);
      }

      if (filterInstitution) {
        query = query.eq('type_institution', filterInstitution);
      }

      const { data, error } = await query;

      if (error) throw error;

      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      addNotification(
        'Erreur lors du chargement des contacts',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Only attempt to delete if the participant was created by the current user
      const participant = participants.find(p => p.id === id);
      if (!participant || participant.created_by !== user?.id) {
        throw new Error('Vous n\'avez pas les droits pour supprimer ce contact');
      }

      const { error } = await supabase
        .from('participants')
        .update({ is_active: false })
        .eq('id', id)
        .eq('created_by', user.id); // Add explicit check for created_by

      if (error) throw error;

      addNotification('Contact supprimé avec succès', 'success');
      fetchParticipants();
    } catch (error) {
      console.error('Error deleting participant:', error);
      addNotification(
        error instanceof Error ? error.message : 'Erreur lors de la suppression du contact',
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
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Fonction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Institution</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((participant) => (
              <tr 
                key={participant.id} 
                className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedParticipant(participant)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.prenom} {participant.nom}
                      </div>
                      {participant.is_responsable && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Responsable
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <a 
                      href={`mailto:${participant.email}`} 
                      className="text-emerald-600 hover:text-emerald-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    {participant.telephone && (
                      <a 
                        href={`tel:${participant.telephone}`} 
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{participant.fonction}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {participant.nom_institution && (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {participant.nom_institution}
                      </div>
                      <div className="text-sm text-gray-500">
                        {participant.type_institution}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {participant.created_by === user?.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/participants/edit/${participant.id}`);
                          }}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(participant.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedParticipant(participant)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-emerald-800">
                  {participant.prenom} {participant.nom}
                </h3>
                {participant.is_responsable && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Responsable
                  </span>
                )}
              </div>
            </div>
            {participant.created_by === user?.id && (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/participants/edit/${participant.id}`);
                  }}
                  className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(participant.id);
                  }}
                  className="p-1 text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {participant.fonction && (
              <div className="text-sm text-gray-600">
                {participant.fonction}
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-emerald-400" />
              <a 
                href={`mailto:${participant.email}`} 
                className="hover:text-emerald-600"
                onClick={(e) => e.stopPropagation()}
              >
                {participant.email}
              </a>
            </div>

            {participant.telephone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                <a 
                  href={`tel:${participant.telephone}`} 
                  className="hover:text-emerald-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {participant.telephone}
                </a>
              </div>
            )}

            {participant.nom_institution && (
              <div className="pt-3 mt-3 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-2 text-emerald-400" />
                  <div>
                    <div className="font-medium">{participant.nom_institution}</div>
                    <div className="text-sm text-gray-500">{participant.type_institution}</div>
                  </div>
                </div>

                {participant.rue && (
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                    <div>
                      <p>{participant.rue}</p>
                      <p>{participant.code_postal} {participant.ville}</p>
                    </div>
                  </div>
                )}
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
              <h1 className="text-2xl font-medium text-emerald-800">Contacts</h1>
              <p className="text-sm text-emerald-500 mt-1">Liste des contacts</p>
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
              onClick={() => navigate('/participants/nouveau')}
              className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Nouveau Contact
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
                placeholder="Rechercher un contact..."
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
                  Type
                </label>
                <select
                  value={filterResponsable === null ? '' : filterResponsable.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterResponsable(value === '' ? null : value === 'true');
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                >
                  <option value="">Tous les types</option>
                  <option value="true">Responsables</option>
                  <option value="false">Contacts</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Institution
                </label>
                <select
                  value={filterInstitution}
                  onChange={(e) => setFilterInstitution(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                >
                  <option value="">Toutes les institutions</option>
                  {institutionTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
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
      ) : participants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <User className="h-12 w-12 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contact trouvé</h3>
          <p className="text-gray-500">Commencez par ajouter un nouveau contact.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <GridView />
      ) : (
        <TableView />
      )}

      {/* Details Modal */}
      {selectedParticipant && (
        <ParticipantModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  );
}