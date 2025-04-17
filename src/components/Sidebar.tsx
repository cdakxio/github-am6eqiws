import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCog,
  MapPin,
  Settings,
  Brain,
  Sparkles,
  ChevronRight,
  UserPlus,
  List,
  PlusCircle,
  LogOut,
  User,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [formationsOpen, setFormationsOpen] = useState(false);
  const [formateursOpen, setFormateursOpen] = useState(false);
  const [lieuxOpen, setLieuxOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    {
      icon: GraduationCap,
      label: 'Formations',
      path: '/formations',
      submenu: [
        { icon: PlusCircle, label: 'Nouvelle', path: '/formations/nouvelle' },
        { icon: List, label: 'Liste', path: '/formations/liste' }
      ]
    },
    {
      icon: Users,
      label: 'Contacts',
      path: '/participants',
      submenu: [
        { icon: UserPlus, label: 'Nouveau', path: '/participants/nouveau' },
        { icon: List, label: 'Liste', path: '/participants/liste' }
      ]
    },
    {
      icon: UserCog,
      label: 'Formateurs',
      path: '/formateurs',
      submenu: [
        { icon: UserPlus, label: 'Nouveau', path: '/formateurs/nouveau' },
        { icon: List, label: 'Liste', path: '/formateurs/liste' }
      ]
    },
    {
      icon: MapPin,
      label: 'Lieux',
      path: '/lieux',
      submenu: [
        { icon: PlusCircle, label: 'Nouveau', path: '/lieux/nouveau' },
        { icon: List, label: 'Liste', path: '/lieux/liste' }
      ]
    },
    {
      icon: Mail,
      label: 'Emails',
      path: '/emails',
      submenu: [
        { icon: List, label: 'Liste', path: '/emails/liste' }
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 min-h-screen flex flex-col">
      {/* Logo section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="w-8 h-8 text-teal-400" />
            <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">TEMIS</h1>
            <p className="text-xs text-teal-400">Intelligence Artificielle</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.path} className="mb-1">
            {item.submenu ? (
              <>
                <button
                  onClick={() => {
                    if (item.label === 'Formations') setFormationsOpen(!formationsOpen);
                    if (item.label === 'Contacts') setParticipantsOpen(!participantsOpen);
                    if (item.label === 'Formateurs') setFormateursOpen(!formateursOpen);
                    if (item.label === 'Lieux') setLieuxOpen(!lieuxOpen);
                    if (item.label === 'Emails') setEmailsOpen(!emailsOpen);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors duration-150 hover:bg-white/10 text-gray-300 hover:text-white"
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5" />
                    <span className="ml-3">{item.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      (item.label === 'Formations' && formationsOpen) ||
                      (item.label === 'Contacts' && participantsOpen) ||
                      (item.label === 'Formateurs' && formateursOpen) ||
                      (item.label === 'Lieux' && lieuxOpen) ||
                      (item.label === 'Emails' && emailsOpen)
                        ? 'rotate-90'
                        : ''
                    }`}
                  />
                </button>
                {((item.label === 'Formations' && formationsOpen) ||
                  (item.label === 'Contacts' && participantsOpen) ||
                  (item.label === 'Formateurs' && formateursOpen) ||
                  (item.label === 'Lieux' && lieuxOpen) ||
                  (item.label === 'Emails' && emailsOpen)) && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
                            isActive
                              ? 'bg-teal-500/20 text-teal-400'
                              : 'text-gray-400 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <subItem.icon className="w-4 h-4" />
                        <span className="ml-3">{subItem.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="ml-3">{item.label}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Settings and User section */}
      <div className="border-t border-white/10 p-4 space-y-4">
        <NavLink
          to="/parametres"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
              isActive
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          <span className="ml-3">Paramètres</span>
        </NavLink>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-teal-400" />
            </div>
            <span className="ml-3 text-sm text-gray-300 truncate max-w-[150px]">
              {user?.email}
            </span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors duration-150 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-2">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;