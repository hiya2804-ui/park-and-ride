import { useEffect, useState } from "react";

type CachedData<T> = {
  timestamp: number;
  data: T;
};

export function useOfflineData<T>(
  key: string,
  initialData: T,
  expiryTimeInMs: number = 24 * 60 * 60 * 1000
) {
  const [data, setData] = useState<T>(initialData);

  useEffect(() => {
    // Load from local storage on mount
    const cachedDataStr = localStorage.getItem(key);
    if (cachedDataStr) {
      try {
        const cachedData: CachedData<T> = JSON.parse(cachedDataStr);
        
        // Check if data is still valid (not expired)
        const now = Date.now();
        if (now - cachedData.timestamp < expiryTimeInMs) {
          setData(cachedData.data);
        } else {
          // Clear expired data
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error("Failed to parse cached data:", error);
        localStorage.removeItem(key);
      }
    }
  }, [key, expiryTimeInMs]);

  const updateData = (newData: T) => {
    setData(newData);
    
    // Save to local storage
    const dataToCache: CachedData<T> = {
      timestamp: Date.now(),
      data: newData
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(dataToCache));
    } catch (error) {
      console.error("Failed to cache data:", error);
    }
  };

  return { data, updateData };
}

export function useOfflineStorage<T extends Record<string, any>>(
  storageKey: string,
  syncFunction?: (items: T[]) => Promise<void>
) {
  const [items, setItems] = useState<T[]>([]);
  const [pendingSync, setPendingSync] = useState<T[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedItems = localStorage.getItem(storageKey);
    if (storedItems) {
      try {
        setItems(JSON.parse(storedItems));
      } catch (e) {
        console.error("Failed to parse stored items:", e);
      }
    }

    const pendingItems = localStorage.getItem(`${storageKey}_pending`);
    if (pendingItems) {
      try {
        setPendingSync(JSON.parse(pendingItems));
      } catch (e) {
        console.error("Failed to parse pending items:", e);
      }
    }
  }, [storageKey]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Try to sync pending items when back online
  useEffect(() => {
    const syncPendingItems = async () => {
      if (isOnline && pendingSync.length > 0 && syncFunction) {
        try {
          await syncFunction(pendingSync);
          setPendingSync([]);
          localStorage.removeItem(`${storageKey}_pending`);
        } catch (error) {
          console.error("Failed to sync pending items:", error);
        }
      }
    };

    syncPendingItems();
  }, [isOnline, pendingSync, storageKey, syncFunction]);

  const saveItem = (item: T) => {
    const updatedItems = [...items, item];
    setItems(updatedItems);
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    
    if (!isOnline && item.needsSync !== false) {
      const updatedPending = [...pendingSync, item];
      setPendingSync(updatedPending);
      localStorage.setItem(`${storageKey}_pending`, JSON.stringify(updatedPending));
    }
  };

  const updateItem = (id: string | number, updatedItem: Partial<T>) => {
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const updatedItems = [...items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updatedItem };
    setItems(updatedItems);
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));

    if (!isOnline) {
      const pendingItem = { ...updatedItems[itemIndex], action: 'update' };
      const updatedPending = [...pendingSync, pendingItem];
      setPendingSync(updatedPending);
      localStorage.setItem(`${storageKey}_pending`, JSON.stringify(updatedPending));
    }
  };

  const removeItem = (id: string | number) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));

    if (!isOnline) {
      const itemToRemove = items.find(item => item.id === id);
      if (itemToRemove) {
        const pendingItem = { ...itemToRemove, action: 'delete' };
        const updatedPending = [...pendingSync, pendingItem];
        setPendingSync(updatedPending);
        localStorage.setItem(`${storageKey}_pending`, JSON.stringify(updatedPending));
      }
    }
  };

  return { items, saveItem, updateItem, removeItem, isOnline, pendingSync };
}
