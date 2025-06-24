
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

export interface CustomerFilterProps {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface CustomerFiltersProps {
  filters: CustomerFilterProps;
  onFiltersChange: (filters: Partial<CustomerFilterProps>) => void;
  onClearFilters: () => void;
}

export const CustomerFilters = ({ filters, onFiltersChange, onClearFilters }: CustomerFiltersProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gm-neutral-200 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gm-neutral-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-48">
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="first-time">First-time</SelectItem>
              <SelectItem value="returning">Returning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filters */}
        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="From date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            placeholder="To date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
            className="w-40"
          />
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};
