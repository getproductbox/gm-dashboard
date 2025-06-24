
export interface CalendarBooking {
  id: string;
  resourceId: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  date: string;      // Format: "YYYY-MM-DD"
  customer: {
    name: string;
    phone: string;
  };
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  service: 'Karaoke' | 'Venue Hire';
}

export interface CalendarResource {
  id: string;
  name: string;
  type: 'karaoke' | 'venue';
}

export const mockCalendarResources: CalendarResource[] = [
  { id: 'karaoke-a', name: 'Karaoke Room A', type: 'karaoke' },
  { id: 'karaoke-b', name: 'Karaoke Room B', type: 'karaoke' },
  { id: 'karaoke-c', name: 'Karaoke Room C', type: 'karaoke' },
  { id: 'main-venue', name: 'Main Venue', type: 'venue' }
];

export const mockCalendarBookings: CalendarBooking[] = [
  {
    id: '1',
    resourceId: 'karaoke-a',
    startTime: '10:00',
    endTime: '12:00',
    date: '2025-06-24',
    customer: {
      name: 'Sarah Johnson',
      phone: '+44 7123 456789'
    },
    guests: 4,
    status: 'confirmed',
    service: 'Karaoke'
  },
  {
    id: '2',
    resourceId: 'main-venue',
    startTime: '14:00',
    endTime: '18:00',
    date: '2025-06-24',
    customer: {
      name: 'Tech Startup Ltd',
      phone: '+44 7987 654321'
    },
    guests: 25,
    status: 'confirmed',
    service: 'Venue Hire'
  },
  {
    id: '3',
    resourceId: 'karaoke-b',
    startTime: '16:00',
    endTime: '19:00',
    date: '2025-06-24',
    customer: {
      name: 'Mike Chen',
      phone: '+44 7456 123789'
    },
    guests: 6,
    status: 'pending',
    service: 'Karaoke'
  },
  {
    id: '4',
    resourceId: 'karaoke-c',
    startTime: '12:00',
    endTime: '13:00',
    date: '2025-06-24',
    customer: {
      name: 'Emma Wilson',
      phone: '+44 7789 456123'
    },
    guests: 2,
    status: 'confirmed',
    service: 'Karaoke'
  },
  {
    id: '5',
    resourceId: 'karaoke-a',
    startTime: '20:00',
    endTime: '22:00',
    date: '2025-06-24',
    customer: {
      name: 'David Brown',
      phone: '+44 7321 987654'
    },
    guests: 8,
    status: 'cancelled',
    service: 'Karaoke'
  },
  {
    id: '6',
    resourceId: 'karaoke-b',
    startTime: '11:00',
    endTime: '14:00',
    date: '2025-06-24',
    customer: {
      name: 'Lisa Wang',
      phone: '+44 7654 321789'
    },
    guests: 5,
    status: 'confirmed',
    service: 'Karaoke'
  }
];

export const generateTimeSlots = (): string[] => {
  const slots = [];
  for (let hour = 10; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};
