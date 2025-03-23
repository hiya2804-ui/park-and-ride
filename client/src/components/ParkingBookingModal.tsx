import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FaStar, FaStarHalfAlt, FaTimes } from 'react-icons/fa';
import { ParkingLocation, Vehicle } from '@shared/schema';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ParkingBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLocation: ParkingLocation | null;
  onSuccess: () => void;
}

const ParkingBookingModal = ({ 
  open, 
  onOpenChange, 
  selectedLocation,
  onSuccess
}: ParkingBookingModalProps) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('15:00');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [bookTransportation, setBookTransportation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Calculate booking details
  const calculateDuration = () => {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return end > start ? end - start : 0;
  };

  const duration = calculateDuration();
  const parkingFee = selectedLocation ? selectedLocation.hourlyRate * duration : 0;
  const bookingFee = 1.5;
  const total = parkingFee + bookingFee;

  // Create booking mutation
  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Successful",
        description: `Your parking spot has been reserved.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  const handleConfirmBooking = () => {
    if (!selectedLocation) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "No parking location selected",
      });
      return;
    }

    if (!selectedVehicleId) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Please select a vehicle",
      });
      return;
    }

    // Construct start and end time Date objects
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

    createBooking({
      locationId: selectedLocation.id,
      vehicleId: parseInt(selectedVehicleId),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      bookTransportation,
    });
  };

  if (!selectedLocation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Book Parking Spot</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">{selectedLocation.name}</h3>
          <p className="text-sm text-neutral-600">{selectedLocation.address}</p>
          <div className="flex items-center mt-1">
            <div className="flex items-center text-yellow-500">
              {[...Array(Math.floor(selectedLocation.rating || 0))].map((_, i) => (
                <FaStar key={`star-${i}`} className="text-xs" />
              ))}
              {selectedLocation.rating && selectedLocation.rating % 1 >= 0.5 && (
                <FaStarHalfAlt className="text-xs" />
              )}
            </div>
            <span className="text-xs text-neutral-600 ml-1">
              {selectedLocation.rating?.toFixed(1)} ({selectedLocation.reviewCount} reviews)
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium mb-1">Date</Label>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            min={today}
            className="w-full border border-neutral-300 rounded-lg"
          />
        </div>
        
        <div className="flex space-x-3 mb-4">
          <div className="flex-1">
            <Label className="block text-sm font-medium mb-1">Start Time</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="11:00">11:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="13:00">1:00 PM</SelectItem>
                <SelectItem value="14:00">2:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="block text-sm font-medium mb-1">End Time</Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="13:00">1:00 PM</SelectItem>
                <SelectItem value="14:00">2:00 PM</SelectItem>
                <SelectItem value="15:00">3:00 PM</SelectItem>
                <SelectItem value="16:00">4:00 PM</SelectItem>
                <SelectItem value="17:00">5:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium mb-1">Vehicle Information</Label>
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                  {vehicle.nickname || vehicle.vehicleType} ({vehicle.licensePlate})
                </SelectItem>
              ))}
              <SelectItem value="new">Add New Vehicle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="p-3 bg-neutral-100 rounded-lg mb-4">
          <div className="flex justify-between mb-2">
            <span>Parking Fee ({duration} hours)</span>
            <span>${parkingFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Booking Fee</span>
            <span>${bookingFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mb-4 flex items-center space-x-2">
          <Checkbox 
            id="book-transport" 
            checked={bookTransportation} 
            onCheckedChange={(checked) => setBookTransportation(checked === true)}
          />
          <Label htmlFor="book-transport" className="text-sm">
            Book last-mile transportation after parking
          </Label>
        </div>
        
        <Button 
          className="w-full"
          onClick={handleConfirmBooking}
          disabled={isPending}
        >
          {isPending ? "Processing..." : "Confirm Booking"}
        </Button>
        <p className="text-xs text-center text-neutral-500 mt-2">
          You can cancel for free up to 2 hours before arrival
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ParkingBookingModal;
