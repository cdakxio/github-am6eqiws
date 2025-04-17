import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Plus, Edit2, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

interface Parameter {
  id: string;
  type: string;
  code: string;
  libelle: string;
  ordre: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ParameterForm {
  type: string;
  code: string;
  libelle: string;
  ordre: number;
}

interface ParameterType {
  id: string;
  name: string;
  code: string;
}

const PARAMETER_TYPES: ParameterType[] = [
  { id: 'type_institution', name: "Type d'institution", code: 'type_institution' },
  { id: 'type_formation', name: 'Type de formation', code: 'type_formation' },
  { id: 'niveau_formation', name: 'Niveau de formation', code: 'niveau_formation' },
  { id: 'statut_formation', name: 'Statut de formation', code: 'statut_formation' }
];

export default function Parametres() {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [formData, setFormData] = useState<ParameterForm>({
    type: 'type_institution',
    code: '',
    libelle: '',
    ordre: 0
  });

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parametres')
        .select('*')
        .eq('is_active', true)
        .order('type')
        .order('ordre');

      if (error) throw error;

      setParameters(data || []);
    } catch (error) {
      console.error('Error fetching parameters:', error);
      addNotification(
        'Erreur lors du chargement des paramètres',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Vous devez être connecté pour gérer les paramètres', 'error');
      return;
    }

    try {
      setLoading(true);

      // Check if code already exists for the same type
      const existingParameter = parameters.find(
        p => p.code === formData.code && 
            p.type === formData.type && 
            (!editingId || p.id !== editingId)
      );

      if (existingParameter) {
        addNotification(
          'Un paramètre avec ce code existe déjà pour ce type',
          'error'
        );
        return;
      }

      const parameterData = {
        type: formData.type,
        code: formData.code,
        libelle: formData.libelle,
        ordre: formData.ordre
      };

      if (editingId) {
        // Update existing parameter
        const { error } = await supabase
          .from('parametres')
          .update({
            ...parameterData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)
          .eq('created_by', user.id);

        if (error) throw error;
      } else {
        // Create new parameter
        const { error } = await supabase
          .from('parametres')
          .insert([{
            ...parameterData,
            created_by: user.id
          }]);

        if (error) throw error;
      }

      addNotification(
        `Paramètre ${editingId ? 'modifié' : 'créé'} avec succès`,
        'success'
      );
      setShowForm(false);
      setEditingId(null);
      setFormData({
        type: 'type_institution',
        code: '',
        libelle: '',
        ordre: 0
      });
      fetchParameters();
    } catch (error) {
      console.error('Error saving parameter:', error);
      addNotification(
        error instanceof Error ? error.message : 'Une erreur est survenue',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (parameter: Parameter) => {
    setFormData({
      type: parameter.type,
      code: parameter.code,
      libelle: parameter.libelle,
      ordre: parameter.ordre
    });
    setEditingId(parameter.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      addNotification('Vous devez être connecté pour supprimer un paramètre', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('parametres')
        .update({ is_active: false })
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) throw error;

      addNotification('Paramètre supprimé avec succès', 'success');
      setDeleteConfirmation(null);
      fetchParameters();
    } catch (error) {
      console.error('Error deleting parameter:', error);
      addNotification(
        'Erreur lors de la suppression du paramètre',
        'error'
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ordre' ? parseInt(value) || 0 : value
    }));
  };

  const generateCode = (libelle: string) => {
    return libelle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const getParameterTypeName = (code: string) => {
    const type = PARAMETER_TYPES.find(t => t.code === code);
    return type ? type.name : code;
  };

  const groupedParameters = parameters.reduce((acc, parameter) => {
    if (!acc[parameter.type]) {
      acc[parameter.type] = [];
    }
    acc[parameter.type].push(parameter);
    return acc;
  }, {} as Record<string, Parameter[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Brain className="w-8 h-8 text-emerald-500" />
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-emerald-800">Paramètres</h1>
              <p className="text-sm text-emerald-500 mt-1">Gestion des paramètres système</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                type: 'type_institution',
                code: '',
                libelle: '',
                ordre: parameters.filter(p => p.type === 'type_institution').length + 1
              });
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Paramètre
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mt-6 p-6 bg-emerald-50 rounded-lg border border-emerald-100">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-emerald-700 mb-1">
                    Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  >
                    {PARAMETER_TYPES.map(type => (
                      <option key={type.id} value={type.code}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label htmlFor="libelle" className="block text-sm font-medium text-emerald-700 mb-1">
                    Libellé
                  </label>
                  <input
                    type="text"
                    id="libelle"
                    name="libelle"
                    value={formData.libelle}
                    onChange={(e) => {
                      handleChange(e);
                      if (!editingId) {
                        setFormData(prev => ({
                          ...prev,
                          code: generateCode(e.target.value)
                        }));
                      }
                    }}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="ordre" className="block text-sm font-medium text-emerald-700 mb-1">
                    Ordre
                  </label>
                  <input
                    type="number"
                    id="ordre"
                    name="ordre"
                    value={formData.ordre}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex items-center px-4 py-2 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 mr-2" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Parameters List */}
      {loading && !parameters.length ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedParameters).map(([type, params]) => (
            <div key={type} className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50">
                <h2 className="text-lg font-medium text-emerald-800">
                  {getParameterTypeName(type)}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Libellé</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Ordre</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {params.map((parameter) => (
                      <tr key={parameter.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{parameter.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{parameter.libelle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{parameter.ordre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(parameter)}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmation(parameter.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer ce paramètre ? Cette action ne peut pas être annulée.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteConfirmation && handleDelete(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}