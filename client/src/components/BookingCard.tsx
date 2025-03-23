import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ParkingBooking } from '@shared/schema';
import { Car, QrCode, Expand } from 'lucide-react';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: ParkingBooking;
  locationName: string;
  spotDetails: {
    spotNumber: string;
    level?: string;
    section?: string;
  };
  expanded?: boolean;
  onViewDetails: () => void;
  onModify: () => void;
}

const BookingCard = ({
  booking,
  locationName,
  spotDetails,
  expanded = false,
  onViewDetails,
  onModify
}: BookingCardProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Format the date and time for display
  const formatBookingDate = (start: Date, end: Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const isToday = new Date().toDateString() === startDate.toDateString();
    const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === startDate.toDateString();
    
    const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(startDate, 'MMM d, yyyy');
    
    return `${dayLabel}, ${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  };

  // Get appropriate badge color based on booking status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-neutral-800';
      case 'canceled':
        return 'bg-red-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className={`${isExpanded ? 'border-l-4 border-primary' : ''} bg-neutral-100 rounded-lg p-0 overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{locationName}</h3>
            <p className="text-sm text-neutral-600">
              {formatBookingDate(booking.startTime, booking.endTime)}
            </p>
          </div>
          <span className={`${getStatusBadge(booking.status)} text-xs font-medium px-2 py-1 rounded`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
        
        {isExpanded ? (
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Parking Spot #{spotDetails.spotNumber}</p>
                <p className="text-xs text-neutral-600">
                  {spotDetails.level && spotDetails.section 
                    ? `Level ${spotDetails.level}, Section ${spotDetails.section}` 
                    : 'Location details not available'}
                </p>
              </div>
            </div>
            
            <div className="mt-3 flex items-center">
              <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center mr-3">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Entry Code</p>
                <p className="text-xs text-neutral-600">Use QR code at entrance gate</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={onViewDetails}>
                <Expand className="h-4 w-4 text-neutral-700" />
              </Button>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={onModify}>
                Modify
              </Button>
              <Button className="flex-1" onClick={onViewDetails}>
                View Details
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-between">
            <span className="text-sm text-neutral-600">Parking Spot #{spotDetails.spotNumber}</span>
            <Button 
              variant="link" 
              className="text-primary text-sm font-medium p-0 h-auto" 
              onClick={() => setIsExpanded(true)}
            >
              Show Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingCard;
