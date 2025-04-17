import React, { useState } from 'react';
import { X, Calendar, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface Formation {
  id: string;
  titre: string;
  lieu_id: string | null;
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
  type: string;
}

interface DuplicateFormationModalProps {
  formation: Formation;
  onClose: () => void;
  onDuplicated: (newFormation: Formation) => void;
}

export const DuplicateFormationModal: React.FC<DuplicateFormationModalProps> = ({
  formation,
  onClose,
  onDuplicated
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour dupliquer une formation', 'error');
      return;
    }

    try {
      setLoading(true);

      // Create new formation
      const { data: newFormation, error: formationError } = await supabase
        .from('formations')
        .insert([{
          titre: formation.titre,
          lieu_id: formation.lieu_id,
          categorie: formation.categorie,
          date: newDate,
          nombre_heures: formation.nombre_heures,
          nombre_places: formation.nombre_places,
          url_visio: formation.url_visio,
          telephone: formation.telephone,
          email: formation.email,
          prix_unitaire: formation.prix_unitaire,
          prix_total: formation.prix_total,
          prix_htva: formation.prix_htva,
          type: formation.type,
          created_by: user.id,
          rating: 0
        }])
        .select()
        .single();

      if (formationError) throw formationError;

      // Get formateurs for the original formation
      const { data: formateurs, error: formateursError } = await supabase
        .from('formation_formateurs')
        .select('formateur_id')
        .eq('formation_id', formation.id);

      if (formateursError) throw formateursError;

      // Assign the same formateurs to the new formation
      if (formateurs && formateurs.length > 0) {
        const { error: relationError } = await supabase
          .from('formation_formateurs')
          .insert(
            formateurs.map(f => ({
              formation_id: newFormation.id,
              formateur_id: f.formateur_id,
              created_by: user.id
            }))
          );

        if (relationError) throw relationError;
      }

      addNotification('Formation dupliquée avec succès', 'success');
      onDuplicated(newFormation);
      onClose();
    } catch (error) {
      console.error('Error duplicating formation:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la duplication',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-medium text-emerald-800">Nouvelle date</h2>
            <p className="text-sm text-emerald-500 mt-1">Dupliquer la formation</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-1">
                Formation à dupliquer
              </label>
              <div className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {formation.titre}
              </div>
            </div>

            <div>
              <label htmlFor="newDate" className="block text-sm font-medium text-emerald-700 mb-1">
                Nouvelle date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="date"
                  id="newDate"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !newDate}
              className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Duplication...
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Dupliquer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};