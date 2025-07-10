export interface RevenueRow {
  period: string;
  totalDollars: number;
  totalPercent: number | null;
  barDollars: number;
  barPercent: number | null;
  doorDollars: number;
  doorPercent: number | null;
}

export interface RevenueComparisonTableProps {
  selectedVenue?: string | null;
}