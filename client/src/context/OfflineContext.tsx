import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface OfflineContextType {
  isOffline: boolean;
  dismissOfflineNotification: () => void;
  showOfflineNotification: boolean;
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  dismissOfflineNotification: () => {},
  showOfflineNotification: false,
});

export const useOfflineStatus = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineNotification, setShowOfflineNotification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "Back online",
        description: "Your connection has been restored.",
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineNotification(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  const dismissOfflineNotification = () => {
    setShowOfflineNotification(false);
  };

  return (
    <OfflineContext.Provider
      value={{
        isOffline,
        dismissOfflineNotification,
        showOfflineNotification,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
