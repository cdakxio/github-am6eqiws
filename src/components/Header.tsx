import React, { useState, useEffect, useRef } from 'react';
import { Search, Brain, Sparkles, Calendar, MapPin, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ChatbotModal from './ChatbotModal';

interface SearchResult {
  type: 'formation' | 'formateur' | 'lieu';
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  icon: React.ReactNode;
  path: string;
}

const Header = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search formations
        const { data: formations } = await supabase
          .from('formations')
          .select('*')
          .or(`titre.ilike.%${searchTerm}%,categorie.ilike.%${searchTerm}%`)
          .eq('is_active', true)
          .limit(3);

        // Search formateurs
        const { data: formateurs } = await supabase
          .from('formateurs')
          .select('*')
          .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .eq('is_active', true)
          .limit(3);

        // Search lieux
        const { data: lieux } = await supabase
          .from('lieux')
          .select('*')
          .or(`nom.ilike.%${searchTerm}%,ville.ilike.%${searchTerm}%,code_postal.ilike.%${searchTerm}%`)
          .eq('is_active', true)
          .limit(3);

        const searchResults: SearchResult[] = [
          ...(formations?.map(f => ({
            type: 'formation' as const,
            id: f.id,
            title: f.titre,
            subtitle: f.categorie,
            date: f.date,
            icon: <Calendar className="w-5 h-5 text-emerald-500" />,
            path: `/formations/liste?id=${f.id}`
          })) || []),
          ...(formateurs?.map(f => ({
            type: 'formateur' as const,
            id: f.id,
            title: `${f.prenom} ${f.nom}`,
            subtitle: f.email,
            icon: <Users className="w-5 h-5 text-emerald-500" />,
            path: `/formateurs?id=${f.id}`
          })) || []),
          ...(lieux?.map(l => ({
            type: 'lieu' as const,
            id: l.id,
            title: l.nom,
            subtitle: `${l.code_postal} ${l.ville}`,
            icon: <MapPin className="w-5 h-5 text-emerald-500" />,
            path: `/lieux?id=${l.id}`
          })) || [])
        ];

        setResults(searchResults);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchTerm('');
    navigate(result.path);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1" ref={searchRef}>
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && (searchTerm.length >= 2 || results.length > 0) && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                      >
                        <div className="flex items-center">
                          {result.icon}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{result.title}</div>
                            <div className="flex items-center text-xs text-gray-500 space-x-2">
                              <span className="capitalize">{result.type}</span>
                              {result.subtitle && (
                                <>
                                  <span>•</span>
                                  <span>{result.subtitle}</span>
                                </>
                              )}
                              {result.date && (
                                <>
                                  <span>•</span>
                                  <span>{format(new Date(result.date), 'dd/MM/yyyy', { locale: fr })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm.length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucun résultat trouvé
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowChatbot(true)}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Brain className="h-6 w-6 text-teal-600" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Chatbot Modal */}
      {showChatbot && <ChatbotModal onClose={() => setShowChatbot(false)} />}
    </header>
  );
};

export default Header;