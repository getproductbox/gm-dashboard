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

export interface ExtendedBooking extends Booking {
  reference: string;
  date: string;
  amount: number;
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

// Extended booking data for the bookings list page
export const mockExtendedBookings: ExtendedBooking[] = [
  // Today's bookings
  {
    id: '1',
    reference: 'BK-2024-001',
    date: '2024-06-24',
    time: '10:00',
    service: 'Karaoke',
    customer: {
      name: 'Sarah Johnson',
      phone: '+44 7123 456789'
    },
    guests: 4,
    status: 'confirmed',
    room: 'Room A',
    duration: '2h',
    amount: 120.00
  },
  {
    id: '2',
    reference: 'BK-2024-002',
    date: '2024-06-24',
    time: '12:30',
    service: 'Venue Hire',
    customer: {
      name: 'Tech Startup Ltd',
      phone: '+44 7987 654321'
    },
    guests: 25,
    status: 'confirmed',
    room: 'Main Hall',
    duration: '4h',
    amount: 450.00
  },
  {
    id: '3',
    reference: 'BK-2024-003',
    date: '2024-06-24',
    time: '14:00',
    service: 'Karaoke',
    customer: {
      name: 'Mike Chen',
      phone: '+44 7456 123789'
    },
    guests: 6,
    status: 'pending',
    room: 'Room B',
    duration: '3h',
    amount: 180.00
  },
  {
    id: '4',
    reference: 'BK-2024-004',
    date: '2024-06-24',
    time: '16:00',
    service: 'Event Tickets',
    customer: {
      name: 'Emma Wilson',
      phone: '+44 7789 456123'
    },
    guests: 2,
    status: 'confirmed',
    duration: '3h',
    amount: 45.00
  },
  {
    id: '5',
    reference: 'BK-2024-005',
    date: '2024-06-24',
    time: '18:30',
    service: 'Karaoke',
    customer: {
      name: 'David Brown',
      phone: '+44 7321 987654'
    },
    guests: 8,
    status: 'cancelled',
    room: 'Room C',
    duration: '2h',
    amount: 160.00
  },
  // Yesterday's bookings
  {
    id: '6',
    reference: 'BK-2024-006',
    date: '2024-06-23',
    time: '19:00',
    service: 'Karaoke',
    customer: {
      name: 'Jennifer Martinez',
      phone: '+44 7234 567890'
    },
    guests: 5,
    status: 'confirmed',
    room: 'Room A',
    duration: '2h',
    amount: 150.00
  },
  {
    id: '7',
    reference: 'BK-2024-007',
    date: '2024-06-23',
    time: '15:00',
    service: 'Venue Hire',
    customer: {
      name: 'Creative Agency Co',
      phone: '+44 7345 678901'
    },
    guests: 30,
    status: 'confirmed',
    room: 'Main Hall',
    duration: '5h',
    amount: 600.00
  },
  {
    id: '8',
    reference: 'BK-2024-008',
    date: '2024-06-23',
    time: '20:30',
    service: 'Event Tickets',
    customer: {
      name: 'Alex Thompson',
      phone: '+44 7456 789012'
    },
    guests: 4,
    status: 'confirmed',
    duration: '2h',
    amount: 80.00
  },
  // Tomorrow's bookings
  {
    id: '9',
    reference: 'BK-2024-009',
    date: '2024-06-25',
    time: '11:00',
    service: 'Karaoke',
    customer: {
      name: 'Rebecca White',
      phone: '+44 7567 890123'
    },
    guests: 3,
    status: 'pending',
    room: 'Room B',
    duration: '2h',
    amount: 90.00
  },
  {
    id: '10',
    reference: 'BK-2024-010',
    date: '2024-06-25',
    time: '17:00',
    service: 'Venue Hire',
    customer: {
      name: 'Birthday Party Co',
      phone: '+44 7678 901234'
    },
    guests: 20,
    status: 'confirmed',
    room: 'Main Hall',
    duration: '3h',
    amount: 350.00
  },
  // More varied bookings
  {
    id: '11',
    reference: 'BK-2024-011',
    date: '2024-06-22',
    time: '13:30',
    service: 'Karaoke',
    customer: {
      name: 'James Wilson',
      phone: '+44 7789 012345'
    },
    guests: 7,
    status: 'confirmed',
    room: 'Room C',
    duration: '3h',
    amount: 210.00
  },
  {
    id: '12',
    reference: 'BK-2024-012',
    date: '2024-06-22',
    time: '16:00',
    service: 'Event Tickets',
    customer: {
      name: 'Maria Garcia',
      phone: '+44 7890 123456'
    },
    guests: 1,
    status: 'cancelled',
    duration: '4h',
    amount: 25.00
  },
  {
    id: '13',
    reference: 'BK-2024-013',
    date: '2024-06-21',
    time: '14:00',
    service: 'Venue Hire',
    customer: {
      name: 'Corporate Events Ltd',
      phone: '+44 7901 234567'
    },
    guests: 50,
    status: 'confirmed',
    room: 'Main Hall',
    duration: '6h',
    amount: 800.00
  },
  {
    id: '14',
    reference: 'BK-2024-014',
    date: '2024-06-21',
    time: '20:00',
    service: 'Karaoke',
    customer: {
      name: 'Peter Anderson',
      phone: '+44 7012 345678'
    },
    guests: 9,
    status: 'confirmed',
    room: 'Room A',
    duration: '2h',
    amount: 180.00
  },
  {
    id: '15',
    reference: 'BK-2024-015',
    date: '2024-06-20',
    time: '18:00',
    service: 'Event Tickets',
    customer: {
      name: 'Lisa Davis',
      phone: '+44 7123 456789'
    },
    guests: 3,
    status: 'pending',
    duration: '3h',
    amount: 60.00
  },
  {
    id: '16',
    reference: 'BK-2024-016',
    date: '2024-06-26',
    time: '12:00',
    service: 'Karaoke',
    customer: {
      name: 'Tom Harris',
      phone: '+44 7234 567890'
    },
    guests: 6,
    status: 'confirmed',
    room: 'Room B',
    duration: '4h',
    amount: 240.00
  },
  {
    id: '17',
    reference: 'BK-2024-017',
    date: '2024-06-26',
    time: '15:30',
    service: 'Venue Hire',
    customer: {
      name: 'Wedding Planners Inc',
      phone: '+44 7345 678901'
    },
    guests: 40,
    status: 'pending',
    room: 'Main Hall',
    duration: '8h',
    amount: 1200.00
  },
  {
    id: '18',
    reference: 'BK-2024-018',
    date: '2024-06-27',
    time: '19:30',
    service: 'Karaoke',
    customer: {
      name: 'Sophie Taylor',
      phone: '+44 7456 789012'
    },
    guests: 4,
    status: 'confirmed',
    room: 'Room A',
    duration: '2h',
    amount: 120.00
  },
  {
    id: '19',
    reference: 'BK-2024-019',
    date: '2024-06-27',
    time: '21:00',
    service: 'Event Tickets',
    customer: {
      name: 'Chris Johnson',
      phone: '+44 7567 890123'
    },
    guests: 2,
    status: 'cancelled',
    duration: '2h',
    amount: 40.00
  },
  {
    id: '20',
    reference: 'BK-2024-020',
    date: '2024-06-28',
    time: '10:30',
    service: 'Venue Hire',
    customer: {
      name: 'Business Conference Co',
      phone: '+44 7678 901234'
    },
    guests: 60,
    status: 'confirmed',
    room: 'Main Hall',
    duration: '7h',
    amount: 950.00
  }
];

export const mockBookings = mockExtendedBookings;

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
