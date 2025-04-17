import React, { useState } from 'react';
import { Mail, Brain, Loader2, X, Save } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import parse from 'html-react-parser';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Email {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
  response?: string;
  response_at?: string;
  response_by?: string;
}

interface EmailModalProps {
  email: Email;
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ email, onClose }) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(email.response || null);
  const [editedResponse, setEditedResponse] = useState<string>(email.response || '');

  const handleGenerateResponse = async () => {
    try {
      setLoading(true);

      // First, parse the HTML content to get plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = email.body;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';

      const response = await axios.get(
        'https://n8n.ia-temis.be/webhook/188973f9-6721-4a0e-a90c-d6a97f1f58f7',
        {
          params: {
            message: plainText
          }
        }
      );

      console.log('AI Response:', response.data);
      
      // Handle different response formats
      let responseText = '';
      if (Array.isArray(response.data)) {
        responseText = response.data[0]?.output || response.data[0] || '';
      } else if (typeof response.data === 'object') {
        responseText = response.data.output || JSON.stringify(response.data);
      } else {
        responseText = String(response.data);
      }

      setAiResponse(responseText);
      setEditedResponse(responseText);
      addNotification(
        'Réponse générée avec succès',
        'success',
        {
          table: 'Emails',
          action: 'Génération',
          details: 'IA'
        }
      );
    } catch (error) {
      console.error('Error generating response:', error);
      addNotification(
        'Erreur lors de la génération de la réponse',
        'error',
        {
          table: 'Emails',
          action: 'Génération',
          details: 'IA'
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!user) {
      addNotification('Vous devez être connecté pour enregistrer une réponse', 'error');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('emails')
        .update({
          response: editedResponse,
          response_at: new Date().toISOString(),
          response_by: user.id
        })
        .eq('id', email.id);

      if (error) throw error;

      addNotification('Réponse enregistrée avec succès', 'success');
      onClose();
    } catch (error) {
      console.error('Error saving response:', error);
      addNotification(
        'Erreur lors de l\'enregistrement de la réponse',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Mail className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-emerald-800">Détails de l'email</h2>
              <p className="text-sm text-emerald-500 mt-1">
                {format(new Date(email.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Email Details */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  De
                </label>
                <div className="text-gray-900">{email.from_email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  À
                </label>
                <div className="text-gray-900">{email.to_email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Sujet
                </label>
                <div className="text-gray-900">{email.subject}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1">
                  Message
                </label>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-900 min-h-[200px] overflow-auto">
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
                    {parse(email.body)}
                  </div>
                </div>
              </div>
            </div>

            {/* Response Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-emerald-700">
                  {aiResponse ? 'Réponse générée' : 'Réponse'}
                </label>
                <button
                  onClick={handleSaveResponse}
                  disabled={saving || !editedResponse}
                  className="flex items-center px-3 py-1 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-gray-900">
                <textarea
                  value={editedResponse}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  className="w-full min-h-[200px] bg-transparent border-0 focus:ring-0 text-sm resize-none"
                  placeholder="Modifiez la réponse ici..."
                />
              </div>
              {email.response_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Dernière modification le {format(new Date(email.response_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleGenerateResponse}
              disabled={loading}
              className="relative px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Générer une réponse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;