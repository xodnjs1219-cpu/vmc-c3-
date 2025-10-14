const QR_DATA_PREFIX = 'booking://verify';
const DEFAULT_ELEMENT_ID = 'booking-qr-code';
const SVG_MIME_TYPE = 'image/svg+xml;charset=utf-8';

export const generateQRCodeData = (bookingId: string) =>
  `${QR_DATA_PREFIX}/${bookingId}`;

export const downloadQRCodeAsSvg = (
  bookingId: string,
  elementId: string = DEFAULT_ELEMENT_ID,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const target = document.getElementById(elementId);

  if (!(target instanceof SVGElement)) {
    return;
  }

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(target);
  const blob = new Blob([source], { type: SVG_MIME_TYPE });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `booking-${bookingId}-qrcode.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const downloadQRCode = downloadQRCodeAsSvg;
