import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import BookingCard from './BookingCard';
import TransportationOptions from './TransportationOptions';
import { useQuery } from '@tanstack/react-query';
import { ParkingBooking, TransportationType, ParkingLocation, ParkingSpot } from '@shared/schema';
import { useOfflineData } from '../hooks/useOffline';

interface BookingPanelProps {
  onViewBookingDetails: (booking: ParkingBooking) => void;
  onModifyBooking: (booking: ParkingBooking) => void;
  onBookTransport: () => void;
  onSelectTransport: (type: TransportationType) => void;
}

const BookingPanel = ({
  onViewBookingDetails,
  onModifyBooking,
  onBookTransport,
  onSelectTransport
}: BookingPanelProps) => {
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Fetch bookings from API with offline support
  const { data: offlineBookings, updateData: updateOfflineBookings } = useOfflineData<ParkingBooking[]>(
    'bookings',
    [],
    7 * 24 * 60 * 60 * 1000 // 7 days expiry
  );

  const { data: bookings = [] } = useQuery<ParkingBooking[]>({
    queryKey: ['/api/bookings'],
    onSuccess: (data) => updateOfflineBookings(data),
  });

  // Fetch locations for mapping location IDs to names
  const { data: offlineLocations } = useOfflineData<ParkingLocation[]>(
    'locations',
    [],
    7 * 24 * 60 * 60 * 1000
  );
  
  const { data: locations = [] } = useQuery<ParkingLocation[]>({
    queryKey: ['/api/parking/locations'],
    onSuccess: (data) => updateOfflineBookings(data),
  });

  // Fetch parking spots for mapping spot IDs to spot details
  const { data: offlineSpots } = useOfflineData<ParkingSpot[]>(
    'spots',
    [],
    7 * 24 * 60 * 60 * 1000
  );
  
  const { data: spots = [] } = useQuery<ParkingSpot[]>({
    queryKey: ['/api/parking/spots'],
    onSuccess: (data) => updateOfflineBookings(data),
  });

  // Fetch transportation types
  const { data: transportationTypes = [] } = useQuery<TransportationType[]>({
    queryKey: ['/api/transportation/types'],
  });

  // Use online data or fall back to offline cached data
  const allBookings = bookings.length > 0 ? bookings : offlineBookings;
  const allLocations = locations.length > 0 ? locations : offlineLocations;
  const allSpots = spots.length > 0 ? spots : offlineSpots;

  // Filter bookings based on active tab
  const now = new Date();
  const filteredBookings = allBookings.filter(booking => {
    const bookingEndTime = new Date(booking.endTime);
    
    if (activeTab === "upcoming") {
      return bookingEndTime >= now && booking.status !== 'canceled';
    } else if (activeTab === "past") {
      return bookingEndTime < now || booking.status === 'completed' || booking.status === 'canceled';
    } else if (activeTab === "favorites") {
      return booking.isFavorite === true;
    }
    return false;
  });

  // Get location name from location ID
  const getLocationName = (locationId: number) => {
    const location = allLocations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  // Get spot details from spot ID
  const getSpotDetails = (spotId: number) => {
    const spot = allSpots.find(s => s.id === spotId);
    return spot ? {
      spotNumber: spot.spotNumber,
      level: spot.level,
      section: spot.section
    } : {
      spotNumber: 'Unknown',
      level: undefined,
      section: undefined
    };
  };

  return (
    <div className="md:w-2/5 h-1/2 md:h-full bg-white overflow-y-auto">
      <div className="px-4 py-5">
        <h2 className="text-xl font-bold mb-4">My Bookings</h2>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full border-b border-neutral-200 mb-4">
            <TabsTrigger value="upcoming" className="pb-2 px-4 font-medium">Upcoming</TabsTrigger>
            <TabsTrigger value="past" className="pb-2 px-4 font-medium">Past</TabsTrigger>
            <TabsTrigger value="favorites" className="pb-2 px-4 font-medium">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-2">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  locationName={getLocationName(booking.locationId)}
                  spotDetails={getSpotDetails(booking.spotId)}
                  expanded={booking.status === 'confirmed'}
                  onViewDetails={() => onViewBookingDetails(booking)}
                  onModify={() => onModifyBooking(booking)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No upcoming bookings found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-2">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  locationName={getLocationName(booking.locationId)}
                  spotDetails={getSpotDetails(booking.spotId)}
                  onViewDetails={() => onViewBookingDetails(booking)}
                  onModify={() => onModifyBooking(booking)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No past bookings found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4 mt-2">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  locationName={getLocationName(booking.locationId)}
                  spotDetails={getSpotDetails(booking.spotId)}
                  onViewDetails={() => onViewBookingDetails(booking)}
                  onModify={() => onModifyBooking(booking)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No favorite bookings found.
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Last-Mile Options Section */}
        <div className="mt-6 pt-4 border-t border-neutral-200">
          <h2 className="text-xl font-bold mb-4">Last-Mile Options</h2>
          
          <TransportationOptions 
            transportOptions={transportationTypes}
            onSelectTransport={onSelectTransport}
          />
          
          <Button 
            className="w-full bg-secondary text-white py-6 mt-4 font-medium"
            onClick={onBookTransport}
          >
            Book Transportation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPanel;
