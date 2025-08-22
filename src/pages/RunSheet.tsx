import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useBookings } from "@/hooks/useBookings";
import { updateVipTicketCheckins } from "@/services/bookingService";
import { PieChart, Pie, Cell } from "recharts";
import { formatDateToISO } from "@/utils/dateUtils";
import { Eye, EyeOff } from "lucide-react";

type VenueFilter = 'all' | 'manor' | 'hippie';

interface AttendanceState {
  vip: Record<string, boolean[]>; // bookingId -> per-ticket checked state
  karaoke: Record<string, boolean>; // bookingId -> checked in
}

const getStorageKey = (dateISO: string) => `runSheetAttendance:${dateISO}`;

export default function RunSheet() {
  const [activeTab, setActiveTab] = useState<'guests' | 'karaoke'>('guests');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateToISO(new Date()));
  const [search, setSearch] = useState<string>("");
  const [venue, setVenue] = useState<VenueFilter>('all');
  const [attendance, setAttendance] = useState<AttendanceState>({ vip: {}, karaoke: {} });
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [showCheckedOff, setShowCheckedOff] = useState<boolean>(false);

  // Load/save attendance to localStorage per-date
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(selectedDate));
      if (raw) {
        const parsed = JSON.parse(raw) as AttendanceState | { vip: Record<string, number>; karaoke: Record<string, boolean> };
        // Migrate old numeric VIP counts to boolean arrays if needed
        const migratedVip: Record<string, boolean[]> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyParsed: any = parsed as any;
        if (anyParsed.vip) {
          Object.entries(anyParsed.vip).forEach(([bookingId, value]) => {
            if (Array.isArray(value)) {
              migratedVip[bookingId] = value as boolean[];
            } else if (typeof value === 'number') {
              migratedVip[bookingId] = Array(Math.max(0, value)).fill(true);
            }
          });
        }
        setAttendance({ vip: migratedVip, karaoke: (parsed as AttendanceState).karaoke || {} });
      } else {
        setAttendance({ vip: {}, karaoke: {} });
      }
    } catch {
      setAttendance({ vip: {}, karaoke: {} });
    }
  }, [selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(selectedDate), JSON.stringify(attendance));
    } catch {}
  }, [attendance, selectedDate]);

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

  const { data: vipBookings = [], isLoading: loadingVip } = useBookings(guestFilters as never);
  const { data: karaokeBookings = [], isLoading: loadingKaraoke } = useBookings(karaokeFilters as never);

  // ===== Derived stats =====
  const totalVipTickets = useMemo(() => {
    return vipBookings.reduce((sum, b) => sum + (b.ticket_quantity || 0), 0);
  }, [vipBookings]);

  const checkedVipTickets = useMemo(() => {
    // Prefer local attendance; fall back to DB ticket_checkins
    return vipBookings.reduce((sum, b) => {
      const local = attendance.vip[b.id];
      if (Array.isArray(local)) {
        return sum + local.filter(Boolean).length;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stored = ((b as any).ticket_checkins as (string | null)[] | undefined) || [];
      return sum + stored.filter(Boolean).length;
    }, 0);
  }, [vipBookings, attendance.vip]);

  const vipPercent = useMemo(() => {
    return totalVipTickets > 0 ? Math.round((checkedVipTickets / totalVipTickets) * 100) : 0;
  }, [checkedVipTickets, totalVipTickets]);

  const totalKaraoke = useMemo(() => karaokeBookings.length, [karaokeBookings]);
  const checkedKaraoke = useMemo(() => {
    return karaokeBookings.reduce((sum, b) => sum + (attendance.karaoke[b.id] ? 1 : 0), 0);
  }, [karaokeBookings, attendance.karaoke]);
  const karaokePercent = useMemo(() => {
    return totalKaraoke > 0 ? Math.round((checkedKaraoke / totalKaraoke) * 100) : 0;
  }, [checkedKaraoke, totalKaraoke]);

  const handleVipToggle = async (bookingId: string, index: number, maxTickets?: number) => {
    let next: boolean[] = [];
    setAttendance(prev => {
      const current = prev.vip[bookingId] ? [...prev.vip[bookingId]] : Array(maxTickets || 0).fill(false) as boolean[];
      current[index] = !current[index];
      next = current;
      return { ...prev, vip: { ...prev.vip, [bookingId]: current } };
    });

    // Persist to DB as ISO timestamps (checked time) or nulls
    const checkins = next.map(checked => (checked ? new Date().toISOString() : null));
    try {
      await updateVipTicketCheckins(bookingId, checkins);
    } catch (e) {
      // Swallow error for now; UI remains updated locally
      // Could add a toast in the future
      // console.error(e);
    }
  };
  const handleKaraokeToggle = (bookingId: string, checked: boolean) => {
    setAttendance(prev => ({ ...prev, karaoke: { ...prev.karaoke, [bookingId]: checked } }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
                 <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold text-gm-neutral-900">Run Sheet</h1>
           </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>

        {/* Donut charts summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-24 h-24">
                <PieChart width={96} height={96}>
                  <Pie
                    data={[{ name: 'Checked', value: checkedVipTickets }, { name: 'Remaining', value: Math.max(totalVipTickets - checkedVipTickets, 0) }]}
                    dataKey="value"
                    innerRadius={30}
                    outerRadius={45}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                </PieChart>
              </div>
              <div>
                <div className="text-xs text-gm-neutral-600">Guest check-ins</div>
                <div className="text-2xl font-bold">{vipPercent}%</div>
                <div className="text-xs text-gm-neutral-600">{checkedVipTickets} of {totalVipTickets}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-24 h-24">
                <PieChart width={96} height={96}>
                  <Pie
                    data={[{ name: 'Checked', value: checkedKaraoke }, { name: 'Remaining', value: Math.max(totalKaraoke - checkedKaraoke, 0) }]}
                    dataKey="value"
                    innerRadius={30}
                    outerRadius={45}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#3B82F6" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                </PieChart>
              </div>
              <div>
                <div className="text-xs text-gm-neutral-600">Karaoke check-ins</div>
                <div className="text-2xl font-bold">{karaokePercent}%</div>
                <div className="text-xs text-gm-neutral-600">{checkedKaraoke} of {totalKaraoke}</div>
              </div>
            </CardContent>
          </Card>
        </div>

                 {/* Filters */}
         {showFilters && (
           <Card>
             <CardContent className="p-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                 <div className="flex flex-col gap-1">
                   <label className="text-xs text-gm-neutral-600">Date</label>
                   <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-xs text-gm-neutral-600">Venue</label>
                   <Select value={venue} onValueChange={(v: VenueFilter) => setVenue(v)}>
                     <SelectTrigger>
                       <SelectValue placeholder="All venues" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All venues</SelectItem>
                       <SelectItem value="manor">Manor</SelectItem>
                       <SelectItem value="hippie">Hippie Door</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}



                          {/* Search and toggle - always visible */}
         <div className="flex justify-end">
           <div className="flex items-center gap-3">
             <Input 
               placeholder="Search name, email, phone" 
               value={search} 
               onChange={(e) => setSearch(e.target.value)}
               className="w-64"
             />
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => setShowCheckedOff(!showCheckedOff)}
               className="flex items-center gap-2 h-10 px-3"
             >
               {showCheckedOff ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
             </Button>
           </div>
         </div>

         <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'guests' | 'karaoke')}>
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="guests">Guest List</TabsTrigger>
             <TabsTrigger value="karaoke">Karaoke Bookings</TabsTrigger>
           </TabsList>

          <TabsContent value="guests" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Guest List</span>
                  <span className="text-sm font-normal text-gm-neutral-600">
                    {loadingVip ? 'Loading…' : `${vipBookings.reduce((sum, b) => sum + (b.ticket_quantity || 0), 0)} tickets`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vipBookings.length === 0 && !loadingVip && (
                  <div className="text-sm text-gm-neutral-600">No VIP tickets for this date.</div>
                )}
                                 {/* Header row - hidden on mobile */}
                 {vipBookings.length > 0 && (
                   <div className="hidden md:grid px-3 py-2 text-xs uppercase tracking-wide text-gm-neutral-500 grid-cols-4 gap-4">
                     <div>Name</div>
                     <div>Ticket</div>
                     <div>Reference</div>
                     <div>Phone</div>
                   </div>
                 )}
                                   <div className="grid grid-cols-1">
                    {vipBookings.flatMap((b) => {
                      const max = b.ticket_quantity || 0;
                      return Array.from({ length: max }).map((_, idx) => {
                        const isChecked = !!attendance.vip[b.id]?.[idx];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const refCode = ((b as any).reference_code as string | undefined) || '';
                        
                        // Hide checked off bookings if showCheckedOff is false
                        if (!showCheckedOff && isChecked) {
                          return null;
                        }
                        
                        return (
                          <div
                            key={`${b.id}-${idx}`}
                            className="border rounded px-3 py-3 cursor-pointer hover:bg-gm-neutral-50"
                            onClick={() => handleVipToggle(b.id, idx, max)}
                          >
                           {/* Mobile layout - stacked */}
                           <div className="md:hidden space-y-2">
                             <div className="flex items-center gap-3">
                               <Checkbox className="pointer-events-none" checked={isChecked} />
                               <div className={`font-medium ${isChecked ? 'line-through text-gm-neutral-500' : 'text-gm-neutral-900'}`}>
                                 {b.customer_name}
                               </div>
                             </div>
                             <div className="grid grid-cols-3 gap-2 text-xs text-gm-neutral-600 ml-6">
                               <div>Ticket: <span className={`font-medium ${isChecked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{idx + 1}</span></div>
                               <div>Ref: <span className={`font-mono ${isChecked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{refCode}</span></div>
                               <div>Phone: <span className={`${isChecked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{b.customer_phone || '--'}</span></div>
                             </div>
                           </div>
                           
                           {/* Desktop layout - table format */}
                           <div className="hidden md:grid grid-cols-4 gap-4 items-center">
                             <div className="flex items-center gap-3 min-w-0">
                               <Checkbox className="pointer-events-none" checked={isChecked} />
                               <div className={`truncate ${isChecked ? 'line-through text-gm-neutral-500' : ''}`}>{b.customer_name}</div>
                             </div>
                             <div className={`text-sm ${isChecked ? 'line-through text-gm-neutral-500' : 'text-gm-neutral-700'}`}>{idx + 1}</div>
                             <div className={`font-mono text-xs ${isChecked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{refCode}</div>
                             <div className={`text-sm ${isChecked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-600'}`}>{b.customer_phone || ''}</div>
                           </div>
                         </div>
                       );
                     });
                   })}
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="karaoke" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Karaoke Bookings</span>
                  <span className="text-sm font-normal text-gm-neutral-600">
                    {loadingKaraoke ? 'Loading…' : `${karaokeBookings.length} bookings`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {karaokeBookings.length === 0 && !loadingKaraoke && (
                  <div className="text-sm text-gm-neutral-600">No karaoke bookings for this date.</div>
                )}
                                 {/* Header row - hidden on mobile */}
                 {karaokeBookings.length > 0 && (
                   <div className="hidden md:grid px-3 py-2 text-xs uppercase tracking-wide text-gm-neutral-500 grid-cols-4 gap-4">
                     <div>Name</div>
                     <div>Time / Guests</div>
                     <div>Reference</div>
                     <div>Phone</div>
                   </div>
                 )}
                                   <div className="space-y-2">
                    {karaokeBookings.map((b) => {
                      const checked = !!attendance.karaoke[b.id];
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const refCode = ((b as any).reference_code as string | undefined) || '';
                      
                      // Hide checked off bookings if showCheckedOff is false
                      if (!showCheckedOff && checked) {
                        return null;
                      }
                      
                      return (
                        <div
                          key={b.id}
                          className="border rounded px-3 py-3 cursor-pointer hover:bg-gm-neutral-50"
                          onClick={() => handleKaraokeToggle(b.id, !checked)}
                        >
                         {/* Mobile layout - stacked */}
                         <div className="md:hidden space-y-2">
                           <div className="flex items-center gap-3">
                             <Checkbox className="pointer-events-none" checked={checked} />
                             <div className={`font-medium ${checked ? 'line-through text-gm-neutral-500' : 'text-gm-neutral-900'}`}>
                               {b.customer_name}
                             </div>
                           </div>
                           <div className="grid grid-cols-3 gap-2 text-xs text-gm-neutral-600 ml-6">
                             <div>Time: <span className={`font-medium ${checked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>
                               {b.start_time || '--'} - {b.end_time || '--'}
                             </span></div>
                             <div>Ref: <span className={`font-mono ${checked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{refCode}</span></div>
                             <div>Phone: <span className={`${checked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{b.customer_phone || '--'}</span></div>
                           </div>
                           <div className="text-xs text-gm-neutral-600 ml-6">
                             Guests: <span className={`font-medium ${checked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{b.guest_count || 0}</span>
                           </div>
                         </div>
                         
                         {/* Desktop layout - table format */}
                         <div className="hidden md:grid grid-cols-4 gap-4 items-center">
                           <div className="flex items-center gap-3 min-w-0">
                             <Checkbox className="pointer-events-none" checked={checked} />
                             <div className={`truncate ${checked ? 'line-through text-gm-neutral-500' : ''}`}>{b.customer_name}</div>
                           </div>
                           <div className={`text-xs ${checked ? 'line-through text-gm-neutral-500' : 'text-gm-neutral-700'}`}>
                             {b.start_time || '--'} - {b.end_time || '--'} • Guests: {b.guest_count || 0}
                           </div>
                           <div className={`font-mono text-xs ${checked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-700'}`}>{refCode}</div>
                           <div className={`text-sm ${checked ? 'line-through text-gm-neutral-400' : 'text-gm-neutral-600'}`}>{b.customer_phone || ''}</div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}


