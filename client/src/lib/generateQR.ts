/**
 * Generates a QR code SVG for booking passes
 * 
 * @param data The data to encode in the QR code
 * @param options Configuration options for the QR code
 * @returns SVG string representation of the QR code
 */
export async function generateQRCode(data: string, options: { 
  size?: number;
  foreground?: string;
  background?: string;
  margin?: number;
  ecLevel?: 'L' | 'M' | 'Q' | 'H';
} = {}): Promise<string> {
  // Default options
  const config = {
    size: options.size || 200,
    foreground: options.foreground || '#000000',
    background: options.background || '#ffffff',
    margin: options.margin || 4,
    ecLevel: options.ecLevel || 'M'
  };

  try {
    // Dynamically import QRCode library to save bundle size
    const QRCode = (await import('qrcode')).default;
    
    // Generate QR code with the specified options
    return await QRCode.toString(data, {
      type: 'svg',
      color: {
        dark: config.foreground,
        light: config.background
      },
      width: config.size,
      margin: config.margin,
      errorCorrectionLevel: config.ecLevel
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    
    // Fallback SVG with error message
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.size}" height="${config.size}" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${config.background}" />
      <text x="10" y="50" font-family="Arial" font-size="10" fill="${config.foreground}">
        QR Generation Failed
      </text>
    </svg>`;
  }
}

/**
 * Creates a data URL from SVG content for direct image use
 * 
 * @param svgContent The SVG content as a string
 * @returns A data URL string that can be used as an image source
 */
export function svgToDataUrl(svgContent: string): string {
  // Ensure safe encoding of SVG content
  const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
  return `data:image/svg+xml;base64,${base64Svg}`;
}

/**
 * Generates a booking code for use in QR codes and entry passes
 * 
 * @param userId The user ID
 * @param bookingId The booking ID
 * @returns A unique booking code string
 */
export function generateBookingCode(userId: number, bookingId: number): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `PARK-${userId}-${bookingId}-${timestamp}${randomStr}`.toUpperCase();
}

/**
 * Creates a complete booking entry pass
 * 
 * @param bookingData The booking data to encode
 * @returns Object containing the QR code SVG and the booking code
 */
export async function createBookingPass(bookingData: {
  userId: number;
  bookingId: number;
  spotNumber: string;
  startTime: Date;
  endTime: Date;
  locationName: string;
}): Promise<{ qrCodeSvg: string; bookingCode: string; dataUrl: string }> {
  const bookingCode = generateBookingCode(bookingData.userId, bookingData.bookingId);
  
  // Create data to encode in QR code
  const qrData = JSON.stringify({
    code: bookingCode,
    spot: bookingData.spotNumber,
    valid: bookingData.endTime.toISOString()
  });
  
  const qrCodeSvg = await generateQRCode(qrData, {
    size: 300,
    ecLevel: 'H'  // Higher error correction for better scanning
  });
  
  const dataUrl = svgToDataUrl(qrCodeSvg);
  
  return {
    qrCodeSvg,
    bookingCode,
    dataUrl
  };
}
