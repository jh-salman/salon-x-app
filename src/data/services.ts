export interface ServiceOption {
  id: string;
  name: string;
  duration?: number;
  price?: number;
}

export const MOCK_SERVICES: ServiceOption[] = [
  { id: 's1', name: 'Haircut', duration: 45, price: 55 },
  { id: 's2', name: 'Full color', duration: 90, price: 95 },
  { id: 's3', name: 'Balayage', duration: 180, price: 185 },
  { id: 's4', name: 'Blow dry', duration: 30, price: 45 },
  { id: 's5', name: 'Manicure', duration: 45, price: 35 },
  { id: 's6', name: 'Pedicure', duration: 60, price: 50 },
  { id: 's7', name: 'Facial', duration: 60, price: 85 },
  { id: 's8', name: 'Trim', duration: 15, price: 25 },
];
