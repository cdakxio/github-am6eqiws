import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Building2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LocationSelector } from '../../components/LocationSelector';
import { CreateLocationModal } from '../../components/CreateLocationModal';

interface Location {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
}

interface ParticipantForm {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  fonction: string;
  type: 'particulier' | 'contact' | 'participant';
  is_responsable: boolean;
  lieu_id: string | null;
  commentaire: string;
}

export default function NouvellePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<ParticipantForm>({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    fonction: '',
    type: 'particulier',
    is_responsable: false,
    lieu_id: null,
    commentaire: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour créer un contact', 'error');
      return;
    }

    if (!formData.lieu_id) {
      addNotification('Veuillez sélectionner un lieu', 'error');
      return;
    }

    try {
      setLoading(true);

      // Create participant
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert([{
          ...formData,
          created_by: user.id
        }])
        .select()
        .single();

      if (participantError) throw participantError;

      addNotification('Contact créé avec succès', 'success');
      navigate('/participants/liste');
    } catch (error) {
      console.error('Error creating contact:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du contact',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      lieu_id: location.id,
      telephone: location.telephone || prev.telephone,
      email: location.email || prev.email
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Brain className="w-8 h-8 text-emerald-500" />
            <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-emerald-800">Nouveau Contact</h1>
            <p className="text-sm text-emerald-500 mt-1">Créer un nouveau contact</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de contact */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-emerald-700 mb-1">
              Type de contact
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
            >
              <option value="particulier">Particulier</option>
              <option value="contact">Personne de contact</option>
              <option value="participant">Participant</option>
            </select>
          </div>

          {/* Lieu (obligatoire) */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">
              Lieu
            </label>
            <LocationSelector
              onSelect={handleLocationSelect}
              onCreateNew={() => setShowCreateLocation(true)}
            />
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="font-medium text-emerald-800 mb-2">Lieu sélectionné</h3>
              <div className="text-sm text-emerald-600">
                <p>{selectedLocation.nom}</p>
                <p>{selectedLocation.adresse}</p>
                <p>{selectedLocation.code_postal} {selectedLocation.ville}</p>
              </div>
            </div>
          )}

          {/* Informations personnelles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-emerald-700 mb-1">
                Prénom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-emerald-700 mb-1">
                Nom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-emerald-700 mb-1">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-emerald-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="fonction" className="block text-sm font-medium text-emerald-700 mb-1">
              Fonction
            </label>
            <input
              type="text"
              id="fonction"
              name="fonction"
              value={formData.fonction}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
            />
          </div>

          {formData.type === 'contact' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_responsable"
                name="is_responsable"
                checked={formData.is_responsable}
                onChange={handleChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="is_responsable" className="ml-2 block text-sm text-gray-900">
                Responsable
              </label>
            </div>
          )}

          <div>
            <label htmlFor="commentaire" className="block text-sm font-medium text-emerald-700 mb-1">
              Commentaire éventuel
            </label>
            <textarea
              id="commentaire"
              name="commentaire"
              value={formData.commentaire}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => navigate('/participants/liste')}
              className="px-4 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Création...
                </>
              ) : (
                'Créer le contact'
              )}
            </button>
          </div>
        </form>
      </div>

      {showCreateLocation && (
        <CreateLocationModal
          onClose={() => setShowCreateLocation(false)}
          onLocationCreated={(location) => {
            handleLocationSelect(location);
            setShowCreateLocation(false);
          }}
        />
      )}
    </div>
  );
}