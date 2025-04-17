import React, { useState, useEffect } from 'react';
import { UserPlus, User, Mail, Phone, Building2, Trash2, AlertTriangle, Check, Clock, CreditCard, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { RegisterParticipantModal } from './RegisterParticipantModal';

interface Participant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  fonction?: string;
  is_responsable: boolean;
  nom_institution?: string;
  type_institution?: string;
  statut: string;
}

interface Formation {
  id: string;
  type: string;
}

interface FormationParticipantsProps {
  formationId: string;
}

export const FormationParticipants: React.FC<FormationParticipantsProps> = ({ formationId }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchFormation();
    fetchParticipants();
  }, [formationId]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm, statusFilter]);

  const fetchFormation = async () => {
    try {
      const { data, error } = await supabase
        .from('formations')
        .select('id, type')
        .eq('id', formationId)
        .single();

      if (error) throw error;
      setFormation(data);
    } catch (error) {
      console.error('Error fetching formation:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('formation_participants')
        .select(`
          participant_id,
          statut,
          participants:participant_id (
            id,
            nom,
            prenom,
            email,
            telephone,
            fonction,
            is_responsable,
            nom_institution,
            type_institution
          )
        `)
        .eq('formation_id', formationId)
        .eq('is_active', true);

      if (error) throw error;

      const participantsWithStatus = data.map(item => ({
        ...item.participants,
        statut: item.statut || 'pending'
      }));

      setParticipants(participantsWithStatus);
    } catch (error) {
      console.error('Error fetching participants:', error);
      addNotification(
        'Erreur lors du chargement des participants',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.statut === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(searchLower) ||
        p.prenom.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        (p.nom_institution && p.nom_institution.toLowerCase().includes(searchLower))
      );
    }

    setFilteredParticipants(filtered);
  };

  const handleUnregister = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('formation_participants')
        .update({ is_active: false })
        .eq('formation_id', formationId)
        .eq('participant_id', participantId);

      if (error) throw error;

      addNotification('Participant désinscrit avec succès', 'success');
      setDeleteConfirmation(null);
      fetchParticipants();
    } catch (error) {
      console.error('Error unregistering participant:', error);
      addNotification(
        'Erreur lors de la désinscription du participant',
        'error'
      );
    }
  };

  const handleStatusChange = async (participantId: string, newStatus: string) => {
    if (!user) {
      addNotification('Vous devez être connecté pour modifier le statut', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('formation_participants')
        .update({ 
          statut: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('formation_id', formationId)
        .eq('participant_id', participantId)
        .eq('is_active', true);

      if (error) throw error;

      // Update local state immediately
      setParticipants(prevParticipants =>
        prevParticipants.map(participant =>
          participant.id === participantId
            ? { ...participant, statut: newStatus }
            : participant
        )
      );

      addNotification('Statut mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      addNotification(
        'Erreur lors de la mise à jour du statut',
        'error'
      );
      // Refresh participants list in case of error
      fetchParticipants();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'paid':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'paid':
        return 'Payé';
      default:
        return 'En attente';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-emerald-800">
          Participants ({filteredParticipants.length})
        </h3>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Inscrire un participant
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
          <input
            type="text"
            placeholder="Rechercher un participant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors appearance-none bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="paid">Payé</option>
          </select>
        </div>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== 'all' ? 'Aucun participant trouvé' : 'Aucun participant inscrit'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredParticipants.map((participant) => (
            <div
              key={participant.id}
              className="p-4 rounded-lg border border-emerald-100 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {participant.prenom} {participant.nom}
                    </div>
                    {participant.fonction && (
                      <div className="text-sm text-emerald-600">
                        {participant.fonction}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {formation?.type !== 'institut' && (
                    <div className="relative">
                      <select
                        value={participant.statut}
                        onChange={(e) => handleStatusChange(participant.id, e.target.value)}
                        className="appearance-none pl-8 pr-8 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="paid">Payé</option>
                      </select>
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                        {getStatusIcon(participant.statut)}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setDeleteConfirmation(participant.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-emerald-400" />
                  <a href={`mailto:${participant.email}`} className="hover:text-emerald-600">
                    {participant.email}
                  </a>
                </div>

                {participant.telephone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                    <a href={`tel:${participant.telephone}`} className="hover:text-emerald-600">
                      {participant.telephone}
                    </a>
                  </div>
                )}

                {participant.is_responsable && participant.nom_institution && (
                  <div className="flex items-center text-gray-600">
                    <Building2 className="w-4 h-4 mr-2 text-emerald-400" />
                    <span>{participant.nom_institution}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showRegisterModal && (
        <RegisterParticipantModal
          formationId={formationId}
          onClose={() => setShowRegisterModal(false)}
          onParticipantRegistered={fetchParticipants}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Confirmer la désinscription
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Êtes-vous sûr de vouloir désinscrire ce participant ? Cette action ne peut pas être annulée.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteConfirmation && handleUnregister(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Désinscrire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};