import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Mail, Phone, Video, Users, Route, UserCog, Star } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import FormateurModal from './FormateurModal';
import { FormationParticipants } from './FormationParticipants';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_KEY = '5b3ce3597851110001cf62480c0b97ec9e3e477389ee9d503af5b5da';

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
  telephone: string;
  adresse: string;
  code_postal: string;
  ville: string;
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
  type: string;
  rating: number;
}

interface FormationModalProps {
  formation: Formation;
  onClose: () => void;
  coordinates?: [number, number];
  onFormationUpdated?: (formation: Formation) => void;
}

const FormationModal: React.FC<FormationModalProps> = ({ 
  formation, 
  onClose, 
  coordinates: initialCoordinates,
  onFormationUpdated 
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [distances, setDistances] = useState<{[key: string]: number}>({});
  const [routes, setRoutes] = useState<{[key: string]: [number, number][]}>({}); 
  const [selectedFormateur, setSelectedFormateur] = useState<string | null>(null);
  const [formateurCoordinates, setFormateurCoordinates] = useState<{[key: string]: [number, number]}>({});
  const [showFormateurModal, setShowFormateurModal] = useState(false);
  const [selectedFormateurDetails, setSelectedFormateurDetails] = useState<Formateur | null>(null);
  const [locationData, setLocationData] = useState<Location | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>(initialCoordinates);
  const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [newRating, setNewRating] = useState(formation.rating);
  const [updatingRating, setUpdatingRating] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      if (formation.lieu_id) {
        const { data, error } = await supabase
          .from('lieux')
          .select('*')
          .eq('id', formation.lieu_id)
          .single();

        if (!error && data) {
          setLocationData(data);
          if (!coordinates) {
            // Get coordinates for the location
            const address = `${data.adresse}, ${data.code_postal} ${data.ville}`;
            try {
              const response = await axios.get(`https://api.openrouteservice.org/geocode/search`, {
                params: {
                  api_key: API_KEY,
                  text: address,
                  size: 1
                }
              });

              if (response.data.features.length > 0) {
                const [lon, lat] = response.data.features[0].geometry.coordinates;
                setCoordinates([lat, lon]);
              }
            } catch (error) {
              console.error('Error getting location coordinates:', error);
            }
          }
        }
      }
    };

    if (!formation.lieu) {
      fetchLocation();
    } else {
      setLocationData(formation.lieu);
      if (!coordinates) {
        // Get coordinates for the location
        const address = `${formation.lieu.adresse}, ${formation.lieu.code_postal} ${formation.lieu.ville}`;
        axios.get(`https://api.openrouteservice.org/geocode/search`, {
          params: {
            api_key: API_KEY,
            text: address,
            size: 1
          }
        }).then(response => {
          if (response.data.features.length > 0) {
            const [lon, lat] = response.data.features[0].geometry.coordinates;
            setCoordinates([lat, lon]);
          }
        }).catch(error => {
          console.error('Error getting location coordinates:', error);
        });
      }
    }
  }, [formation, coordinates]);

  useEffect(() => {
    const fetchFormateurs = async () => {
      const { data, error } = await supabase
        .from('formation_formateurs')
        .select(`
          formateur_id,
          formateurs:formateur_id (*)
        `)
        .eq('formation_id', formation.id);

      if (!error && data) {
        const formateursList = data.map(item => item.formateurs as Formateur);
        setFormateurs(formateursList);

        // Get coordinates for each formateur
        formateursList.forEach(async (formateur) => {
          const formateurAddress = `${formateur.adresse}, ${formateur.code_postal} ${formateur.ville}`;
          try {
            const response = await axios.get(`https://api.openrouteservice.org/geocode/search`, {
              params: {
                api_key: API_KEY,
                text: formateurAddress,
                size: 1
              }
            });

            if (response.data.features.length > 0) {
              const [lon, lat] = response.data.features[0].geometry.coordinates;
              const formateurCoords: [number, number] = [lat, lon];
              
              setFormateurCoordinates(prev => ({
                ...prev,
                [formateur.id]: formateurCoords
              }));

              // If we have both formation and formateur coordinates, calculate route
              if (coordinates) {
                const routeResponse = await axios.get(`https://api.openrouteservice.org/v2/directions/driving-car`, {
                  params: {
                    api_key: API_KEY,
                    start: `${coordinates[1]},${coordinates[0]}`,
                    end: `${lon},${lat}`
                  }
                });

                if (routeResponse.data.features.length > 0) {
                  const route = routeResponse.data.features[0];
                  const distance = route.properties.segments[0].distance / 1000; // Convert to km
                  const routeCoordinates = route.geometry.coordinates.map(
                    (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
                  );

                  setDistances(prev => ({
                    ...prev,
                    [formateur.id]: Math.round(distance)
                  }));

                  setRoutes(prev => ({
                    ...prev,
                    [formateur.id]: routeCoordinates
                  }));
                }
              }
            }
          } catch (error) {
            console.error('Error calculating distance:', error);
          }
        });
      }
    };

    if (coordinates) {
      fetchFormateurs();
    }
  }, [formation.id, coordinates]);

  const handleFormateurClick = (formateur: Formateur) => {
    setSelectedFormateurDetails(formateur);
    setShowFormateurModal(true);
  };

  const handleRatingUpdate = async () => {
    if (!user) {
      addNotification('Vous devez être connecté pour modifier la note', 'error');
      return;
    }

    try {
      setUpdatingRating(true);

      const { error } = await supabase
        .from('formations')
        .update({ 
          rating: newRating,
          updated_at: new Date().toISOString()
        })
        .eq('id', formation.id);

      if (error) throw error;

      addNotification('Note mise à jour avec succès', 'success');
      setIsEditingRating(false);

      // Update local state and parent component
      const updatedFormation = { ...formation, rating: newRating };
      if (onFormationUpdated) {
        onFormationUpdated(updatedFormation);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      addNotification(
        'Erreur lors de la mise à jour de la note',
        'error'
      );
    } finally {
      setUpdatingRating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-medium text-emerald-800">{formation.titre}</h2>
            {formation.categorie && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-2">
                {formation.categorie}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Détails
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'participants'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Participants
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className={`w-5 h-5 mr-2 ${formation.rating >= 70 ? 'text-yellow-400' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-700">Taux de satisfaction</span>
                    </div>
                    {isEditingRating ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newRating}
                          onChange={(e) => setNewRating(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-emerald-200"
                        />
                        <span className="text-sm text-gray-500">%</span>
                        <button
                          onClick={handleRatingUpdate}
                          disabled={updatingRating}
                          className="px-2 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {updatingRating ? '...' : 'OK'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingRating(false);
                            setNewRating(formation.rating);
                          }}
                          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-medium ${formation.rating >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {formation.rating}%
                        </span>
                        <button
                          onClick={() => setIsEditingRating(true)}
                          className="text-emerald-600 hover:text-emerald-700 text-sm"
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-3 text-emerald-500" />
                    <span>{format(new Date(formation.date), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3 text-emerald-500" />
                    <span>{formation.nombre_heures} heures</span>
                  </div>

                  {locationData && (
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-5 h-5 mr-3 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{locationData.nom}</p>
                        <p>{locationData.adresse}</p>
                        <p>{locationData.code_postal} {locationData.ville}</p>
                      </div>
                    </div>
                  )}

                  {locationData?.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-5 h-5 mr-3 text-emerald-500" />
                      <a href={`mailto:${locationData.email}`} className="hover:text-emerald-600">
                        {locationData.email}
                      </a>
                    </div>
                  )}

                  {locationData?.telephone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-5 h-5 mr-3 text-emerald-500" />
                      <a href={`tel:${locationData.telephone}`} className="hover:text-emerald-600">
                        {locationData.telephone}
                      </a>
                    </div>
                  )}

                  {formation.url_visio && (
                    <div className="flex items-center text-gray-600">
                      <Video className="w-5 h-5 mr-3 text-emerald-500" />
                      <a
                        href={formation.url_visio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-600"
                      >
                        Lien visioconférence
                      </a>
                    </div>
                  )}
                </div>

                {formateurs.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-emerald-800 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Formateurs
                    </h3>
                    <div className="space-y-4">
                      {formateurs.map((formateur) => (
                        <div
                          key={formateur.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            selectedFormateur === formateur.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-emerald-800">
                                  {formateur.prenom} {formateur.nom}
                                </h4>
                                <button
                                  onClick={() => handleFormateurClick(formateur)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors rounded-full hover:bg-emerald-50"
                                  title="Voir les détails"
                                >
                                  <UserCog className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="mt-2 space-y-1 text-sm text-gray-600">
                                {formateur.email && (
                                  <a href={`mailto:${formateur.email}`} className="flex items-center hover:text-emerald-600">
                                    <Mail className="w-4 h-4 mr-2" />
                                    {formateur.email}
                                  </a>
                                )}
                                {formateur.telephone && (
                                  <a href={`tel:${formateur.telephone}`} className="flex items-center hover:text-emerald-600">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {formateur.telephone}
                                  </a>
                                )}
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{formateur.adresse}, {formateur.code_postal} {formateur.ville}</span>
                                </div>
                                {distances[formateur.id] && (
                                  <div className="flex items-center text-emerald-600 font-medium">
                                    <Route className="w-4 h-4 mr-2" />
                                    <span>{distances[formateur.id]} km du lieu de formation</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedFormateur(
                                selectedFormateur === formateur.id ? null : formateur.id
                              )}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-[600px] bg-gray-100 rounded-lg overflow-hidden">
                {coordinates ? (
                  <MapContainer
                    center={coordinates}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={coordinates}>
                      <Popup>
                        <div className="text-sm">
                          <strong>{formation.titre}</strong>
                          <br />
                          {locationData?.adresse}
                          <br />
                          {locationData?.code_postal} {locationData?.ville}
                        </div>
                      </Popup>
                    </Marker>

                    {selectedFormateur && routes[selectedFormateur] && (
                      <Polyline
                        positions={routes[selectedFormateur]}
                        color="#059669"
                        weight={3}
                        opacity={0.7}
                      />
                    )}
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>Carte non disponible</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <FormationParticipants formationId={formation.id} />
          )}
        </div>
      </div>

      {showFormateurModal && selectedFormateurDetails && (
        <FormateurModal
          formateur={selectedFormateurDetails}
          onClose={() => {
            setShowFormateurModal(false);
            setSelectedFormateurDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default FormationModal;