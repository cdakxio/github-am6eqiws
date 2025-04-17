import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import FormationModal from './FormationModal';

interface Formation {
  id: string;
  titre: string;
  lieu: string;
  categorie: string;
  date: string;
  nombre_heures: number;
  adresse: string;
  code_postal: string;
  ville: string;
  url_visio: string;
  telephone: string;
  email: string;
}

interface Location {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
}

interface LocationFormationsModalProps {
  location: Location;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 5;

export const LocationFormationsModal: React.FC<LocationFormationsModalProps> = ({ location, onClose }) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'past' | 'future'>('future');
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [formationCoordinates, setFormationCoordinates] = useState<[number, number] | undefined>();
  const [showFormationsModal, setShowFormationsModal] = useState(true);

  useEffect(() => {
    fetchFormations();
  }, [location.id, searchTerm, currentPage, activeTab]);

  useEffect(() => {
    if (selectedFormation?.adresse && selectedFormation?.code_postal && selectedFormation?.ville) {
      const address = `${selectedFormation.adresse}, ${selectedFormation.code_postal} ${selectedFormation.ville}`;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
          if (data && data[0]) {
            setFormationCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        })
        .catch(error => {
          console.error('Error fetching coordinates:', error);
          setFormationCoordinates(undefined);
        });
    }
  }, [selectedFormation]);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data: formationsData, error: formationsError, count } = await supabase
        .from('formations')
        .select('*', { count: 'exact' })
        .eq('lieu_id', location.id)
        .eq('is_active', true)
        .ilike('titre', searchTerm ? `%${searchTerm}%` : '%')
        .gte('date', activeTab === 'future' ? today : '1900-01-01')
        .lt('date', activeTab === 'past' ? today : '2100-01-01')
        .order('date', { ascending: activeTab === 'future' })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (formationsError) throw formationsError;

      setFormations(formationsData || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFormationClick = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowFormationsModal(false);
  };

  const handleFormationModalClose = () => {
    setSelectedFormation(null);
    setFormationCoordinates(undefined);
    setShowFormationsModal(true);
  };

  if (!showFormationsModal) {
    return selectedFormation ? (
      <FormationModal
        formation={selectedFormation}
        onClose={handleFormationModalClose}
        coordinates={formationCoordinates}
      />
    ) : null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-medium text-emerald-800">{location.nom}</h2>
            <p className="text-sm text-emerald-500 mt-1">
              {location.adresse}, {location.code_postal} {location.ville}
            </p>
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
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setActiveTab('future');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'future'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Formations à venir
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('past');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'past'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Formations passées
                  </button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : formations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune formation {activeTab === 'future' ? 'à venir' : 'passée'} trouvée
                </div>
              ) : (
                <div className="space-y-4">
                  {formations.map((formation) => (
                    <div
                      key={formation.id}
                      className="p-4 rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors cursor-pointer"
                      onClick={() => handleFormationClick(formation)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-emerald-800">{formation.titre}</h4>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
                              <span>
                                {format(new Date(formation.date), 'dd MMMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                              <span>{formation.nombre_heures} heures</span>
                            </div>
                            {formation.lieu && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                                <span>{formation.lieu}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {formation.categorie && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {formation.categorie}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-1 text-sm text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-3 py-1 text-sm text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};