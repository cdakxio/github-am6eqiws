import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Building2, User, Phone, Mail, MapPin, FileText, Calendar, Clock, Video, Users, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LocationSelector } from '../../components/LocationSelector';
import { CreateLocationModal } from '../../components/CreateLocationModal';
import { FormateurSelector } from '../../components/FormateurSelector';

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

interface FormationForm {
  titre: string;
  lieu_id: string | null;
  categorie: string;
  date: string;
  nombreHeures: number;
  nombrePlaces: number | null;
  urlVisio: string;
  telephone: string;
  email: string;
  prixUnitaire: number | null;
  prixTotal: number | null;
  prixHtva: boolean;
}

const NouvellePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedFormateurs, setSelectedFormateurs] = useState<Formateur[]>([]);
  const [formData, setFormData] = useState<FormationForm>({
    titre: '',
    lieu_id: null,
    categorie: '',
    date: '',
    nombreHeures: 0,
    nombrePlaces: null,
    urlVisio: '',
    telephone: '',
    email: '',
    prixUnitaire: null,
    prixTotal: null,
    prixHtva: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour créer une formation', 'error');
      return;
    }

    try {
      setLoading(true);

      // Insert formation
      const { data: formation, error: formationError } = await supabase
        .from('formations')
        .insert([{
          titre: formData.titre,
          lieu_id: formData.lieu_id,
          categorie: formData.categorie,
          date: formData.date,
          nombre_heures: formData.nombreHeures,
          nombre_places: formData.nombrePlaces,
          url_visio: formData.urlVisio,
          telephone: formData.telephone,
          email: formData.email,
          prix_unitaire: formData.prixUnitaire,
          prix_total: formData.prixTotal,
          prix_htva: formData.prixHtva,
          created_by: user.id,
          type: 'standard',
          rating: 0
        }])
        .select()
        .single();

      if (formationError) throw formationError;

      // Insert formateur relationships
      if (selectedFormateurs.length > 0) {
        const { error: relationError } = await supabase
          .from('formation_formateurs')
          .insert(
            selectedFormateurs.map(formateur => ({
              formation_id: formation.id,
              formateur_id: formateur.id,
              created_by: user.id
            }))
          );

        if (relationError) throw relationError;
      }

      addNotification('Formation créée avec succès', 'success');
      navigate('/formations/liste');
    } catch (error) {
      console.error('Error creating formation:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de la formation',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'prixUnitaire') {
      // Clear prixTotal when setting prixUnitaire
      setFormData(prev => ({
        ...prev,
        prixUnitaire: value ? parseInt(value) : null,
        prixTotal: null
      }));
    } else if (name === 'prixTotal') {
      // Clear prixUnitaire when setting prixTotal
      setFormData(prev => ({
        ...prev,
        prixTotal: value ? parseInt(value) : null,
        prixUnitaire: null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? null : parseInt(value)) : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                value
      }));
    }
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

  const handleFormateurSelect = (formateur: Formateur) => {
    setSelectedFormateurs(prev => [...prev, formateur]);
  };

  const handleFormateurRemove = (formateurId: string) => {
    setSelectedFormateurs(prev => prev.filter(f => f.id !== formateurId));
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
            <h1 className="text-2xl font-medium text-emerald-800">Nouvelle Formation</h1>
            <p className="text-sm text-emerald-500 mt-1">Créer une nouvelle formation</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-emerald-700 mb-1">
              Titre de la formation
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
              placeholder="Entrez le titre de la formation"
            />
          </div>

          {/* Lieu et Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-1">
                Lieu
              </label>
              <LocationSelector
                onSelect={handleLocationSelect}
                onCreateNew={() => setShowCreateLocation(true)}
              />
            </div>
            <div>
              <label htmlFor="categorie" className="block text-sm font-medium text-emerald-700 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                id="categorie"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                placeholder="Catégorie"
              />
            </div>
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

          {/* Formateurs */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">
              Formateurs
            </label>
            <FormateurSelector
              selectedFormateurs={selectedFormateurs}
              onSelect={handleFormateurSelect}
              onRemove={handleFormateurRemove}
            />
          </div>

          {/* Date, Heures et Places */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-emerald-700 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="nombreHeures" className="block text-sm font-medium text-emerald-700 mb-1">
                Nombre d'heures
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="number"
                  id="nombreHeures"
                  name="nombreHeures"
                  value={formData.nombreHeures}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="nombrePlaces" className="block text-sm font-medium text-emerald-700 mb-1">
                Nombre de places
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="number"
                  id="nombrePlaces"
                  name="nombrePlaces"
                  value={formData.nombrePlaces === null ? '' : formData.nombrePlaces}
                  onChange={handleChange}
                  min="1"
                  placeholder="Illimité"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Prix */}
          <div className="space-y-4 border-t border-emerald-100 pt-6">
            <h3 className="text-lg font-medium text-emerald-800 mb-4">Tarification</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prixUnitaire" className="block text-sm font-medium text-emerald-700 mb-1">
                  Prix par personne (€)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <input
                    type="number"
                    id="prixUnitaire"
                    name="prixUnitaire"
                    value={formData.prixUnitaire === null ? '' : formData.prixUnitaire}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Prix unitaire"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="prixTotal" className="block text-sm font-medium text-emerald-700 mb-1">
                  Prix total (€)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <input
                    type="number"
                    id="prixTotal"
                    name="prixTotal"
                    value={formData.prixTotal === null ? '' : formData.prixTotal}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Prix total"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="prixHtva"
                name="prixHtva"
                checked={formData.prixHtva}
                onChange={handleChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="prixHtva" className="ml-2 block text-sm text-gray-900">
                Prix HTVA
              </label>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="urlVisio" className="block text-sm font-medium text-emerald-700 mb-1">
                URL Visioconférence
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="url"
                  id="urlVisio"
                  name="urlVisio"
                  value={formData.urlVisio}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  placeholder="URL de la visioconférence"
                />
              </div>
            </div>
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
                  placeholder="Numéro de téléphone"
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  placeholder="Adresse email"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => navigate('/formations/liste')}
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
                'Créer la formation'
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
};

export default NouvellePage;