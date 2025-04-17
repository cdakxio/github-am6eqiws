import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  code_postal: string;
  ville: string;
}

interface EditFormateurModalProps {
  formateur: Formateur;
  onClose: () => void;
  onFormateurUpdated: (formateur: Formateur) => void;
}

export const EditFormateurModal: React.FC<EditFormateurModalProps> = ({
  formateur,
  onClose,
  onFormateurUpdated
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: formateur.nom,
    prenom: formateur.prenom,
    email: formateur.email,
    telephone: formateur.telephone || '',
    adresse: formateur.adresse || '',
    code_postal: formateur.code_postal || '',
    ville: formateur.ville || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour modifier un formateur', 'error');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('formateurs')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', formateur.id)
        .select()
        .single();

      if (error) throw error;

      addNotification(
        'Formateur modifié avec succès',
        'success',
        {
          table: 'Formateurs',
          action: 'Modification',
          details: `${formData.prenom} ${formData.nom}`
        }
      );
      
      onFormateurUpdated(data);
    } catch (error) {
      console.error('Error updating formateur:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la modification',
        'error',
        {
          table: 'Formateurs',
          action: 'Modification',
          details: 'Erreur'
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-medium text-emerald-800">Modifier le formateur</h2>
            <p className="text-sm text-emerald-500 mt-1">
              {formateur.prenom} {formateur.nom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <label htmlFor="adresse" className="block text-sm font-medium text-emerald-700 mb-1">
              Adresse
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="code_postal" className="block text-sm font-medium text-emerald-700 mb-1">
                Code postal
              </label>
              <input
                type="text"
                id="code_postal"
                name="code_postal"
                value={formData.code_postal}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="ville" className="block text-sm font-medium text-emerald-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                id="ville"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
              />
            </div>
          </div>

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
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};