import React from 'react';
import { X, CheckCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBar: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length === 0) return null;

  const getIcon = (type: 'info' | 'success' | 'error') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-400" />;
      default:
        return <Info className="h-6 w-6 text-blue-400" />;
    }
  };

  const getGradient = (type: 'info' | 'success' | 'error') => {
    switch (type) {
      case 'success':
        return 'from-green-900 to-green-800';
      case 'error':
        return 'from-red-900 to-red-800';
      default:
        return 'from-blue-900 to-blue-800';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 shadow-lg z-50 border-t border-gray-800">
      <div className="w-full">
        <div className="space-y-1">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center justify-between p-4 bg-gradient-to-r ${getGradient(notification.type)} transition-all duration-300 ease-in-out`}
            >
              <div className="flex-1 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-300">
                        {notification.timestamp.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-white transition-colors duration-200"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center space-x-2 text-sm text-gray-400">
                    <span>Système de notification</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>{notification.type === 'success' ? 'Ajout' : notification.type === 'error' ? 'Suppression' : 'Mise à jour'}</span>
                    {notification.data && (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        <span className="text-gray-300">{JSON.stringify(notification.data)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationBar;