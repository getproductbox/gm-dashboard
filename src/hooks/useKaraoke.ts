import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { karaokeService } from '@/services/karaokeService';
import { useToast } from '@/hooks/use-toast';
import { 
  KaraokeBoothRow, 
  KaraokeBoothInsert, 
  KaraokeBoothUpdate,
  KaraokeBookingFormData,
  KaraokeBookingFilters,
  KaraokeBoothFilters
} from '@/types/karaoke';

// ===== KARAOKE BOOTH HOOKS =====

/**
 * Hook to fetch karaoke booths with optional filters
 */
export const useKaraokeBooths = (filters?: KaraokeBoothFilters) => {
  return useQuery({
    queryKey: ['karaoke-booths', filters],
    queryFn: () => karaokeService.getKaraokeBooths(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single karaoke booth
 */
export const useKaraokeBooth = (id: string) => {
  return useQuery({
    queryKey: ['karaoke-booth', id],
    queryFn: () => karaokeService.getKaraokeBooth(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (error.message.includes('migration') || error.message.includes('table not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook to create a new karaoke booth
 */
export const useCreateKaraokeBooth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: KaraokeBoothInsert) => karaokeService.createKaraokeBooth(data),
    onSuccess: (booth) => {
      queryClient.invalidateQueries({ queryKey: ['karaoke-booths'] });
      toast({
        title: "Karaoke Booth Created",
        description: `${booth.name} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Booth",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update a karaoke booth
 */
export const useUpdateKaraokeBooth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KaraokeBoothUpdate }) => 
      karaokeService.updateKaraokeBooth(id, data),
    onSuccess: (booth) => {
      queryClient.invalidateQueries({ queryKey: ['karaoke-booths'] });
      queryClient.invalidateQueries({ queryKey: ['karaoke-booth', booth.id] });
      toast({
        title: "Booth Updated",
        description: `${booth.name} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Booth",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to toggle booth availability
 */
export const useToggleBoothAvailability = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => 
      karaokeService.toggleBoothAvailability(id, isAvailable),
    onSuccess: (booth) => {
      queryClient.invalidateQueries({ queryKey: ['karaoke-booths'] });
      queryClient.invalidateQueries({ queryKey: ['karaoke-booth', booth.id] });
      toast({
        title: "Booth Availability Updated",
        description: `${booth.name} is now ${booth.is_available ? 'available' : 'unavailable'}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// ===== KARAOKE BOOKING HOOKS =====

/**
 * Hook to create a karaoke booking
 */
export const useCreateKaraokeBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: KaraokeBookingFormData) => karaokeService.createKaraokeBooking(data),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['karaoke-bookings'] });
      toast({
        title: "Karaoke Booking Created",
        description: `Booking for ${booking.customer_name} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// ===== AVAILABILITY HOOKS =====

/**
 * Hook to check booth availability for a specific date
 */
export const useBoothAvailability = (boothId: string, date: string) => {
  return useQuery({
    queryKey: ['booth-availability', boothId, date],
    queryFn: () => karaokeService.getBoothAvailability(boothId, date),
    enabled: !!boothId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('migration') || error.message.includes('table not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook to check for booking conflicts
 */
export const useCheckBookingConflicts = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (check: { booth_id: string; date: string; start_time: string; end_time: string; exclude_booking_id?: string }) => 
      karaokeService.checkBookingConflicts(check),
    onError: (error: Error) => {
      toast({
        title: "Error Checking Conflicts",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// ===== UTILITY HOOKS =====

/**
 * Hook to get available time slots for booking
 */
export const useTimeSlots = (startHour: number = 10, endHour: number = 23) => {
  return useQuery({
    queryKey: ['time-slots', startHour, endHour],
    queryFn: () => karaokeService.generateTimeSlots(startHour, endHour),
    staleTime: Infinity, // This data never changes
  });
};

/**
 * Hook to validate booking times
 */
export const useValidateBookingTime = () => {
  return useMutation({
    mutationFn: ({ startTime, endTime }: { startTime: string; endTime: string }) => 
      Promise.resolve(karaokeService.validateBookingTime(startTime, endTime)),
  });
};

/**
 * Hook to calculate booking cost
 */
export const useCalculateBookingCost = () => {
  return useMutation({
    mutationFn: ({ startTime, endTime, hourlyRate }: { startTime: string; endTime: string; hourlyRate: number }) => 
      Promise.resolve(karaokeService.calculateBookingCost(startTime, endTime, hourlyRate)),
  });
};

// ===== COMBINED HOOKS =====

/**
 * Hook that combines booth data and availability for easy use in components
 */
export const useKaraokeBoothsWithAvailability = (date: string, venue?: 'manor' | 'hippie') => {
  const { data: booths, isLoading: boothsLoading, error: boothsError } = useKaraokeBooths({ 
    venue: venue || 'all',
    is_available: true 
  });

  const availabilityQueries = useQuery({
    queryKey: ['booths-availability', date, venue],
    queryFn: async () => {
      if (!booths || booths.length === 0) return [];
      
      const availabilityPromises = booths.map(booth => 
        karaokeService.getBoothAvailability(booth.id, date)
      );
      
      return Promise.all(availabilityPromises);
    },
    enabled: !!booths && booths.length > 0 && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    booths,
    availability: availabilityQueries.data,
    isLoading: boothsLoading || availabilityQueries.isLoading,
    error: boothsError || availabilityQueries.error,
  };
};

/**
 * Hook for booth management operations
 */
export const useBoothManagement = () => {
  const createBooth = useCreateKaraokeBooth();
  const updateBooth = useUpdateKaraokeBooth();
  const toggleAvailability = useToggleBoothAvailability();

  return {
    createBooth,
    updateBooth,
    toggleAvailability,
    isLoading: createBooth.isPending || updateBooth.isPending || toggleAvailability.isPending,
  };
}; 