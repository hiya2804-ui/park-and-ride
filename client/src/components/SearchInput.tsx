import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X } from 'lucide-react';
import { ParkingLocation } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface SearchInputProps {
  onSelectLocation: (location: ParkingLocation) => void;
  className?: string;
}

const SearchInput = ({ onSelectLocation, className }: SearchInputProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Fetch all parking locations
  const { data: locations = [] } = useQuery<ParkingLocation[]>({
    queryKey: ['/api/parking/locations'],
  });

  // Filter locations based on search term
  const filteredLocations = locations.filter(
    location => 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle outside click to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle selection of a location
  const handleSelectLocation = (location: ParkingLocation) => {
    onSelectLocation(location);
    setSearchTerm(location.name);
    setShowSuggestions(false);
  };

  // Show recent searches 
  const recentSearches = [
    'Downtown parking',
    'Airport parking',
    'Weekend spots'
  ];

  // Recent popular locations
  const popularLocations = locations.slice(0, 3);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for parking locations..."
          className="pl-10 pr-10 py-6 text-base rounded-full shadow-md"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => {
              setSearchTerm('');
              setShowSuggestions(true);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border overflow-hidden">
          {searchTerm ? (
            filteredLocations.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-1 text-sm text-gray-500">Search Results</div>
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleSelectLocation(location)}
                  >
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-gray-500">{location.address}</div>
                    </div>
                    <div className="text-sm font-medium text-primary">${location.hourlyRate}/hr</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No locations found</div>
            )
          ) : (
            <div>
              {/* Recent searches */}
              <div className="py-2">
                <div className="px-4 py-1 text-sm text-gray-500">Recent Searches</div>
                {recentSearches.map((search, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => setSearchTerm(search)}
                  >
                    <Search className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{search}</span>
                  </div>
                ))}
              </div>

              {/* Popular locations */}
              <div className="py-2 border-t">
                <div className="px-4 py-1 text-sm text-gray-500">Popular Locations</div>
                {popularLocations.map((location) => (
                  <div
                    key={location.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleSelectLocation(location)}
                  >
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-gray-500">{location.address}</div>
                    </div>
                    <div className="text-sm font-medium text-primary">${location.hourlyRate}/hr</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;