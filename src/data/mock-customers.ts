/**
 * Mock customer data for workshop exercises
 * Used throughout the Customer Intelligence Dashboard components
 */

export interface Customer {
  id: string;
  name: string;
  company: string;
  healthScore: number;
  email?: string;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  domains?: string[]; // Customer websites to health check
  createdAt?: string;
  updatedAt?: string;
}

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Acme Corp',
    healthScore: 85,
    email: 'john.smith@acmecorp.com',
    subscriptionTier: 'premium',
    domains: ['acmecorp.com', 'portal.acmecorp.com'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    company: 'TechStart Inc',
    healthScore: 45,
    email: 'sarah@techstart.io',
    subscriptionTier: 'basic',
    domains: ['techstart.io'],
    createdAt: '2024-01-20T14:22:00Z',
    updatedAt: '2024-01-20T14:22:00Z'
  },
  {
    id: '3',
    name: 'Michael Brown',
    company: 'Global Solutions',
    healthScore: 15,
    email: 'mbrown@globalsolutions.com',
    subscriptionTier: 'basic',
    domains: ['globalsolutions.com', 'api.globalsolutions.com', 'cdn.globalsolutions.com'],
    createdAt: '2024-01-25T09:45:00Z',
    updatedAt: '2024-01-25T09:45:00Z'
  },
  {
    id: '4',
    name: 'Emily Davis',
    company: 'Innovation Labs',
    healthScore: 92,
    email: 'emily.davis@innovationlabs.tech',
    subscriptionTier: 'enterprise',
    domains: ['innovationlabs.tech', 'app.innovationlabs.tech'],
    createdAt: '2024-01-10T16:18:00Z',
    updatedAt: '2024-01-10T16:18:00Z'
  },
  {
    id: '5',
    name: 'David Wilson',
    company: 'Future Systems',
    healthScore: 60,
    email: 'dwilson@futuresystems.net',
    subscriptionTier: 'premium',
    domains: ['futuresystems.net', 'secure.futuresystems.net'],
    createdAt: '2024-01-30T11:05:00Z',
    updatedAt: '2024-01-30T11:05:00Z'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    company: 'Smart Ventures',
    healthScore: 73,
    email: 'lisa@smartventures.co',
    subscriptionTier: 'premium',
    domains: ['smartventures.co'],
    createdAt: '2024-02-01T13:40:00Z',
    updatedAt: '2024-02-01T13:40:00Z'
  },
  {
    id: '7',
    name: 'Robert Chen',
    company: 'DataFlow Analytics',
    healthScore: 88,
    email: 'robert@dataflow.ai',
    subscriptionTier: 'enterprise',
    domains: ['dataflow.ai', 'analytics.dataflow.ai', 'api.dataflow.ai'],
    createdAt: '2024-01-12T08:15:00Z',
    updatedAt: '2024-01-12T08:15:00Z'
  },
  {
    id: '8',
    name: 'Maria Rodriguez',
    company: 'CloudFirst Solutions',
    healthScore: 35,
    email: 'maria.rodriguez@cloudfirst.com',
    subscriptionTier: 'basic',
    domains: ['cloudfirst.com', 'support.cloudfirst.com'],
    createdAt: '2024-01-28T15:30:00Z',
    updatedAt: '2024-01-28T15:30:00Z'
  },
  {
    id: '9',
    name: 'James Patel',
    company: 'NexGen Software',
    healthScore: 78,
    email: 'james.patel@nexgen.io',
    subscriptionTier: 'premium',
    domains: ['nexgen.io', 'app.nexgen.io'],
    createdAt: '2024-02-05T09:00:00Z',
    updatedAt: '2024-02-05T09:00:00Z'
  },
  {
    id: '10',
    name: 'Sophie Turner',
    company: 'Apex Digital',
    healthScore: 22,
    email: 'sturner@apexdigital.com',
    subscriptionTier: 'basic',
    domains: ['apexdigital.com'],
    createdAt: '2024-02-08T11:20:00Z',
    updatedAt: '2024-02-08T11:20:00Z'
  },
  {
    id: '11',
    name: 'Carlos Mendes',
    company: 'BrightPath Analytics',
    healthScore: 91,
    email: 'carlos@brightpath.ai',
    subscriptionTier: 'enterprise',
    domains: ['brightpath.ai', 'dashboard.brightpath.ai', 'api.brightpath.ai'],
    createdAt: '2024-02-10T14:45:00Z',
    updatedAt: '2024-02-10T14:45:00Z'
  },
  {
    id: '12',
    name: 'Aisha Okafor',
    company: 'Vertex Systems',
    healthScore: 55,
    email: 'aokafor@vertexsystems.net',
    subscriptionTier: 'premium',
    domains: ['vertexsystems.net', 'portal.vertexsystems.net'],
    createdAt: '2024-02-12T08:30:00Z',
    updatedAt: '2024-02-12T08:30:00Z'
  },
  {
    id: '13',
    name: 'Tom Nakamura',
    company: 'Pulse Commerce',
    healthScore: 67,
    email: 'tnakamura@pulsecommerce.co',
    subscriptionTier: 'basic',
    domains: ['pulsecommerce.co'],
    createdAt: '2024-02-15T10:10:00Z',
    updatedAt: '2024-02-15T10:10:00Z'
  },
  {
    id: '14',
    name: 'Rachel Kim',
    company: 'Horizon Labs',
    healthScore: 84,
    email: 'rkim@horizonlabs.tech',
    subscriptionTier: 'enterprise',
    domains: ['horizonlabs.tech', 'app.horizonlabs.tech', 'docs.horizonlabs.tech'],
    createdAt: '2024-02-18T13:00:00Z',
    updatedAt: '2024-02-18T13:00:00Z'
  },
  {
    id: '15',
    name: 'Omar Hassan',
    company: 'SwiftScale Inc',
    healthScore: 8,
    email: 'omar.hassan@swiftscale.com',
    subscriptionTier: 'basic',
    domains: ['swiftscale.com', 'beta.swiftscale.com'],
    createdAt: '2024-02-20T16:55:00Z',
    updatedAt: '2024-02-20T16:55:00Z'
  }
];

export default mockCustomers;