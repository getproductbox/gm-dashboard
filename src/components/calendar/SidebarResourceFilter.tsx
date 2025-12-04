import { Checkbox } from "@/components/ui/checkbox";
import { CalendarResource } from "@/data/mockData/calendar";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResourceGroup {
  name: string;
  resources: CalendarResource[];
}

interface SidebarResourceFilterProps {
  groups: ResourceGroup[];
  selectedResourceIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const SidebarResourceFilter = ({
  groups,
  selectedResourceIds,
  onSelectionChange,
}: SidebarResourceFilterProps) => {
  // Track collapsed state for groups
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(n => n !== groupName) 
        : [...prev, groupName]
    );
  };

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

  return (
    <div className="w-64 flex-shrink-0 p-4 bg-white dark:bg-gm-neutral-900 h-full overflow-y-auto border-r border-gm-neutral-200 dark:border-gm-neutral-700 hidden lg:block">
      {groups.map((group) => {
        const groupResourceIds = group.resources.map(r => r.id);
        const allSelected = groupResourceIds.every(id => selectedResourceIds.includes(id));
        const someSelected = groupResourceIds.some(id => selectedResourceIds.includes(id));
        const isCollapsed = collapsedGroups.includes(group.name);
        
        return (
          <div key={group.name} className="mb-6">
            <div className="flex items-center justify-between mb-2 group">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gm-neutral-900 dark:text-gm-neutral-100">
                  {group.name}
                </span>
              </div>
              <button 
                onClick={() => toggleGroupCollapse(group.name)}
                className="p-1 rounded hover:bg-gm-neutral-100 dark:hover:bg-gm-neutral-800 text-gm-neutral-500"
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
            
            {!isCollapsed && (
              <div className="space-y-2 ml-1">
                {/* Group Toggle (Select All) - Optional, mimicking "My Calendars" header behavior usually just listing items, but having a master toggle is nice */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`group-sidebar-${group.name}`}
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={() => handleToggleGroup(group)}
                        className="data-[state=checked]:bg-gm-neutral-700 data-[state=checked]:border-gm-neutral-700"
                    />
                    <label
                        htmlFor={`group-sidebar-${group.name}`}
                        className="text-xs text-gm-neutral-500 dark:text-gm-neutral-400 cursor-pointer hover:text-gm-neutral-900 dark:hover:text-gm-neutral-200"
                    >
                        Select All
                    </label>
                </div>

                {group.resources.map((resource) => {
                  const isChecked = selectedResourceIds.includes(resource.id);
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center space-x-2 cursor-pointer py-1 rounded"
                      onClick={() => handleToggleResource(resource.id)}
                    >
                      <Checkbox
                        id={`filter-sidebar-${resource.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleResource(resource.id)}
                        // Customizing color per resource type if desired
                        className={cn(
                            resource.type === 'venue' 
                                ? "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                                : "data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        )}
                      />
                      <label
                        htmlFor={`filter-sidebar-${resource.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 text-gm-neutral-700 dark:text-gm-neutral-300 truncate"
                        title={resource.name}
                      >
                        {resource.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};





