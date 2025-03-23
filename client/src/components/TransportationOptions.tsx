import { useState } from 'react';
import { Car, Bus, Bike, ChevronRight, Search, Clock, Users, Filter, User, DollarSign } from 'lucide-react';
import { TransportationType } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface TransportationOptionsProps {
  transportOptions: TransportationType[];
  onSelectTransport: (option: TransportationType) => void;
}

const TransportationOptions = ({ transportOptions, onSelectTransport }: TransportationOptionsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'shared' | 'private'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10]);
  const [sortBy, setSortBy] = useState<'price' | 'time'>('price');

  // Function to get the appropriate icon based on transport type name
  const getTransportIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('cab') || lowerName.includes('taxi')) {
      return <Car className="h-5 w-5" />;
    } else if (lowerName.includes('shuttle') || lowerName.includes('bus')) {
      return <Bus className="h-5 w-5" />;
    } else if (lowerName.includes('rickshaw') || lowerName.includes('bike') || lowerName.includes('cycle')) {
      return <Bike className="h-5 w-5" />;
    } else {
      // Default icon if no match
      return <Car className="h-5 w-5" />;
    }
  };
  
  // If no data is available, show fallback options
  const fallbackOptions = [
    {
      id: 1,
      name: 'Cab',
      icon: 'car-side',
      baseRate: 8,
      perKmRate: 2,
    },
    {
      id: 2,
      name: 'Shuttle',
      icon: 'shuttle-van',
      baseRate: 4,
      perKmRate: 1,
    },
    {
      id: 3,
      name: 'E-Rickshaw',
      icon: 'bicycle',
      baseRate: 3,
      perKmRate: 1,
    }
  ];
  
  const options = transportOptions.length > 0 ? transportOptions : fallbackOptions;

  // Filter options based on search term and active tab
  const filteredOptions = options
    .filter(option => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(option => {
      if (activeTab === 'all') return true;
      if (activeTab === 'shared') return option.name.toLowerCase().includes('shuttle');
      if (activeTab === 'private') return !option.name.toLowerCase().includes('shuttle');
      return true;
    })
    .filter(option => 
      option.baseRate >= priceRange[0] && option.baseRate <= priceRange[1]
    );

  // Sort options based on selected criteria
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (sortBy === 'price') {
      return a.baseRate - b.baseRate;
    } else {
      // For time, we could do more complex calculation in a real app
      // Here, we'll just use a simple estimation based on perKmRate (lower is faster)
      return a.perKmRate - b.perKmRate;
    }
  });

  // Calculate arrival times (simulated)
  const getArrivalTime = (option: TransportationType) => {
    const baseMinutes = option.name.toLowerCase().includes('shuttle') 
      ? 15  // Shuttles come on a fixed schedule
      : 5;  // Cabs and rickshaws are on-demand
    
    // Add some variability based on the option ID for a more realistic feel
    return baseMinutes + (option.id % 3);
  };

  // For shuttle option, generate next three departure times
  const getDepartureTimes = () => {
    const now = new Date();
    return [15, 30, 45].map(minutes => {
      const time = new Date(now.getTime());
      time.setMinutes(now.getMinutes() + minutes);
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  };
  
  // Helper function to render transport options
  const renderOptions = (options: TransportationType[]) => {
    return options.length > 0 ? (
      options.map((option) => (
        <div
          key={option.id}
          className="flex flex-col bg-white border rounded-lg cursor-pointer hover:shadow-md transition-all duration-200"
          onClick={() => onSelectTransport(option)}
        >
          <div className="flex items-center p-3">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mr-3">
              {getTransportIcon(option.name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="font-medium">{option.name}</h3>
                {option.name.toLowerCase().includes('shuttle') ? (
                  <Badge variant="outline" className="ml-2 text-xs">Shared</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-xs">Private</Badge>
                )}
              </div>
              <div className="flex items-center text-xs text-neutral-600 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {option.name.toLowerCase().includes('shuttle') 
                  ? `Next: ${getDepartureTimes()[0]}, ${getDepartureTimes()[1]}`
                  : `${getArrivalTime(option)} min away`
                }
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-primary">${option.baseRate}</div>
              <div className="text-xs text-gray-500">
                {option.name.toLowerCase().includes('shuttle') 
                  ? 'per person' 
                  : 'base fare'
                }
              </div>
            </div>
          </div>
          
          {option.name.toLowerCase().includes('shuttle') && (
            <div className="px-3 pb-2 pt-0 flex items-center">
              <div className="flex-1 flex items-center text-xs text-gray-500">
                <Users className="h-3 w-3 mr-1" />
                <span>Shared ride (up to 8 people)</span>
              </div>
            </div>
          )}
          
          {!option.name.toLowerCase().includes('shuttle') && (
            <div className="px-3 pb-2 pt-0 flex items-center">
              <div className="flex-1 flex items-center text-xs text-gray-500">
                <User className="h-3 w-3 mr-1" />
                <span>Private ride</span>
              </div>
              <div className="text-xs text-gray-500">
                +${option.perKmRate}/km
              </div>
            </div>
          )}
        </div>
      ))
    ) : (
      <div className="text-center py-6 text-gray-500">
        No transportation options match your criteria.
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search transportation options..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-50 rounded-md"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="p-3 bg-gray-50 rounded-md space-y-3 animate-in fade-in-50 duration-200">
          <div>
            <p className="text-sm font-medium mb-2">Price Range</p>
            <Slider
              defaultValue={[0, 10]}
              max={10}
              step={1}
              value={priceRange}
              onValueChange={setPriceRange}
              className="mb-1"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Sort By</p>
            <div className="flex space-x-2">
              <Button 
                variant={sortBy === 'price' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSortBy('price')}
                className="flex items-center gap-1"
              >
                <DollarSign className="h-3 w-3" /> Price
              </Button>
              <Button 
                variant={sortBy === 'time' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSortBy('time')}
                className="flex items-center gap-1"
              >
                <Clock className="h-3 w-3" /> Arrival Time
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="shared" className="flex-1">Shared</TabsTrigger>
          <TabsTrigger value="private" className="flex-1">Private</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-0">
          {renderOptions(sortedOptions)}
        </TabsContent>
        
        <TabsContent value="shared" className="space-y-3 mt-0">
          {renderOptions(sortedOptions)}
        </TabsContent>
        
        <TabsContent value="private" className="space-y-3 mt-0">
          {renderOptions(sortedOptions)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransportationOptions;
