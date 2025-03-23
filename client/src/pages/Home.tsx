import { useState } from 'react';
import Navbar from '../components/Navbar';
import Map from '../components/Map';
import BookingPanel from '../components/BookingPanel';
import BottomNavigation from '../components/BottomNavigation';
import ParkingBookingModal from '../components/ParkingBookingModal';
import TransportBookingModal from '../components/TransportBookingModal';
import QRCodeModal from '../components/QRCodeModal';
import OfflineNotification from '../components/OfflineNotification';
import { ParkingLocation, ParkingBooking, TransportationType } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const Home = () => {
  const [activePage, setActivePage] = useState("map");
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ParkingBooking | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<TransportationType | null>(null);
  const [isParkingModalOpen, setIsParkingModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle navigation in mobile view
  const handleNavigate = (page: string) => {
    setActivePage(page);
  };

  // Handle selecting a parking location from the map
  const handleSelectLocation = (location: ParkingLocation) => {
    setSelectedLocation(location);
    setIsParkingModalOpen(true);
  };

  // Handle viewing booking details (QR code)
  const handleViewBookingDetails = (booking: ParkingBooking) => {
    setSelectedBooking(booking);
    setIsQRModalOpen(true);
  };

  // Handle modifying a booking
  const handleModifyBooking = (booking: ParkingBooking) => {
    setSelectedBooking(booking);
    // In a real app, we'd open a modify booking modal
    toast({
      title: "Modify Booking",
      description: "This feature would allow you to modify your booking details."
    });
  };

  // Handle booking transportation
  const handleBookTransport = () => {
    // If no transport is selected, use a default or show error
    if (!selectedTransport) {
      toast({
        variant: "destructive",
        title: "Select transportation",
        description: "Please select a transportation option first."
      });
      return;
    }
    setIsTransportModalOpen(true);
  };

  // Handle selecting a transport option
  const handleSelectTransport = (transport: TransportationType) => {
    setSelectedTransport(transport);
    toast({
      title: "Selected: " + transport.name,
      description: "Click 'Book Transportation' to continue."
    });
  };

  // Handle successful booking (refresh data)
  const handleBookingSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    toast({
      title: "Success!",
      description: "Your booking has been confirmed."
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Conditionally show Map or BookingPanel in mobile view */}
        {(activePage === "map" || window.innerWidth >= 768) && (
          <Map onSelectLocation={handleSelectLocation} />
        )}
        
        {(activePage === "bookings" || window.innerWidth >= 768) && (
          <BookingPanel
            onViewBookingDetails={handleViewBookingDetails}
            onModifyBooking={handleModifyBooking}
            onBookTransport={handleBookTransport}
            onSelectTransport={handleSelectTransport}
          />
        )}
      </div>
      
      <BottomNavigation
        onNavigate={handleNavigate}
        activePage={activePage}
      />
      
      {/* Modals */}
      <ParkingBookingModal
        open={isParkingModalOpen}
        onOpenChange={setIsParkingModalOpen}
        selectedLocation={selectedLocation}
        onSuccess={handleBookingSuccess}
      />
      
      <TransportBookingModal
        open={isTransportModalOpen}
        onOpenChange={setIsTransportModalOpen}
        selectedTransport={selectedTransport}
        onSuccess={handleBookingSuccess}
      />
      
      <QRCodeModal
        open={isQRModalOpen}
        onOpenChange={setIsQRModalOpen}
        booking={selectedBooking}
        spotNumber={selectedBooking?.spotId.toString() || "A1"}
      />
      
      <OfflineNotification />
    </div>
  );
};

export default Home;
