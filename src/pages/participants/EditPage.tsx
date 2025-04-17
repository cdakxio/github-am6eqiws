import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Brain, Sparkles, Building2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface ParticipantForm {
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
}

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [institutionTypes, setInstitutionTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState<ParticipantForm>({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    fonction: '',
    is_responsable: false,
    type_institution: '',
    nom_institution: '',
    rue: '',
    code_postal: '',
    ville: '',
    telephone_institution: '',
    adresse_facturation: '',
    commentaire: ''
  });

  useEffect(() => {
    fetchParticipant();
    fetchInstitutionTypes();
  }, [id]);

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
      addNotification(
        'Erreur lors du chargement des types d\'institution',
        'error'
      );
    }
  };

  const fetchParticipant = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        addNotification('Participant non trouvé', 'error');
        navigate('/participants/liste');
        return;
      }

      setFormData({
        prenom: data.prenom,
        nom: data.nom,
        telephone: data.telephone || '',
        email: data.email,
        fonction: data.fonction || '',
        is_responsable: data.is_responsable,
        type_institution: data.type_institution || '',
        nom_institution: data.nom_institution || '',
        rue: data.rue || '',
        code_postal: data.code_postal || '',
        ville: data.ville || '',
        telephone_institution: data.telephone_institution || '',
        adresse_facturation: data.adresse_facturation || '',
        commentaire: data.commentaire || ''
      });
    } catch (error) {
      console.error('Error fetching participant:', error);
      addNotification(
        'Erreur lors du chargement du participant',
        'error'
      );
      navigate('/participants/liste');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour modifier un participant', 'error');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('participants')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      addNotification('Participant modifié avec succès', 'success');
      navigate('/participants/liste');
    } catch (error) {
      console.error('Error updating participant:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la modification du participant',
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

  if (loading && !formData.prenom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Brain className="w-8 h-8 text-emerald-500" />
            <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-emerald-800">Modifier le participant</h1>
            <p className="text-sm text-emerald-500 mt-1">
              {formData.prenom} {formData.nom}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Informations institution */}
          {formData.is_responsable && (
            <div className="space-y-6 border-t border-emerald-100 pt-6">
              <h2 className="text-lg font-medium text-emerald-800 mb-4">Informations de l'institution</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type_institution" className="block text-sm font-medium text-emerald-700 mb-1">
                    Type d'institution
                  </label>
                  <select
                    id="type_institution"
                    name="type_institution"
                    value={formData.type_institution}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  >
                    <option value="">Sélectionnez un type</option>
                    {institutionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nom_institution" className="block text-sm font-medium text-emerald-700 mb-1">
                    Nom de l'institution
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                    <input
                      type="text"
                      id="nom_institution"
                      name="nom_institution"
                      value={formData.nom_institution}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="rue" className="block text-sm font-medium text-emerald-700 mb-1">
                  Rue
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <input
                    type="text"
                    id="rue"
                    name="rue"
                    value={formData.rue}
                    onChange={handleChange}
                    required
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
                    required
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
                    required
                    className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telephone_institution" className="block text-sm font-medium text-emerald-700 mb-1">
                  Téléphone de l'institution
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <input
                    type="tel"
                    id="telephone_institution"
                    name="telephone_institution"
                    value={formData.telephone_institution}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="adresse_facturation" className="block text-sm font-medium text-emerald-700 mb-1">
                  Adresse de facturation (si différente)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                  <textarea
                    id="adresse_facturation"
                    name="adresse_facturation"
                    value={formData.adresse_facturation}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
              </div>
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
                  Modification...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}