import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TransportationType } from '@shared/schema';
import { 
  Car, UserIcon, Users, MapPin, Flag, Mic, 
  CalendarClock, Clock, CreditCard, Wallet, 
  Info, Star, Calendar, Loader2, ArrowRight,
  ChevronsUpDown, Search
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

// Suggested locations for search
const SUGGESTED_LOCATIONS = [
  "Airport Terminal 1",
  "Airport Terminal 2",
  "Central Business District",
  "Downtown Shopping Center",
  "North Station",
  "South Station",
  "West Mall",
  "East Tech Park",
  "University Campus",
  "Sports Stadium",
  "Concert Hall",
  "Medical Center",
  "Conference Center"
];

interface TransportBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTransport: TransportationType | null;
  onSuccess: () => void;
}

const TransportBookingModal = ({
  open,
  onOpenChange,
  selectedTransport,
  onSuccess
}: TransportBookingModalProps) => {
  // State for form fields
  const [pickupLocation, setPickupLocation] = useState('Central Metro Station');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [isNow, setIsNow] = useState(true);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [isPrivate, setIsPrivate] = useState(true);
  const [passengerCount, setPassengerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [specialRequests, setSpecialRequests] = useState('');
  const [showSpecialRequests, setShowSpecialRequests] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [applyPromoCode, setApplyPromoCode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  
  // State for location search
  const [openPickupSearch, setOpenPickupSearch] = useState(false);
  const [openDropoffSearch, setOpenDropoffSearch] = useState(false);
  const [pickupSearchValue, setPickupSearchValue] = useState('');
  const [dropoffSearchValue, setDropoffSearchValue] = useState('');
  
  // Booking step state
  const [bookingStep, setBookingStep] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Reset form when modal is opened or transport changes
  useEffect(() => {
    if (open) {
      setPickupLocation('Central Metro Station');
      setDropoffLocation('');
      setIsNow(true);
      setScheduleTime('');
      setScheduleDate(new Date());
      setIsPrivate(true);
      setPassengerCount(1);
      setPaymentMethod('card');
      setSpecialRequests('');
      setShowSpecialRequests(false);
      setUseRewardPoints(false);
      setApplyPromoCode(false);
      setPromoCode('');
      setBookingStep(1);
    }
  }, [open, selectedTransport]);
  
  // Fetch user vehicles to show in UI
  const { data: userVehicles } = useQuery({
    queryKey: ['/api/vehicles'],
    enabled: !!user && open
  });
  
  // Filter suggestions based on search input
  const filteredPickupLocations = SUGGESTED_LOCATIONS.filter(
    location => location.toLowerCase().includes(pickupSearchValue.toLowerCase())
  );
  
  const filteredDropoffLocations = SUGGESTED_LOCATIONS.filter(
    location => location.toLowerCase().includes(dropoffSearchValue.toLowerCase())
  );

  // Calculate fare based on ride type
  const getBaseFare = () => {
    if (!selectedTransport) return 0;
    
    let fare = isPrivate 
      ? selectedTransport.baseRate + 4 // Private fare premium
      : selectedTransport.baseRate;
    
    // Scale by passenger count if it's private
    if (isPrivate && passengerCount > 1) {
      fare += (passengerCount - 1) * 2; // $2 per additional passenger
    }
    
    // Apply discount if using reward points
    if (useRewardPoints) {
      fare = Math.max(fare - 5, 0); // $5 off
    }
    
    // Apply promo code discount
    if (applyPromoCode && promoCode === 'FIRST10') {
      fare = fare * 0.9; // 10% off
    }
    
    return fare;
  };

  // Calculate estimated arrival time
  const getEstimatedArrival = () => {
    if (!selectedTransport) return "Unknown";
    
    if (isNow) {
      const waitTime = isPrivate ? "5-8" : "10-15";
      return `${waitTime} minutes`;
    } else {
      return scheduleTime ? `At ${scheduleTime}` : "At scheduled time";
    }
  };

  // Book ride mutation
  const { mutate: bookRide, isPending } = useMutation({
    mutationFn: async (rideData: any) => {
      const response = await apiRequest('POST', '/api/transportation/bookings', rideData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ride Booked",
        description: `Your ${selectedTransport?.name} has been booked successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transportation/bookings'] });
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

  const handleBookRide = () => {
    if (!selectedTransport) {
      toast({
        variant: "destructive",
        title: "Booking Failed", 
        description: "No transportation option selected"
      });
      return;
    }

    if (!dropoffLocation) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Please enter your destination"
      });
      return;
    }
    
    if (!isNow && !scheduleTime) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Please select a pickup time"
      });
      return;
    }

    const now = new Date();
    let pickupTime: Date;
    
    if (isNow) {
      pickupTime = now;
    } else {
      if (!scheduleDate || !scheduleTime) {
        toast({
          variant: "destructive",
          title: "Booking Failed",
          description: "Please select both date and time for scheduled pickup"
        });
        return;
      }
      
      pickupTime = new Date(scheduleDate);
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      pickupTime.setHours(hours, minutes);
      
      if (pickupTime < now) {
        toast({
          variant: "destructive",
          title: "Invalid Time",
          description: "Scheduled time must be in the future"
        });
        return;
      }
    }

    bookRide({
      transportTypeId: selectedTransport.id,
      pickupLocation,
      dropoffLocation,
      pickupTime: pickupTime.toISOString(),
      isShared: !isPrivate,
      amount: getBaseFare(),
      passengerCount,
      paymentMethod,
      specialInstructions: specialRequests || null,
      useRewardPoints,
      promoCode: applyPromoCode ? promoCode : null
    });
  };
  
  const handleNextStep = () => {
    if (bookingStep === 1 && !dropoffLocation) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your destination"
      });
      return;
    }
    
    if (bookingStep === 2 && !isNow && !scheduleTime) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a pickup time"
      });
      return;
    }
    
    setBookingStep(prev => Math.min(prev + 1, 3));
  };
  
  const handlePrevStep = () => {
    setBookingStep(prev => Math.max(prev - 1, 1));
  };

  if (!selectedTransport) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {bookingStep === 1 && "Book Last-Mile Ride"}
            {bookingStep === 2 && "Ride Options"}
            {bookingStep === 3 && "Review & Payment"}
          </DialogTitle>
        </DialogHeader>
        
        {/* Step 1: Location Selection */}
        {bookingStep === 1 && (
          <div className="space-y-4">
            <div className="flex space-x-3 mb-4">
              <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center">
                <Car className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedTransport.name}</h3>
                <div className="flex items-center text-sm text-neutral-600">
                  <Clock className="h-3 w-3 mr-1" /> 
                  <span>Estimated arrival: {getEstimatedArrival()}</span>
                </div>
              </div>
              <Badge variant="outline" className="self-start">
                ${getBaseFare().toFixed(2)}
              </Badge>
            </div>
            
            {/* Pickup Location */}
            <div className="relative">
              <Label className="block text-sm font-medium mb-2">Pickup Location</Label>
              <Popover open={openPickupSearch} onOpenChange={setOpenPickupSearch}>
                <PopoverTrigger asChild>
                  <div className="flex items-center p-3 bg-neutral-100 rounded-lg cursor-pointer">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={openPickupSearch}
                        className="justify-between w-full p-0 h-auto font-normal bg-transparent hover:bg-transparent"
                      >
                        <span className="text-sm">{pickupLocation}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      <p className="text-xs text-neutral-500">Pickup Point</p>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search locations..." 
                      value={pickupSearchValue}
                      onValueChange={setPickupSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {filteredPickupLocations.map((location) => (
                          <CommandItem
                            key={location}
                            value={location}
                            onSelect={(currentValue) => {
                              setPickupLocation(currentValue);
                              setOpenPickupSearch(false);
                              setPickupSearchValue("");
                            }}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            {location}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Dropoff Location */}
            <div className="relative">
              <Label className="block text-sm font-medium mb-2">Destination</Label>
              <Popover open={openDropoffSearch} onOpenChange={setOpenDropoffSearch}>
                <PopoverTrigger asChild>
                  <div className="flex items-center p-3 bg-neutral-100 rounded-lg cursor-pointer">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
                      <Flag className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={openDropoffSearch}
                        className="justify-between w-full p-0 h-auto font-normal bg-transparent hover:bg-transparent"
                      >
                        {dropoffLocation ? (
                          <span className="text-sm">{dropoffLocation}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Select destination...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      <p className="text-xs text-neutral-500">Destination</p>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search destinations..." 
                      value={dropoffSearchValue}
                      onValueChange={setDropoffSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>No destination found.</CommandEmpty>
                      <CommandGroup>
                        {filteredDropoffLocations.map((location) => (
                          <CommandItem
                            key={location}
                            value={location}
                            onSelect={(currentValue) => {
                              setDropoffLocation(currentValue);
                              setOpenDropoffSearch(false);
                              setDropoffSearchValue("");
                            }}
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            {location}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={handleNextStep}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Step 2: Ride Options */}
        {bookingStep === 2 && (
          <div className="space-y-4">
            {/* When to Ride */}
            <div>
              <Label className="block text-sm font-medium mb-2">When do you need the ride?</Label>
              <div className="flex space-x-2">
                <Button
                  variant={isNow ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsNow(true)}
                >
                  <Clock className="h-4 w-4 mr-2" /> Now
                </Button>
                <Button
                  variant={!isNow ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsNow(false)}
                >
                  <CalendarClock className="h-4 w-4 mr-2" /> Schedule
                </Button>
              </div>
              
              {!isNow && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduleDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {scheduleDate ? format(scheduleDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        {/* Calendar would go here (simplified) */}
                        <div className="p-3 text-center">
                          <p className="text-sm text-muted-foreground">Calendar simplified for demo</p>
                          <Button 
                            className="mt-2" 
                            variant="outline" 
                            onClick={() => setScheduleDate(new Date(Date.now() + 86400000))}
                          >
                            Set Tomorrow
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Time</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Ride Options */}
            <div>
              <Label className="block text-sm font-medium mb-2">Ride Options</Label>
              <div className="space-y-2">
                <div 
                  className={`flex items-center p-3 border rounded-lg cursor-pointer
                    ${isPrivate ? 'border-primary' : 'border-neutral-300'}`}
                  onClick={() => setIsPrivate(true)}
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Private</p>
                    <p className="text-xs text-neutral-600">Just for you</p>
                  </div>
                  <span className="font-semibold">${(selectedTransport.baseRate + 4).toFixed(2)}</span>
                </div>
                
                <div 
                  className={`flex items-center p-3 border rounded-lg cursor-pointer
                    ${!isPrivate ? 'border-primary' : 'border-neutral-300'}`}
                  onClick={() => setIsPrivate(false)}
                >
                  <div className="w-8 h-8 bg-neutral-400 text-white rounded-full flex items-center justify-center mr-3">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Shared</p>
                    <p className="text-xs text-neutral-600">May include other passengers</p>
                  </div>
                  <span className="font-semibold">${selectedTransport.baseRate.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Number of Passengers */}
            {isPrivate && (
              <div>
                <Label className="block text-sm font-medium mb-2">
                  Number of Passengers
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 inline ml-1 text-neutral-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Each additional passenger costs $2 extra</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select value={passengerCount.toString()} onValueChange={val => setPassengerCount(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="How many passengers?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 passenger</SelectItem>
                    <SelectItem value="2">2 passengers</SelectItem>
                    <SelectItem value="3">3 passengers</SelectItem>
                    <SelectItem value="4">4 passengers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Special Requests */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Special Requests</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSpecialRequests(!showSpecialRequests)}
                >
                  {showSpecialRequests ? "Hide" : "Show"}
                </Button>
              </div>
              
              {showSpecialRequests && (
                <Textarea
                  placeholder="Any special instructions for the driver? (e.g., 'Call when arriving', 'Need help with luggage')"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full"
                />
              )}
            </div>
            
            <div className="flex space-x-2 mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <Button 
                className="flex-1"
                onClick={handleNextStep}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Review & Payment */}
        {bookingStep === 3 && (
          <div className="space-y-4">
            {/* Trip Summary */}
            <div className="bg-neutral-50 p-3 rounded-lg space-y-2">
              <h3 className="font-medium text-sm">Trip Summary</h3>
              
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">From:</span>
                <span className="font-medium">{pickupLocation}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">To:</span>
                <span className="font-medium">{dropoffLocation}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">When:</span>
                <span className="font-medium">
                  {isNow ? 'Now' : `${scheduleDate ? format(scheduleDate, 'MMM d') : ''} at ${scheduleTime}`}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Ride Type:</span>
                <span className="font-medium">{isPrivate ? 'Private' : 'Shared'}</span>
              </div>
              
              {isPrivate && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Passengers:</span>
                  <span className="font-medium">{passengerCount}</span>
                </div>
              )}
              
              <div className="border-t border-neutral-200 mt-2 pt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total Fare:</span>
                  <span className="font-bold">${getBaseFare().toFixed(2)}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Includes taxes and fees
                </p>
              </div>
            </div>
            
            {/* Payment Method */}
            <div>
              <Label className="block text-sm font-medium mb-2">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit Card (**** 4589)
                    </div>
                  </SelectItem>
                  <SelectItem value="paypal">
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2" />
                      PayPal
                    </div>
                  </SelectItem>
                  <SelectItem value="new">Add New Payment Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Promotions and Rewards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-2" />
                  <Label className="text-sm">Use 500 reward points ($5 off)</Label>
                </div>
                <input 
                  type="checkbox" 
                  checked={useRewardPoints}
                  onChange={(e) => setUseRewardPoints(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm">Apply promo code</Label>
                  <input 
                    type="checkbox" 
                    checked={applyPromoCode}
                    onChange={(e) => setApplyPromoCode(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                {applyPromoCode && (
                  <Input 
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full"
                  />
                )}
                {applyPromoCode && promoCode === 'FIRST10' && (
                  <p className="text-xs text-green-600 mt-1">10% discount applied!</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <Button 
                className="flex-1 bg-secondary text-white"
                onClick={handleBookRide}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Book for $${getBaseFare().toFixed(2)}`
                )}
              </Button>
            </div>
            
            <p className="text-xs text-center text-neutral-500 mt-2">
              {isNow ? (
                <>Your driver will arrive in approximately {isPrivate ? "5-8" : "10-15"} minutes</>
              ) : (
                <>Your ride is scheduled for {scheduleTime} on {scheduleDate ? format(scheduleDate, 'MMMM d') : 'the selected date'}</>
              )}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransportBookingModal;
