import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ParkingBooking } from '@shared/schema';
import { createBookingPass } from '../lib/generateQR';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { useOfflineData } from '../hooks/useOffline';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ParkingBooking | null;
  spotNumber: string;
}

const QRCodeModal = ({ 
  open, 
  onOpenChange, 
  booking,
  spotNumber
}: QRCodeModalProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  
  // Use offline storage to cache QR codes
  const { data: cachedQRData, updateData: updateCachedQRData } = useOfflineData<Record<string, { svg: string, code: string }>>(
    'qr-codes',
    {},
    30 * 24 * 60 * 60 * 1000 // 30 days expiry
  );

  useEffect(() => {
    const generateQR = async () => {
      if (!booking) return;
      
      const bookingId = booking.id.toString();
      
      // Check if we have cached QR code
      if (cachedQRData[bookingId]) {
        setQrCode(cachedQRData[bookingId].svg);
        setBookingCode(cachedQRData[bookingId].code);
        return;
      }
      
      try {
        // Generate new QR code
        const result = await createBookingPass({
          userId: booking.userId,
          bookingId: booking.id,
          spotNumber,
          startTime: new Date(booking.startTime),
          endTime: new Date(booking.endTime),
          locationName: 'Parking Location' // In real app, we'd get this from API
        });
        
        setQrCode(result.qrCodeSvg);
        setBookingCode(result.bookingCode);
        
        // Cache the generated QR code
        updateCachedQRData({
          ...cachedQRData,
          [bookingId]: {
            svg: result.qrCodeSvg,
            code: result.bookingCode
          }
        });
        
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        setQrCode('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="40" y="100" fill="#666">QR Error</text></svg>');
      }
    };
    
    if (open && booking) {
      generateQR();
    }
  }, [open, booking, cachedQRData, updateCachedQRData]);

  const formatValidUntil = (endTime: Date | string) => {
    if (!endTime) return '';
    const date = typeof endTime === 'string' ? new Date(endTime) : endTime;
    return format(date, 'MMM d, h:mm a');
  };

  const handleDownloadPass = () => {
    if (!qrCode) return;
    
    // Create a Blob from the SVG
    const blob = new Blob([qrCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-pass-${bookingCode}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // If no booking is provided, don't render
  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold">Your Entry Pass</DialogTitle>
          <DialogDescription className="text-sm text-neutral-600">
            Present this at the parking gate
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-neutral-100 p-4 rounded-lg mb-4">
          <div className="bg-white p-3 rounded">
            {qrCode ? (
              <div 
                className="w-full aspect-square flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />
            ) : (
              <div className="w-full aspect-square bg-neutral-200 flex items-center justify-center animate-pulse">
                <span className="text-neutral-400">Loading...</span>
              </div>
            )}
          </div>
          <div className="text-center mt-3">
            <p className="font-medium">Parking Spot #{spotNumber}</p>
            <p className="text-sm text-neutral-600">
              Valid until {formatValidUntil(booking.endTime)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleDownloadPass}
          >
            <Download className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button 
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
