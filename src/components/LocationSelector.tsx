import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Location {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
}

interface LocationSelectorProps {
  onSelect: (location: Location) => void;
  onCreateNew: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onSelect, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      if (searchTerm.length < 2) {
        setLocations([]);
        return;
      }

      const { data, error } = await supabase
        .from('lieux')
        .select('*')
        .ilike('nom', `%${searchTerm}%`)
        .eq('is_active', true)
        .limit(5);

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      setLocations(data || []);
    };

    const timeoutId = setTimeout(fetchLocations, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: Location) => {
    onSelect(location);
    setSearchTerm(location.nom);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
          placeholder="Rechercher un lieu..."
        />
      </div>

      {isOpen && (searchTerm.length >= 2 || locations.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-emerald-100">
          {locations.length > 0 && (
            <ul className="py-1">
              {locations.map((location) => (
                <li
                  key={location.id}
                  className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => handleLocationSelect(location)}
                >
                  <div className="font-medium text-emerald-800">{location.nom}</div>
                  {location.adresse && (
                    <div className="text-sm text-gray-500">
                      {location.adresse}, {location.code_postal} {location.ville}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          <div className="p-2 border-t border-emerald-100">
            <button
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un nouveau lieu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};