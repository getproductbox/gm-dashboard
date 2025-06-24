export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastVisit: string;
  customerSince: string;
  status: 'first-time' | 'returning';
}

export interface DetailedCustomer extends Customer {
  totalSpent: number;
  notes?: string;
  emailConsent: boolean;
  smsConsent: boolean;
  bookingHistory: BookingRecord[];
  insights: CustomerInsights;
}

export interface BookingRecord {
  date: string;
  service: string;
  amount: number;
  status: 'completed' | 'confirmed' | 'cancelled' | 'no-show';
}

export interface CustomerInsights {
  favoriteService: string;
  averageBookingValue: number;
  preferredTime: string;
  bookingPattern: string;
}

export interface CustomerStats {
  totalCustomers: number;
  newThisMonth: number;
  returningRate: number;
}

export const mockCustomers: Customer[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+44 7123 456789',
    totalBookings: 15,
    lastVisit: '2024-06-23',
    customerSince: '2023-03-15',
    status: 'returning'
  },
  {
    id: '2',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@email.com',
    phone: '+44 7456 123789',
    totalBookings: 3,
    lastVisit: '2024-06-20',
    customerSince: '2024-05-10',
    status: 'returning'
  },
  {
    id: '3',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.wilson@email.com',
    phone: '+44 7789 456123',
    totalBookings: 1,
    lastVisit: '2024-06-24',
    customerSince: '2024-06-24',
    status: 'first-time'
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@email.com',
    phone: '+44 7321 987654',
    totalBookings: 8,
    lastVisit: '2024-06-22',
    customerSince: '2023-09-08',
    status: 'returning'
  },
  {
    id: '5',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jennifer.martinez@email.com',
    phone: '+44 7234 567890',
    totalBookings: 12,
    lastVisit: '2024-06-21',
    customerSince: '2023-01-20',
    status: 'returning'
  },
  {
    id: '6',
    firstName: 'Alex',
    lastName: 'Thompson',
    email: 'alex.thompson@email.com',
    phone: '+44 7456 789012',
    totalBookings: 2,
    lastVisit: '2024-06-19',
    customerSince: '2024-06-01',
    status: 'returning'
  },
  {
    id: '7',
    firstName: 'Rebecca',
    lastName: 'White',
    email: 'rebecca.white@email.com',
    phone: '+44 7567 890123',
    totalBookings: 7,
    lastVisit: '2024-06-18',
    customerSince: '2023-11-12',
    status: 'returning'
  },
  {
    id: '8',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@email.com',
    phone: '+44 7789 012345',
    totalBookings: 1,
    lastVisit: '2024-06-24',
    customerSince: '2024-06-24',
    status: 'first-time'
  },
  {
    id: '9',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@email.com',
    phone: '+44 7890 123456',
    totalBookings: 4,
    lastVisit: '2024-06-17',
    customerSince: '2024-02-28',
    status: 'returning'
  },
  {
    id: '10',
    firstName: 'Peter',
    lastName: 'Anderson',
    email: 'peter.anderson@email.com',
    phone: '+44 7012 345678',
    totalBookings: 9,
    lastVisit: '2024-06-16',
    customerSince: '2023-07-05',
    status: 'returning'
  },
  {
    id: '11',
    firstName: 'Lisa',
    lastName: 'Davis',
    email: 'lisa.davis@email.com',
    phone: '+44 7123 456789',
    totalBookings: 6,
    lastVisit: '2024-06-15',
    customerSince: '2023-12-03',
    status: 'returning'
  },
  {
    id: '12',
    firstName: 'Tom',
    lastName: 'Harris',
    email: 'tom.harris@email.com',
    phone: '+44 7234 567890',
    totalBookings: 11,
    lastVisit: '2024-06-14',
    customerSince: '2023-04-18',
    status: 'returning'
  },
  {
    id: '13',
    firstName: 'Sophie',
    lastName: 'Taylor',
    email: 'sophie.taylor@email.com',
    phone: '+44 7345 678901',
    totalBookings: 1,
    lastVisit: '2024-06-24',
    customerSince: '2024-06-24',
    status: 'first-time'
  },
  {
    id: '14',
    firstName: 'Chris',
    lastName: 'Johnson',
    email: 'chris.johnson@email.com',
    phone: '+44 7456 789012',
    totalBookings: 5,
    lastVisit: '2024-06-13',
    customerSince: '2024-01-15',
    status: 'returning'
  },
  {
    id: '15',
    firstName: 'Amanda',
    lastName: 'Lee',
    email: 'amanda.lee@email.com',
    phone: '+44 7567 890123',
    totalBookings: 13,
    lastVisit: '2024-06-12',
    customerSince: '2022-11-22',
    status: 'returning'
  },
  {
    id: '16',
    firstName: 'Ryan',
    lastName: 'Miller',
    email: 'ryan.miller@email.com',
    phone: '+44 7678 901234',
    totalBookings: 2,
    lastVisit: '2024-06-11',
    customerSince: '2024-05-30',
    status: 'returning'
  },
  {
    id: '17',
    firstName: 'Nicole',
    lastName: 'Clark',
    email: 'nicole.clark@email.com',
    phone: '+44 7789 012345',
    totalBookings: 8,
    lastVisit: '2024-06-10',
    customerSince: '2023-08-14',
    status: 'returning'
  },
  {
    id: '18',
    firstName: 'Kevin',
    lastName: 'Rodriguez',
    email: 'kevin.rodriguez@email.com',
    phone: '+44 7890 123456',
    totalBookings: 1,
    lastVisit: '2024-06-24',
    customerSince: '2024-06-24',
    status: 'first-time'
  },
  {
    id: '19',
    firstName: 'Michelle',
    lastName: 'Lewis',
    email: 'michelle.lewis@email.com',
    phone: '+44 7901 234567',
    totalBookings: 10,
    lastVisit: '2024-06-09',
    customerSince: '2023-05-07',
    status: 'returning'
  },
  {
    id: '20',
    firstName: 'Daniel',
    lastName: 'Walker',
    email: 'daniel.walker@email.com',
    phone: '+44 7012 345678',
    totalBookings: 6,
    lastVisit: '2024-06-08',
    customerSince: '2023-10-25',
    status: 'returning'
  },
  {
    id: '21',
    firstName: 'Jessica',
    lastName: 'Hall',
    email: 'jessica.hall@email.com',
    phone: '+44 7123 456789',
    totalBookings: 14,
    lastVisit: '2024-06-07',
    customerSince: '2022-12-12',
    status: 'returning'
  },
  {
    id: '22',
    firstName: 'Matthew',
    lastName: 'Allen',
    email: 'matthew.allen@email.com',
    phone: '+44 7234 567890',
    totalBookings: 3,
    lastVisit: '2024-06-06',
    customerSince: '2024-04-20',
    status: 'returning'
  },
  {
    id: '23',
    firstName: 'Ashley',
    lastName: 'Young',
    email: 'ashley.young@email.com',
    phone: '+44 7345 678901',
    totalBookings: 1,
    lastVisit: '2024-06-24',
    customerSince: '2024-06-24',
    status: 'first-time'
  },
  {
    id: '24',
    firstName: 'Brandon',
    lastName: 'King',
    email: 'brandon.king@email.com',
    phone: '+44 7456 789012',
    totalBookings: 7,
    lastVisit: '2024-06-05',
    customerSince: '2023-06-30',
    status: 'returning'
  },
  {
    id: '25',
    firstName: 'Stephanie',
    lastName: 'Wright',
    email: 'stephanie.wright@email.com',
    phone: '+44 7567 890123',
    totalBookings: 9,
    lastVisit: '2024-06-04',
    customerSince: '2023-02-14',
    status: 'returning'
  },
  {
    id: '26',
    firstName: 'Justin',
    lastName: 'Lopez',
    email: 'justin.lopez@email.com',
    phone: '+44 7678 901234',
    totalBookings: 4,
    lastVisit: '2024-06-03',
    customerSince: '2024-03-08',
    status: 'returning'
  },
  {
    id: '27',
    firstName: 'Rachel',
    lastName: 'Hill',
    email: 'rachel.hill@email.com',
    phone: '+44 7789 012345',
    totalBookings: 12,
    lastVisit: '2024-06-02',
    customerSince: '2022-10-05',
    status: 'returning'
  },
  {
    id: '28',
    firstName: 'Tyler',
    lastName: 'Green',
    email: 'tyler.green@email.com',
    phone: '+44 7890 123456',
    totalBookings: 1,
    lastVisit: '2024-06-24',
    customerSince: '2024-06-24',
    status: 'first-time'
  },
  {
    id: '29',
    firstName: 'Megan',
    lastName: 'Adams',
    email: 'megan.adams@email.com',
    phone: '+44 7901 234567',
    totalBookings: 8,
    lastVisit: '2024-06-01',
    customerSince: '2023-09-20',
    status: 'returning'
  },
  {
    id: '30',
    firstName: 'Aaron',
    lastName: 'Baker',
    email: 'aaron.baker@email.com',
    phone: '+44 7012 345678',
    totalBookings: 5,
    lastVisit: '2024-05-31',
    customerSince: '2024-01-10',
    status: 'returning'
  }
];

export const mockCustomerStats: CustomerStats = {
  totalCustomers: 156,
  newThisMonth: 12,
  returningRate: 85.3
};

export const getDetailedCustomerData = (customerId: string): DetailedCustomer | null => {
  const customer = mockCustomers.find(c => c.id === customerId);
  if (!customer) return null;

  // Generate booking history based on total bookings
  const generateBookingHistory = (totalBookings: number, customerSince: string): BookingRecord[] => {
    const services = [
      'Men\'s Haircut', 'Women\'s Cut & Style', 'Hair Washing', 'Beard Trim', 
      'Hair Coloring', 'Highlights', 'Perm', 'Straightening', 'Deep Conditioning'
    ];
    
    const statuses: BookingRecord['status'][] = ['completed', 'completed', 'completed', 'confirmed', 'cancelled'];
    
    const bookings: BookingRecord[] = [];
    const startDate = new Date(customerSince);
    const endDate = new Date(customer.lastVisit);
    
    for (let i = 0; i < totalBookings; i++) {
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      bookings.push({
        date: randomDate.toISOString().split('T')[0],
        service: services[Math.floor(Math.random() * services.length)],
        amount: Math.floor(Math.random() * 100) + 30, // £30-£130
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
    
    return bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const bookingHistory = generateBookingHistory(customer.totalBookings, customer.customerSince);
  const totalSpent = bookingHistory.reduce((sum, booking) => sum + booking.amount, 0);
  const averageBookingValue = totalSpent / customer.totalBookings;

  // Generate insights
  const serviceCount = bookingHistory.reduce((acc, booking) => {
    acc[booking.service] = (acc[booking.service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const favoriteService = Object.entries(serviceCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Men\'s Haircut';
  
  const preferredTimes = ['Morning (9-11am)', 'Afternoon (2-4pm)', 'Evening (5-7pm)'];
  const bookingPatterns = ['Weekly regular', 'Monthly visitor', 'Seasonal customer', 'Special occasions only'];

  return {
    ...customer,
    totalSpent,
    notes: `Regular customer since ${customer.customerSince}. Prefers ${favoriteService}.`,
    emailConsent: Math.random() > 0.2, // 80% consent rate
    smsConsent: Math.random() > 0.4, // 60% consent rate
    bookingHistory,
    insights: {
      favoriteService,
      averageBookingValue,
      preferredTime: preferredTimes[Math.floor(Math.random() * preferredTimes.length)],
      bookingPattern: bookingPatterns[Math.floor(Math.random() * bookingPatterns.length)]
    }
  };
};
