import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBookings } from "@/hooks/useBookings";
import { updateVipTicketCheckins, BookingRow } from "@/services/bookingService";
import { formatDateToISO } from "@/utils/dateUtils";
import { CheckCheck, Search, Users, Mic2, Calendar, ArrowLeft, UserPlus, Star } from "lucide-react";
import { QuickAddBookingDialog } from "@/components/bookings/QuickAddBookingDialog";
import { BookingDetailsSidebar } from "@/components/bookings/BookingDetailsSidebar";
import { customerService, CustomerRow } from "@/services/customerService";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { MemberProfileDialog } from "@/components/members/MemberProfileDialog";

type VenueFilter = 'all' | 'manor' | 'hippie';

interface AttendanceState {
  vip: Record<string, boolean[]>;
  karaoke: Record<string, boolean>;
}

const getStorageKey = (dateISO: string) => `runSheetAttendance:${dateISO}`;

export default function RunSheet() {
  const [activeTab, setActiveTab] = useState<'guests' | 'karaoke' | 'members'>('guests');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateToISO(new Date()));
  const [search, setSearch] = useState<string>("");
  const [venue, setVenue] = useState<VenueFilter>('all');
  const [attendance, setAttendance] = useState<AttendanceState>({ vip: {}, karaoke: {} });
  const [showCheckedOff, setShowCheckedOff] = useState<boolean>(false);
  const [members, setMembers] = useState<CustomerRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Editing
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  
  // Member management
  const [selectedMember, setSelectedMember] = useState<CustomerRow | null>(null);
  const [isMemberProfileOpen, setIsMemberProfileOpen] = useState(false);

  // Load/save attendance
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(selectedDate));
      if (raw) {
        const parsed = JSON.parse(raw);
        const migratedVip: Record<string, boolean[]> = {};
        if (parsed.vip) {
          Object.entries(parsed.vip).forEach(([bookingId, value]) => {
            if (Array.isArray(value)) migratedVip[bookingId] = value as boolean[];
            else if (typeof value === 'number') migratedVip[bookingId] = Array(Math.max(0, value)).fill(true);
          });
        }
        setAttendance({ vip: migratedVip, karaoke: parsed.karaoke || {} });
      } else {
        setAttendance({ vip: {}, karaoke: {} });
      }
    } catch {
      setAttendance({ vip: {}, karaoke: {} });
    }
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(selectedDate), JSON.stringify(attendance));
  }, [attendance, selectedDate]);

  // Fetch Members when tab is active
  const fetchMembers = async () => {
    if (activeTab === 'members') {
      setLoadingMembers(true);
      try {
        const membersData = await customerService.getMembers(search);
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeTab, search]); // Re-fetch on search change for server-side search

  const guestFilters = useMemo(() => ({
    bookingType: 'vip_tickets',
    venue: venue === 'all' ? undefined : venue,
    dateFrom: selectedDate,
    dateTo: selectedDate,
    search: search || undefined,
  }), [venue, selectedDate, search]);

  const karaokeFilters = useMemo(() => ({
    bookingType: 'karaoke_booking',
    venue: venue === 'all' ? undefined : venue,
    dateFrom: selectedDate,
    dateTo: selectedDate,
    search: search || undefined,
  }), [venue, selectedDate, search]);

  const { data: vipBookings = [], isLoading: loadingVip } = useBookings(guestFilters as any);
  const { data: karaokeBookings = [], isLoading: loadingKaraoke } = useBookings(karaokeFilters as any);

  // Stats
  const totalVipTickets = useMemo(() => vipBookings.reduce((sum, b) => sum + (b.ticket_quantity || 0), 0), [vipBookings]);
  const checkedVipTickets = useMemo(() => {
    return vipBookings.reduce((sum, b) => {
      const local = attendance.vip[b.id];
      if (Array.isArray(local)) return sum + local.filter(Boolean).length;
      const stored = ((b as any).ticket_checkins as (string | null)[] | undefined) || [];
      return sum + stored.filter(Boolean).length;
    }, 0);
  }, [vipBookings, attendance.vip]);
  const vipPercent = totalVipTickets > 0 ? Math.round((checkedVipTickets / totalVipTickets) * 100) : 0;

  const totalKaraoke = karaokeBookings.length;
  const checkedKaraoke = useMemo(() => karaokeBookings.reduce((sum, b) => sum + (attendance.karaoke[b.id] ? 1 : 0), 0), [karaokeBookings, attendance.karaoke]);
  const karaokePercent = totalKaraoke > 0 ? Math.round((checkedKaraoke / totalKaraoke) * 100) : 0;

  const isToday = selectedDate === formatDateToISO(new Date());

  // Handlers
  const updateCheckins = async (bookingId: string, nextState: boolean[]) => {
    setAttendance(prev => ({ ...prev, vip: { ...prev.vip, [bookingId]: nextState } }));
    const checkins = nextState.map(c => (c ? new Date().toISOString() : null));
    try {
      await updateVipTicketCheckins(bookingId, checkins);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVipToggle = async (bookingId: string, index: number, maxTickets: number) => {
    const current = attendance.vip[bookingId] ? [...attendance.vip[bookingId]] : Array(maxTickets).fill(false);
    current[index] = !current[index];
    await updateCheckins(bookingId, current);
  };

  const handleVipCheckAll = async (bookingId: string, maxTickets: number) => {
    const current = attendance.vip[bookingId] || Array(maxTickets).fill(false);
    const allChecked = current.every(Boolean);
    const nextState = Array(maxTickets).fill(!allChecked);
    await updateCheckins(bookingId, nextState);
  };

  const handleKaraokeToggle = (bookingId: string, checked: boolean) => {
    setAttendance(prev => ({ ...prev, karaoke: { ...prev.karaoke, [bookingId]: checked } }));
  };

  const handleBookingClick = (booking: BookingRow) => {
    setSelectedBooking(booking);
    setIsEditSidebarOpen(true);
  };

  const handleBackToToday = () => {
    setSelectedDate(formatDateToISO(new Date()));
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-20 max-w-4xl mx-auto">
        
        {/* Header Area */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Run Sheet</h1>
              {!isToday && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBackToToday}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Today
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <QuickAddBookingDialog defaultDate={selectedDate} />
            </div>
          </div>

          {/* Compact Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/50 border shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium"><Users className="h-3.5 w-3.5" /> Guests</span>
                  <span className="font-mono">{checkedVipTickets}/{totalVipTickets}</span>
                </div>
                <Progress value={vipPercent} className="h-2" indicatorClassName="bg-emerald-500" />
              </CardContent>
            </Card>
            <Card className="bg-card/50 border shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium"><Mic2 className="h-3.5 w-3.5" /> Karaoke</span>
                  <span className="font-mono">
                    {Number.isFinite(checkedKaraoke) ? checkedKaraoke : 0}/{Number.isFinite(totalKaraoke) ? totalKaraoke : 0}
                  </span>
                </div>
                <Progress value={Number.isFinite(karaokePercent) ? karaokePercent : 0} className="h-2" indicatorClassName="bg-blue-500" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controls Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 space-y-3 -mx-4 px-4 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 text-lg bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            
            {/* Filters row - always visible or toggleable? Plan says move to top row. */}
            {/* Let's put date/venue here for quick access */}
             <div className="flex gap-2">
               {!isToday && (
                 <Button variant="outline" size="icon" onClick={handleBackToToday} title="Back to Today">
                   <ArrowLeft className="h-4 w-4" />
                 </Button>
               )}
               <Input 
                 type="date" 
                 value={selectedDate} 
                 onChange={(e) => setSelectedDate(e.target.value)} 
                 className="w-auto bg-card h-11" 
               />
               <Select value={venue} onValueChange={(v: VenueFilter) => setVenue(v)}>
                 <SelectTrigger className="w-[130px] bg-card h-11">
                   <SelectValue placeholder="Venue" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Venues</SelectItem>
                   <SelectItem value="manor">Manor</SelectItem>
                   <SelectItem value="hippie">Hippie</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="guests">Guests ({vipBookings.length})</TabsTrigger>
              <TabsTrigger value="karaoke">Karaoke ({karaokeBookings.length})</TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                 <Star className="h-3.5 w-3.5" /> Members
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex justify-between items-center px-1">
             <div className="text-xs text-muted-foreground font-medium">
               {activeTab === 'guests' && `${checkedVipTickets} checked in`}
               {activeTab === 'karaoke' && `${checkedKaraoke} checked in`}
               {activeTab === 'members' && `${members.length} found`}
             </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showChecked" 
                checked={showCheckedOff} 
                onCheckedChange={(c) => setShowCheckedOff(!!c)} 
              />
              <label htmlFor="showChecked" className="text-sm text-muted-foreground cursor-pointer select-none">
                Show checked
              </label>
            </div>
          </div>
        </div>

        {/* Main Content List */}
        <div className="space-y-4 min-h-[50vh]">
          {activeTab === 'guests' && (
            <div className="grid grid-cols-1 gap-3">
              {vipBookings.length === 0 && !loadingVip && (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">No guests found for this date.</div>
              )}
              
              {vipBookings.map((booking) => {
                const max = booking.ticket_quantity || 0;
                const checkins = attendance.vip[booking.id] || [];
                const checkedCount = checkins.filter(Boolean).length;
                const allChecked = checkedCount === max && max > 0;

                if (!showCheckedOff && allChecked) return null;

                return (
                  <Card key={booking.id} className={`overflow-hidden border-l-4 ${allChecked ? 'opacity-60 bg-muted/30 border-l-muted' : 'bg-card border-l-emerald-500'}`}>
                    <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
                      <div 
                        className="space-y-1 flex-1 cursor-pointer"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <h3 className="font-bold text-lg leading-none">{booking.customer_name}</h3>
                        <div className="text-xs text-muted-foreground font-mono flex gap-2">
                          <span>{booking.reference_code || 'NO-REF'}</span>
                          <span>•</span>
                          <span>{booking.customer_phone || 'No Phone'}</span>
                        </div>
                        {booking.special_requests && (
                          <div className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 px-1.5 py-0.5 rounded w-fit mt-1">
                            {booking.special_requests}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end pl-2">
                        <Button 
                          size="sm" 
                          variant={allChecked ? "secondary" : "outline"}
                          className="h-8 w-24 text-xs"
                          onClick={() => handleVipCheckAll(booking.id, max)}
                        >
                          {allChecked ? "Reset" : "Check All"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                      <div className="text-xs text-muted-foreground mb-2 flex justify-between items-center border-b pb-2">
                         <span>{checkedCount} of {max} tickets used</span>
                         {allChecked && <CheckCheck className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div className="grid gap-2">
                        {Array.from({ length: max }).map((_, idx) => {
                          const isChecked = !!checkins[idx];
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center p-2.5 border rounded-md cursor-pointer active:scale-[0.99] transition-all ${isChecked ? 'bg-muted border-transparent' : 'bg-background hover:bg-accent'}`}
                              onClick={() => handleVipToggle(booking.id, idx, max)}
                            >
                              <Checkbox checked={isChecked} className="h-5 w-5 mr-3 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                              <span className={`flex-1 text-sm font-medium ${isChecked ? 'text-muted-foreground line-through' : ''}`}>
                                Ticket #{idx + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'karaoke' && (
            <div className="grid grid-cols-1 gap-3">
              {karaokeBookings.length === 0 && !loadingKaraoke && (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">No karaoke bookings found.</div>
              )}

              {karaokeBookings.map((booking) => {
                const isChecked = !!attendance.karaoke[booking.id];
                if (!showCheckedOff && isChecked) return null;

                return (
                  <Card key={booking.id} className={`border-l-4 ${isChecked ? 'opacity-60 bg-muted/30 border-l-muted' : 'border-l-blue-500'}`}>
                    <div className="p-3 flex items-center gap-4">
                      <div 
                        className="cursor-pointer" 
                        onClick={() => handleKaraokeToggle(booking.id, !isChecked)}
                      >
                        <Checkbox checked={isChecked} className="h-6 w-6 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                      </div>
                      <div 
                        className="flex-1 space-y-1 cursor-pointer"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className={`font-bold text-base ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                            {booking.customer_name}
                          </h3>
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">{booking.start_time?.slice(0, 5)}</Badge>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="font-mono text-foreground/80">{booking.reference_code || 'REF'}</span>
                          <span>{booking.guest_count} guests</span>
                          {booking.karaoke_booth_id && <span>Booth {booking.karaoke_booth_id}</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Add Member Helper */}
              <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20">
                <CardContent className="p-4 flex items-center justify-between">
                   <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                     Permanent Guest List
                   </div>
                   <AddMemberDialog onMemberAdded={fetchMembers} />
                </CardContent>
              </Card>

              {members.length === 0 && !loadingMembers && (
                <div className="text-center py-10 text-muted-foreground">No members found matching your search.</div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {members.map(member => (
                  <Card key={member.id} className="bg-card border-l-4 border-l-indigo-400">
                    <CardContent className="p-3 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-base flex items-center gap-2">
                          {member.name} 
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{member.email || 'No email'}</div>
                        <div className="text-xs text-muted-foreground">{member.phone || 'No phone'}</div>
                        {member.notes && (
                          <div className="mt-2 text-xs bg-muted p-1.5 rounded italic">
                            "{member.notes}"
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                         <Button 
                           size="sm" 
                           variant="outline" 
                           className="h-7 text-xs"
                           onClick={() => {
                             setSelectedMember(member);
                             setIsMemberProfileOpen(true);
                           }}
                         >
                           Profile
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <BookingDetailsSidebar 
          booking={selectedBooking}
          isOpen={isEditSidebarOpen}
          onClose={() => {
            setIsEditSidebarOpen(false);
            setSelectedBooking(null);
          }}
        />

        <MemberProfileDialog
          member={selectedMember}
          isOpen={isMemberProfileOpen}
          onClose={() => {
            setIsMemberProfileOpen(false);
            setSelectedMember(null);
          }}
          onMemberUpdated={fetchMembers}
        />
      </div>
    </DashboardLayout>
  );
}
