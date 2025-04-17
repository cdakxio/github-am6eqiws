import React from 'react';
import { X, Mail, Phone, MapPin, Building2, FileText, User } from 'lucide-react';

interface Participant {
  id: string;
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

interface ParticipantModalProps {
  participant: Participant;
  onClose: () => void;
}

const ParticipantModal: React.FC<ParticipantModalProps> = ({ participant, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-emerald-800">
                {participant.prenom} {participant.nom}
              </h2>
              {participant.is_responsable && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-1">
                  Responsable
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-emerald-800 mb-4">Informations de contact</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-5 h-5 mr-3 text-emerald-500" />
                  <a href={`mailto:${participant.email}`} className="hover:text-emerald-600">
                    {participant.email}
                  </a>
                </div>

                {participant.telephone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-3 text-emerald-500" />
                    <a href={`tel:${participant.telephone}`} className="hover:text-emerald-600">
                      {participant.telephone}
                    </a>
                  </div>
                )}

                {participant.fonction && (
                  <div className="flex items-center text-gray-600">
                    <User className="w-5 h-5 mr-3 text-emerald-500" />
                    <span>{participant.fonction}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Institution Information */}
            {participant.is_responsable && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-emerald-800 mb-4">Informations de l'institution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-gray-600">
                      <Building2 className="w-5 h-5 mr-3 text-emerald-500" />
                      <div>
                        <p className="font-medium">{participant.nom_institution}</p>
                        <p className="text-sm text-emerald-600">{participant.type_institution}</p>
                      </div>
                    </div>
                  </div>

                  {(participant.rue || participant.code_postal || participant.ville) && (
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-5 h-5 mr-3 mt-0.5 text-emerald-500" />
                      <div>
                        {participant.rue && <p>{participant.rue}</p>}
                        {(participant.code_postal || participant.ville) && (
                          <p>{participant.code_postal} {participant.ville}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {participant.telephone_institution && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-5 h-5 mr-3 text-emerald-500" />
                      <a href={`tel:${participant.telephone_institution}`} className="hover:text-emerald-600">
                        {participant.telephone_institution}
                      </a>
                    </div>
                  )}

                  {participant.adresse_facturation && (
                    <div className="flex items-start text-gray-600">
                      <FileText className="w-5 h-5 mr-3 mt-0.5 text-emerald-500" />
                      <div>
                        <p className="font-medium mb-1">Adresse de facturation</p>
                        <p className="whitespace-pre-wrap">{participant.adresse_facturation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            {participant.commentaire && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-emerald-800 mb-4">Commentaire</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 whitespace-pre-wrap">{participant.commentaire}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantModal;