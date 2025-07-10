import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRevenue } from '@/hooks/useRevenue';
import { RevenueComparisonTableProps, RevenueRow } from './types';
import { WeekSelector } from './WeekSelector';
import { RevenueTableRows } from './RevenueTableRows';
import { processRevenueData } from './RevenueDataProcessor';

export const RevenueComparisonTable = ({ selectedVenue }: RevenueComparisonTableProps) => {
  const [data, setData] = useState<RevenueRow[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [availableWeeks, setAvailableWeeks] = useState<Array<{ week_start: string; week_label: string }>>([]);
  const { isLoading, fetchAllRevenueData, fetchAvailableWeeks } = useRevenue();

  useEffect(() => {
    const loadAvailableWeeks = async () => {
      try {
        const weeks = await fetchAvailableWeeks();
        setAvailableWeeks(weeks);
      } catch (error) {
        console.error('Error loading available weeks:', error);
      }
    };
    loadAvailableWeeks();
  }, [fetchAvailableWeeks]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Clear previous data to prevent flashing
        setData([]);
        
        const selectedDate = selectedWeek === 'current' ? null : new Date(selectedWeek);
        
        // Use the consolidated fetch function
        const { weeklyData, monthlyData, yearlyData } = await fetchAllRevenueData(selectedVenue, selectedDate);

        const tableData = processRevenueData({
          weeklyData,
          monthlyData,
          yearlyData,
          selectedDate
        });

        setData(tableData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      }
    };

    fetchData();
  }, [selectedWeek, selectedVenue, fetchAllRevenueData]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle>Revenue Comparison</CardTitle>
        <WeekSelector
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          availableWeeks={availableWeeks}
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total $</TableHead>
                <TableHead className="text-right">Total %</TableHead>
                <TableHead className="text-right">Bar $</TableHead>
                <TableHead className="text-right">Bar %</TableHead>
                <TableHead className="text-right">Door $</TableHead>
                <TableHead className="text-right">Door %</TableHead>
              </TableRow>
            </TableHeader>
            <RevenueTableRows data={data} />
          </Table>
        )}
      </CardContent>
    </Card>
  );
};