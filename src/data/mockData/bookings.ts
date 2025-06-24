
export interface Booking {
  id: string;
  time: string;
  service: 'Karaoke' | 'Venue Hire' | 'Event Tickets';
  customer: {
    name: string;
    phone: string;
  };
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  room?: string;
  duration: string;
}

export interface DashboardMetrics {
  todaysBookings: {
    total: number;
    breakdown: {
      karaoke: number;
      venueHire: number;
      eventTickets: number;
    };
  };
  todaysRevenue: {
    amount: number;
    change: number;
  };
  currentOccupancy: {
    percentage: number;
    available: number;
    occupied: number;
    maintenance: number;
    total: number;
  };
}

export const mockTodaysBookings: Booking[] = [
  {
    id: '1',
    time: '10:00',
    service: 'Karaoke',
    customer: {
      name: 'Sarah Johnson',
      phone: '+44 7123 456789'
    },
    guests: 4,
    status: 'confirmed',
    room: 'Room A',
    duration: '2h'
  },
  {
    id: '2',
    time: '12:30',
    service: 'Venue Hire',
    customer: {
      name: 'Tech Startup Ltd',
      phone: '+44 7987 654321'
    },
    guests: 25,
    status: 'confirmed',
    room: 'Main Hall',
    duration: '4h'
  },
  {
    id: '3',
    time: '14:00',
    service: 'Karaoke',
    customer: {
      name: 'Mike Chen',
      phone: '+44 7456 123789'
    },
    guests: 6,
    status: 'pending',
    room: 'Room B',
    duration: '3h'
  },
  {
    id: '4',
    time: '16:00',
    service: 'Event Tickets',
    customer: {
      name: 'Emma Wilson',
      phone: '+44 7789 456123'
    },
    guests: 2,
    status: 'confirmed',
    duration: '3h'
  },
  {
    id: '5',
    time: '18:30',
    service: 'Karaoke',
    customer: {
      name: 'David Brown',
      phone: '+44 7321 987654'
    },
    guests: 8,
    status: 'cancelled',
    room: 'Room C',
    duration: '2h'
  }
];

export const mockDashboardMetrics: DashboardMetrics = {
  todaysBookings: {
    total: 18,
    breakdown: {
      karaoke: 12,
      venueHire: 4,
      eventTickets: 2
    }
  },
  todaysRevenue: {
    amount: 1247.50,
    change: 15.3
  },
  currentOccupancy: {
    percentage: 67,
    available: 4,
    occupied: 8,
    maintenance: 0,
    total: 12
  }
};
