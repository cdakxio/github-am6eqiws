import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, MapPin, Search, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface Contact {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
}

interface LocationForm {
  nom: string;
  type: string;
  adresse: string;
  code_postal: string;
  ville: string;
  contact_id: string | null;
}

export default function NouvellePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [formData, setFormData] = useState<LocationForm>({
    nom: '',
    type: 'in_situ',
    adresse: '',
    code_postal: '',
    ville: '',
    contact_id: null
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

      const { data, error } = await supabase
        .from('lieux')
        .insert([{
          ...formData,
          contact_id: selectedContact.id,
          created_by: user.id,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      addNotification('Lieu créé avec succès', 'success');
      navigate('/lieux/liste');
    } catch (error) {
      console.error('Error creating location:', error);
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Brain className="w-8 h-8 text-emerald-500" />
            <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-emerald-800">Nouveau lieu</h1>
            <p className="text-sm text-emerald-500 mt-1">Créer un nouveau lieu</p>
          </div>
        </div>
        
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
              <option value="in_situ">In-Situ</option>
              <option value="formation_ouverte">Formation Ouverte</option>
            </select>
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
                placeholder="Adresse"
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
              onClick={() => navigate('/lieux/liste')}
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
                  Création...
                </>
              ) : (
                'Créer le lieu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}