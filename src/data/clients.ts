// Types for client details screen
export interface Service {
  id: string;
  name: string;
  price: number;
  completed?: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image?: number; // require() result
}

export interface ClientDetails {
  id: string;
  clientName: string;
  clientPhoto?: number;
  phone?: string;
  date: Date;
  duration: number;
  techniqueNotes: string[];
  personalNotes: string;
  services: Service[];
  recommendations: Service[];
  products: Product[];
}

export interface ClientSummary {
  id: string;
  clientName: string;
  clientPhoto?: number;
  lastVisit: Date;
}

// Build ClientDetails from an appointment (when client not in mock data)
export interface AppointmentLike {
  id: string;
  clientName: string;
  service: string;
  startTime: Date;
  endTime: Date;
}

export function getClientDetailsForAppointment(apt: AppointmentLike): ClientDetails {
  const duration = Math.round((apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60));
  const matching = Object.values(MOCK_CLIENT_DETAILS).find((c) => c.clientName === apt.clientName);
  if (matching) {
    return { ...matching, date: apt.startTime, duration };
  }
  return {
    id: `appointment-${apt.id}`,
    clientName: apt.clientName,
    phone: undefined,
    date: apt.startTime,
    duration,
    techniqueNotes: apt.service ? [apt.service] : [],
    personalNotes: '',
    services: [{ id: 's1', name: apt.service || 'Service', price: 0, completed: true }],
    recommendations: [],
    products: [],
  };
}

// Mock data
export const MOCK_CLIENTS: ClientSummary[] = [
  { id: '1', clientName: 'Sarah Johnson', lastVisit: new Date(2025, 1, 15) },
  { id: '2', clientName: 'Emma Williams', lastVisit: new Date(2025, 1, 14) },
  { id: '3', clientName: 'Olivia Brown', lastVisit: new Date(2025, 1, 12) },
  { id: '4', clientName: 'Sophia Davis', lastVisit: new Date(2025, 1, 10) },
  { id: '5', clientName: 'Isabella Martinez', lastVisit: new Date(2025, 1, 8) },
];

export const MOCK_CLIENT_DETAILS: Record<string, ClientDetails> = {
  '1': {
    id: '1',
    clientName: 'Sarah Johnson',
    phone: '541-556-6923',
    date: new Date(2025, 1, 15),
    duration: 90,
    techniqueNotes: ['Balayage highlights', 'Root touch-up'],
    personalNotes: 'Prefers cooler tones. Allergic to PPD.',
    services: [
      { id: 's1', name: 'Balayage', price: 185, completed: true },
      { id: 's2', name: 'Root touch-up', price: 75, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Deep conditioning treatment', price: 35 }],
    products: [
      { id: 'p1', name: 'Purple Shampoo', brand: 'Olaplex', price: 28 },
      { id: 'p2', name: 'No. 6 Bond Smoother', brand: 'Olaplex', price: 28 },
    ],
  },
  '2': {
    id: '2',
    clientName: 'Emma Williams',
    date: new Date(2025, 1, 14),
    duration: 60,
    techniqueNotes: ['Single process color'],
    personalNotes: 'Regular client, prefers natural look.',
    services: [
      { id: 's1', name: 'Full color', price: 95, completed: true },
      { id: 's2', name: 'Cut & style', price: 65, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Keratin treatment', price: 150 }],
    products: [
      { id: 'p1', name: 'Color Protect Shampoo', brand: 'Redken', price: 24 },
      { id: 'p2', name: 'Volume Injection', brand: 'Redken', price: 22 },
    ],
  },
  '3': {
    id: '3',
    clientName: 'Olivia Brown',
    date: new Date(2025, 1, 12),
    duration: 75,
    techniqueNotes: ['Highlights', 'Toner'],
    personalNotes: 'Sensitive scalp. Use gentle products.',
    services: [
      { id: 's1', name: 'Foil highlights', price: 165, completed: true },
      { id: 's2', name: 'Toner', price: 35, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Gloss treatment', price: 55 }],
    products: [
      { id: 'p1', name: 'Scalp serum', brand: 'Aveda', price: 32 },
      { id: 'p2', name: 'Damage Remedy', brand: 'Aveda', price: 34 },
    ],
  },
  '4': {
    id: '4',
    clientName: 'Sophia Davis',
    date: new Date(2025, 1, 10),
    duration: 45,
    techniqueNotes: ['Trim'],
    personalNotes: 'New client. Great conversation.',
    services: [
      { id: 's1', name: 'Haircut', price: 55, completed: true },
      { id: 's2', name: 'Blow dry', price: 35, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Balayage', price: 185 }],
    products: [
      { id: 'p1', name: 'Smooth Shampoo', brand: 'Redken', price: 20 },
      { id: 'p2', name: 'Smooth Conditioner', brand: 'Redken', price: 20 },
    ],
  },
  '5': {
    id: '5',
    clientName: 'Isabella Martinez',
    date: new Date(2025, 1, 8),
    duration: 120,
    techniqueNotes: ['Full balayage', 'Olaplex treatment'],
    personalNotes: 'Bridal prep. Wants volume for wedding.',
    services: [
      { id: 's1', name: 'Full balayage', price: 225, completed: true },
      { id: 's2', name: 'Olaplex No. 1 & 2', price: 45, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Bridal trial', price: 85 }],
    products: [
      { id: 'p1', name: 'No. 3 Hair Perfector', brand: 'Olaplex', price: 28 },
      { id: 'p2', name: ' volumizing spray', brand: 'Living Proof', price: 26 },
    ],
  },
};
