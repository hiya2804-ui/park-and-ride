import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, Navigation2, Star, Clock, Car } from 'lucide-react';
import { ParkingLocation } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useOfflineData } from '../hooks/useOffline';
import SearchInput from './SearchInput';

interface MapProps {
  onSelectLocation: (location: ParkingLocation) => void;
}

const Map = ({ onSelectLocation }: MapProps) => {
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [mapView, setMapView] = useState<'map' | 'list'>('map');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Offline fallback data
  const { data: offlineLocations, updateData: updateOfflineLocations } = useOfflineData<ParkingLocation[]>(
    'parking-locations',
    [],
    24 * 60 * 60 * 1000 // 24 hours expiry
  );

  // Fetch parking locations from API
  const { data: parkingLocations, isLoading, error } = useQuery<ParkingLocation[]>({
    queryKey: ['/api/parking/locations'],
    onSuccess: (data) => {
      // Update offline cache when we get fresh data
      updateOfflineLocations(data);
    },
  });

  // Fetch parking spots to show availability 
  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['/api/parking/spots'],
  });

  // Use either online data or offline cached data
  const locations = parkingLocations || offlineLocations;
  
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load parking locations. Using cached data if available.",
      });
    }
  }, [error, toast]);

  const handleSelectLocation = (location: ParkingLocation) => {
    setSelectedLocation(location);
    
    // If map were integrated, we would center the map on the selected location
    // For this implementation, we'll just set the state
  };

  const handleBookParking = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
    }
  };

  const handleGetDirections = () => {
    if (selectedLocation) {
      // In a real app, we would integrate with a maps provider's navigation API
      toast({
        title: "Directions",
        description: `Directions to ${selectedLocation.name} would open in your preferred maps app.`,
      });
    }
  };

  // Get available spots count for a location
  const getAvailableSpotsCount = (locationId: number) => {
    return parkingSpots.filter(spot => 
      spot.locationId === locationId && spot.isAvailable
    ).length;
  };

  // Generate a random distance (would be calculated in a real app)
  const getDistance = (locationId: number) => {
    // Using locationId to generate a consistent but seemingly random distance
    return (locationId * 1.7 % 5).toFixed(1);
  };

  return (
    <div className="md:w-3/5 h-1/2 md:h-full relative flex flex-col bg-gray-100" ref={mapContainerRef}>
      <div className="p-4 bg-white shadow-sm z-10">
        <SearchInput 
          onSelectLocation={handleSelectLocation} 
          className="mb-3"
        />
        
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2">
            <Button
              variant={mapView === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapView('map')}
            >
              Map View
            </Button>
            <Button
              variant={mapView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapView('list')}
            >
              List View
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            {locations?.length || 0} locations available
          </div>
        </div>
      </div>
      
      {mapView === 'map' ? (
        <div className="flex-1 relative bg-gray-200 bg-cover bg-center" 
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1569336415962-a4bd9f69c07b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}>
          {/* Map Markers (would be dynamically placed based on coordinates in a real implementation) */}
          {locations?.map((location, index) => (
            <div
              key={location.id}
              className="absolute" 
              style={{ 
                top: `${30 + (index * 10)}%`, 
                left: `${30 + (index * 15)}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="relative group">
                <div 
                  className={`
                    ${selectedLocation?.id === location.id ? 'bg-secondary' : 'bg-primary'} 
                    text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg cursor-pointer
                    transition-all duration-200 group-hover:scale-110
                  `}
                  onClick={() => handleSelectLocation(location)}
                >
                  <span className="font-bold">P</span>
                </div>
                
                {/* Popup on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 
                                bg-white shadow-lg rounded-md p-2 text-sm pointer-events-none opacity-0 
                                group-hover:opacity-100 transition-opacity duration-200">
                  <div className="font-semibold truncate">{location.name}</div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>${location.hourlyRate}/hr</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Location Details Popup */}
          {selectedLocation && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 animate-in fade-in-0 duration-300">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{selectedLocation.name}</h3>
                  <p className="text-sm text-neutral-600">
                    {getDistance(selectedLocation.id)} km away • {getAvailableSpotsCount(selectedLocation.id)} spots available
                  </p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium ml-1">{selectedLocation.rating}</span>
                    <span className="text-sm text-gray-500 ml-1">({selectedLocation.reviewCount} reviews)</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-primary font-medium text-lg">${selectedLocation.hourlyRate}/hr</span>
                  {selectedLocation.hasMetroAccess && (
                    <Badge variant="outline" className="mt-1 text-xs">Metro Access</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2 mt-3">
                <Button 
                  className="flex-1" 
                  onClick={handleBookParking}
                >
                  Book Parking
                </Button>
                <Button 
                  variant="outline" 
                  className="px-3 py-2" 
                  onClick={handleGetDirections}
                >
                  <Navigation2 className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              // Skeleton loader
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-5 w-2/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-8 w-24 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : locations?.length ? (
              locations.map((location) => (
                <Card 
                  key={location.id} 
                  className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 
                            ${selectedLocation?.id === location.id ? 'border-primary' : ''}`}
                  onClick={() => handleSelectLocation(location)}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="bg-primary/10 p-4 flex items-center justify-center">
                        <Car className="h-8 w-8 text-primary" />
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-semibold text-base">{location.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {location.hasMetroAccess && (
                            <Badge variant="outline" className="text-xs">Metro Access</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getAvailableSpotsCount(location.id)} spots available
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-medium ml-1">{location.rating}</span>
                            <span className="text-sm text-gray-500 ml-1">({location.reviewCount})</span>
                          </div>
                          <span className="text-primary font-medium">${location.hourlyRate}/hr</span>
                        </div>
                      </div>
                    </div>
                    {selectedLocation?.id === location.id && (
                      <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                        <Button 
                          size="sm" 
                          className="flex-1 mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookParking();
                          }}
                        >
                          Book Parking
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-3" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDirections();
                          }}
                        >
                          <Navigation2 className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No parking locations found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
