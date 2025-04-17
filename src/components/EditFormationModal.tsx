import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, Phone, Mail, Users, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { LocationSelector } from './LocationSelector';
import { CreateLocationModal } from './CreateLocationModal';
import { FormateurSelector } from './FormateurSelector';

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
  prix_unitaire: number | null;
  prix_total: number | null;
  prix_htva: boolean;
}

interface EditFormationModalProps {
  formation: Formation;
  onClose: () => void;
  onFormationUpdated: (formation: Formation) => void;
}

export const EditFormationModal: React.FC<EditFormationModalProps> = ({
  formation,
  onClose,
  onFormationUpdated,
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedFormateurs, setSelectedFormateurs] = useState<Formateur[]>([]);
  const [formData, setFormData] = useState({
    titre: formation.titre,
    lieu_id: formation.lieu_id,
    categorie: formation.categorie,
    date: formation.date,
    nombre_heures: formation.nombre_heures,
    nombre_places: formation.nombre_places,
    url_visio: formation.url_visio || '',
    telephone: formation.telephone || '',
    email: formation.email || '',
    prix_unitaire: formation.prix_unitaire,
    prix_total: formation.prix_total,
    prix_htva: formation.prix_htva
  });

  useEffect(() => {
    const fetchLocation = async () => {
      if (formation.lieu_id) {
        const { data, error } = await supabase
          .from('lieux')
          .select('*')
          .eq('id', formation.lieu_id)
          .single();

        if (!error && data) {
          setSelectedLocation(data);
        }
      }
    };

    const fetchFormateurs = async () => {
      const { data, error } = await supabase
        .from('formation_formateurs')
        .select(`
          formateur_id,
          formateurs:formateur_id (*)
        `)
        .eq('formation_id', formation.id);

      if (!error && data) {
        const formateurs = data.map(item => item.formateurs as Formateur);
        setSelectedFormateurs(formateurs);
      }
    };

    fetchLocation();
    fetchFormateurs();
  }, [formation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour modifier une formation', 'error');
      return;
    }

    try {
      setLoading(true);

      // Update formation
      const { error: formationError } = await supabase
        .from('formations')
        .update({
          titre: formData.titre,
          lieu_id: formData.lieu_id,
          categorie: formData.categorie,
          date: formData.date,
          nombre_heures: formData.nombre_heures,
          nombre_places: formData.nombre_places,
          url_visio: formData.url_visio,
          telephone: formData.telephone,
          email: formData.email,
          prix_unitaire: formData.prix_unitaire,
          prix_total: formData.prix_total,
          prix_htva: formData.prix_htva
        })
        .eq('id', formation.id);

      if (formationError) throw formationError;

      // Update formateur relationships
      // First, remove all existing relationships
      const { error: deleteError } = await supabase
        .from('formation_formateurs')
        .delete()
        .eq('formation_id', formation.id);

      if (deleteError) throw deleteError;

      // Then, insert new relationships
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

      addNotification('Formation modifiée avec succès', 'success');
      onFormationUpdated({
        ...formation,
        ...formData,
      });
      onClose();
    } catch (error) {
      console.error('Error updating formation:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la modification de la formation',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'prix_unitaire') {
      // Clear prix_total when setting prix_unitaire
      setFormData(prev => ({
        ...prev,
        prix_unitaire: value ? parseInt(value) : null,
        prix_total: null
      }));
    } else if (name === 'prix_total') {
      // Clear prix_unitaire when setting prix_total
      setFormData(prev => ({
        ...prev,
        prix_total: value ? parseInt(value) : null,
        prix_unitaire: null
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-medium text-emerald-800">Modifier la formation</h2>
            <p className="text-sm text-emerald-500 mt-1">{formation.titre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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
                <label htmlFor="nombre_heures" className="block text-sm font-medium text-emerald-700 mb-1">
                  Nombre d'heures
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <input
                    type="number"
                    id="nombre_heures"
                    name="nombre_heures"
                    value={formData.nombre_heures}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="nombre_places" className="block text-sm font-medium text-emerald-700 mb-1">
                  Nombre de places
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <input
                    type="number"
                    id="nombre_places"
                    name="nombre_places"
                    value={formData.nombre_places === null ? '' : formData.nombre_places}
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
                  <label htmlFor="prix_unitaire" className="block text-sm font-medium text-emerald-700 mb-1">
                    Prix par personne (€)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                    <input
                      type="number"
                      id="prix_unitaire"
                      name="prix_unitaire"
                      value={formData.prix_unitaire === null ? '' : formData.prix_unitaire}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Prix unitaire"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="prix_total" className="block text-sm font-medium text-emerald-700 mb-1">
                    Prix total (€)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                    <input
                      type="number"
                      id="prix_total"
                      name="prix_total"
                      value={formData.prix_total === null ? '' : formData.prix_total}
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
                  id="prix_htva"
                  name="prix_htva"
                  checked={formData.prix_htva}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="prix_htva" className="ml-2 block text-sm text-gray-900">
                  Prix HTVA
                </label>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="url_visio" className="block text-sm font-medium text-emerald-700 mb-1">
                  URL Visioconférence
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <input
                    type="url"
                    id="url_visio"
                    name="url_visio"
                    value={formData.url_visio}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
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
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
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
                    Modification...
                  </>
                ) : (
                  'Modifier'
                )}
              </button>
            </div>
          </form>
        </div>
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