import React from 'react';
import { Info, CheckCircle, AlertCircle, Info as InfoIcon, X, Database } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const VersionBar: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();

  const getNotificationDetails = (notification: any) => {
    if (!notification.data) return null;
    
    const { table, action, details } = notification.data;
    if (!table && !action) return null;

    return (
      <div className="flex items-center space-x-1 ml-1 text-gray-300">
        {table && (
          <>
            <Database className="w-3 h-3" />
            <span>{table}</span>
          </>
        )}
        {action && (
          <>
            <span>•</span>
            <span>{action}</span>
          </>
        )}
        {details && (
          <>
            <span>•</span>
            <span>{details}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-1 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Info className="w-3 h-3 mr-1" />
            <span>V1.0.0</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-200">
              Testing
            </span>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex-1 px-4">
          {notifications.length > 0 && (
            <div className="flex items-center justify-center space-x-2">
              {notifications.map((notification) => {
                const Icon = notification.type === 'success' ? CheckCircle :
                           notification.type === 'error' ? AlertCircle : 
                           InfoIcon;

                const bgColor = notification.type === 'success' ? 'bg-green-500/20' :
                              notification.type === 'error' ? 'bg-red-500/20' :
                              'bg-blue-500/20';

                const textColor = notification.type === 'success' ? 'text-green-200' :
                                notification.type === 'error' ? 'text-red-200' :
                                'text-blue-200';

                return (
                  <div
                    key={notification.id}
                    className={`flex items-center ${bgColor} ${textColor} rounded-full px-3 py-0.5 animate-fadeIn`}
                  >
                    <Icon className="w-3 h-3 mr-2" />
                    <div className="flex items-center">
                      <span>{notification.message}</span>
                      {getNotificationDetails(notification)}
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="ml-2 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 text-emerald-200">
          <span>© 2024 TEMIS</span>
        </div>
      </div>
    </div>
  );
};

export default VersionBar;