import React, { useState, useEffect, useRef } from 'react';
import { Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface FormateurSelectorProps {
  selectedFormateurs: Formateur[];
  onSelect: (formateur: Formateur) => void;
  onRemove: (formateurId: string) => void;
}

export const FormateurSelector: React.FC<FormateurSelectorProps> = ({
  selectedFormateurs,
  onSelect,
  onRemove,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFormateurs = async () => {
      if (searchTerm.length < 2) {
        setFormateurs([]);
        return;
      }

      const { data, error } = await supabase
        .from('formateurs')
        .select('id, nom, prenom, email')
        .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(5);

      if (error) {
        console.error('Error fetching formateurs:', error);
        return;
      }

      setFormateurs(data || []);
    };

    const timeoutId = setTimeout(fetchFormateurs, 300);
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

  const handleFormateurSelect = (formateur: Formateur) => {
    if (!selectedFormateurs.some(f => f.id === formateur.id)) {
      onSelect(formateur);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div className="relative">
        <Users className="absolute left-3 top-2.5 h-5 w-5 text-emerald-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors"
          placeholder="Rechercher un formateur..."
        />
      </div>

      {/* Selected formateurs */}
      {selectedFormateurs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFormateurs.map((formateur) => (
            <div
              key={formateur.id}
              className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm"
            >
              <span>{formateur.prenom} {formateur.nom}</span>
              <button
                onClick={() => onRemove(formateur.id)}
                className="ml-2 text-emerald-600 hover:text-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (searchTerm.length >= 2 || formateurs.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-emerald-100">
          {formateurs.length > 0 ? (
            <ul className="py-1">
              {formateurs.map((formateur) => (
                <li
                  key={formateur.id}
                  className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => handleFormateurSelect(formateur)}
                >
                  <div className="font-medium text-emerald-800">
                    {formateur.prenom} {formateur.nom}
                  </div>
                  {formateur.email && (
                    <div className="text-sm text-gray-500">{formateur.email}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : searchTerm.length >= 2 && (
            <div className="px-4 py-2 text-sm text-gray-500">
              Aucun formateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
};