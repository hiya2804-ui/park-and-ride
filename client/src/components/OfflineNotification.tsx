import { useEffect } from 'react';
import { Wifi, XCircle } from 'lucide-react';
import { useOfflineStatus } from '../context/OfflineContext';

const OfflineNotification = () => {
  const { isOffline, dismissOfflineNotification, showOfflineNotification } = useOfflineStatus();

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (showOfflineNotification) {
      const timer = setTimeout(() => {
        dismissOfflineNotification();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showOfflineNotification, dismissOfflineNotification]);

  if (!isOffline || !showOfflineNotification) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-neutral-800 p-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center">
        <Wifi className="h-5 w-5 mr-2" />
        <div className="flex-1">
          <p className="font-medium">You're offline</p>
          <p className="text-xs">Don't worry, your bookings are still accessible</p>
        </div>
        <button 
          className="text-neutral-800 ml-2"
          onClick={dismissOfflineNotification}
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default OfflineNotification;
