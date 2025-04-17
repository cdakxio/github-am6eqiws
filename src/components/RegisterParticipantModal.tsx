import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface Participant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  fonction?: string;
  is_responsable: boolean;
  nom_institution?: string;
}

interface RegisterParticipantModalProps {
  formationId: string;
  onClose: () => void;
  onParticipantRegistered: () => void;
}

export const RegisterParticipantModal: React.FC<RegisterParticipantModalProps> = ({
  formationId,
  onClose,
  onParticipantRegistered
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchParticipants();
    } else {
      setParticipants([]);
    }
  }, [searchTerm]);

  const searchParticipants = async () => {
    try {
      setLoading(true);
      
      // First, get already registered participants
      const { data: registered } = await supabase
        .from('formation_participants')
        .select('participant_id')
        .eq('formation_id', formationId)
        .eq('is_active', true);

      const registeredIds = registered?.map(r => r.participant_id) || [];

      // Then, search for participants not already registered
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('is_active', true)
        .not('id', 'in', `(${registeredIds.join(',')})`)
        .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('nom')
        .limit(5);

      if (error) throw error;

      setParticipants(data || []);
    } catch (error) {
      console.error('Error searching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (participant: Participant) => {
    if (!user) {
      addNotification('Vous devez être connecté pour inscrire un participant', 'error');
      return;
    }

    try {
      setRegistering(true);

      const { error } = await supabase
        .from('formation_participants')
        .insert([{
          formation_id: formationId,
          participant_id: participant.id,
          created_by: user.id
        }]);

      if (error) throw error;

      addNotification('Participant inscrit avec succès', 'success');
      onParticipantRegistered();
      onClose();
    } catch (error) {
      console.error('Error registering participant:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription',
        'error'
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-medium text-emerald-800">Inscrire un participant</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
            <input
              type="text"
              placeholder="Rechercher un participant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              </div>
            ) : participants.length === 0 ? (
              searchTerm.length >= 2 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucun participant trouvé
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Commencez à taper pour rechercher un participant
                </div>
              )
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {participant.prenom} {participant.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {participant.email}
                    </div>
                    {participant.fonction && (
                      <div className="text-sm text-emerald-600">
                        {participant.fonction}
                      </div>
                    )}
                    {participant.is_responsable && participant.nom_institution && (
                      <div className="text-sm text-gray-500">
                        {participant.nom_institution}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRegister(participant)}
                    disabled={registering}
                    className="flex items-center px-3 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        <span>Inscrire</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};