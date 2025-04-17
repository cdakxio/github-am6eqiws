import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

interface Location {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  type: string;
}

interface Contact {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
}

interface CreateLocationModalProps {
  onClose: () => void;
  onLocationCreated: (location: Location) => void;
  initialLocation?: Location;
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  onClose,
  onLocationCreated,
  initialLocation
}) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [formData, setFormData] = useState<Omit<Location, 'id' | 'created_at' | 'is_active'>>({
    nom: initialLocation?.nom || '',
    adresse: initialLocation?.adresse || '',
    code_postal: initialLocation?.code_postal || '',
    ville: initialLocation?.ville || '',
    type: initialLocation?.type || 'in_situ'
  });

  const searchContacts = async (term: string) => {
    if (term.length < 2) return;

    try {
      const { data, error } = await supabase
        .from('participants')
        .select('id, prenom, nom, email, telephone')
        .eq('is_active', true)
        .eq('is_responsable', true)
        .or(`nom.ilike.%${term}%,prenom.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(5);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error searching contacts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour créer un lieu', 'error');
      return;
    }

    if (!selectedContact) {
      addNotification('Veuillez sélectionner un contact responsable', 'error');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = initialLocation
        ? await supabase
            .from('lieux')
            .update({
              ...formData,
              updated_by: user.id
            })
            .eq('id', initialLocation.id)
            .select()
            .single()
        : await supabase
            .from('lieux')
            .insert([{
              ...formData,
              created_by: user.id,
              is_active: true
            }])
            .select()
            .single();

      if (error) throw error;

      if (data) {
        onLocationCreated(data);
        addNotification(
          initialLocation 
            ? 'Lieu modifié avec succès'
            : 'Lieu créé avec succès',
          'success'
        );
      }
    } catch (error) {
      console.error('Error creating/updating location:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-medium text-emerald-800 mb-6">
            {initialLocation ? 'Modifier le lieu' : 'Nouveau lieu'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-emerald-700 mb-1">
                Nom du lieu
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                placeholder="Nom du lieu"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-emerald-700 mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
              >
                <option value="">Sélectionner un type</option>
                <option value="in_situ">In-Situ</option>
                <option value="formation_ouverte">Formation Ouverte</option>
              </select>
            </div>

            <div>
              <label htmlFor="adresse" className="block text-sm font-medium text-emerald-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                placeholder="Adresse"
              />
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
                  placeholder="Code postal"
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
                  placeholder="Ville"
                />
              </div>
            </div>

            {/* Contact Responsable */}
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-1">
                Contact Responsable
              </label>
              {selectedContact ? (
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-emerald-800">
                        {selectedContact.prenom} {selectedContact.nom}
                      </p>
                      <p className="text-sm text-emerald-600">{selectedContact.email}</p>
                      {selectedContact.telephone && (
                        <p className="text-sm text-emerald-600">{selectedContact.telephone}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedContact(null)}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      Changer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un contact responsable..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      searchContacts(e.target.value);
                      setShowContactSearch(true);
                    }}
                    onFocus={() => setShowContactSearch(true)}
                    className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                  {showContactSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-emerald-100">
                      {contacts.length > 0 ? (
                        <ul className="py-1">
                          {contacts.map((contact) => (
                            <li
                              key={contact.id}
                              className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                              onClick={() => {
                                setSelectedContact(contact);
                                setSearchTerm('');
                                setShowContactSearch(false);
                              }}
                            >
                              <div className="font-medium text-emerald-800">
                                {contact.prenom} {contact.nom}
                              </div>
                              <div className="text-sm text-emerald-600">{contact.email}</div>
                            </li>
                          ))}
                        </ul>
                      ) : searchTerm.length >= 2 ? (
                        <div className="p-4 text-center">
                          <p className="text-gray-500 mb-2">Aucun contact responsable trouvé</p>
                          <button
                            type="button"
                            onClick={() => {
                              // Navigate to new contact page
                              window.location.href = '/participants/nouveau';
                            }}
                            className="flex items-center justify-center px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Créer un nouveau contact
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !selectedContact}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};