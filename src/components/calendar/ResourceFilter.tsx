import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarResource } from "@/types/calendar";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export interface ResourceGroup {
  name: string;
  resources: CalendarResource[];
}

interface ResourceFilterProps {
  groups: ResourceGroup[];
  selectedResourceIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const ResourceFilter = ({
  groups,
  selectedResourceIds,
  onSelectionChange,
}: ResourceFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getAllResourceIds = () => 
    groups.flatMap(g => g.resources.map(r => r.id));

  const handleToggleResource = (resourceId: string) => {
    if (selectedResourceIds.includes(resourceId)) {
      onSelectionChange(selectedResourceIds.filter((id) => id !== resourceId));
    } else {
      onSelectionChange([...selectedResourceIds, resourceId]);
    }
  };

  const handleToggleGroup = (group: ResourceGroup) => {
    const groupResourceIds = group.resources.map(r => r.id);
    const allGroupSelected = groupResourceIds.every(id => selectedResourceIds.includes(id));

    if (allGroupSelected) {
      // Deselect all in group
      onSelectionChange(selectedResourceIds.filter(id => !groupResourceIds.includes(id)));
    } else {
      // Select all in group
      const newSelected = [...selectedResourceIds];
      groupResourceIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      onSelectionChange(newSelected);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(getAllResourceIds());
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const totalResources = getAllResourceIds().length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {selectedResourceIds.length > 0 && (
            <>
              <Badge
                variant="secondary"
                className="ml-2 rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedResourceIds.length}
              </Badge>
              <Badge
                variant="secondary"
                className="ml-2 rounded-sm px-1 font-normal hidden lg:inline-flex"
              >
                {selectedResourceIds.length} selected
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <div className="p-2 border-b border-gm-neutral-200 dark:border-gm-neutral-700">
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={handleSelectAll}
              className="text-gm-neutral-600 dark:text-gm-neutral-400 hover:text-gm-neutral-900 dark:hover:text-gm-neutral-100 px-2 py-1 rounded hover:bg-gm-neutral-100 dark:hover:bg-gm-neutral-800"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-gm-neutral-600 dark:text-gm-neutral-400 hover:text-gm-neutral-900 dark:hover:text-gm-neutral-100 px-2 py-1 rounded hover:bg-gm-neutral-100 dark:hover:bg-gm-neutral-800"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="p-2 space-y-4 max-h-[400px] overflow-auto">
          {groups.map((group) => {
            const groupResourceIds = group.resources.map(r => r.id);
            const allSelected = groupResourceIds.every(id => selectedResourceIds.includes(id));
            const someSelected = groupResourceIds.some(id => selectedResourceIds.includes(id));
            
            return (
              <div key={group.name} className="space-y-1">
                <div 
                  className="flex items-center space-x-2 p-1 rounded hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800 cursor-pointer"
                  onClick={() => handleToggleGroup(group)}
                >
                   <Checkbox
                    id={`group-${group.name}`}
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => handleToggleGroup(group)}
                  />
                  <label
                    htmlFor={`group-${group.name}`}
                    className="text-sm font-semibold leading-none cursor-pointer flex-1 text-gm-neutral-900 dark:text-gm-neutral-100"
                  >
                    {group.name}
                  </label>
                </div>
                
                <div className="pl-6 space-y-1">
                  {group.resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800 p-1 rounded"
                      onClick={() => handleToggleResource(resource.id)}
                    >
                      <Checkbox
                        id={`filter-${resource.id}`}
                        checked={selectedResourceIds.includes(resource.id)}
                        onCheckedChange={() => handleToggleResource(resource.id)}
                      />
                      <label
                        htmlFor={`filter-${resource.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 text-gm-neutral-700 dark:text-gm-neutral-300"
                      >
                        {resource.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
