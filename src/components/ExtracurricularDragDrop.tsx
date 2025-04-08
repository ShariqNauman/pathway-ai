import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Award, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { ExtracurricularActivity } from "@/types/user";

interface SortableItemProps {
  id: string;
  activity: ExtracurricularActivity;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, activity }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-md mb-3 overflow-hidden"
    >
      <div className="p-3 flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div 
            {...attributes} 
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing mt-1"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-base">{activity.name}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-7 w-7 p-0"
              >
                {expanded ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <p className="text-muted-foreground">{activity.position} at {activity.organization}</p>
              <p className="text-muted-foreground">{activity.yearsInvolved}</p>
              <p className="text-muted-foreground">{activity.hoursPerWeek} hrs/week</p>
            </div>
            
            {expanded && (
              <div className="mt-2 text-sm">
                <p>{activity.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExtracurricularDragDropProps {
  activities?: ExtracurricularActivity[];
  onActivitiesReorder?: (activities: ExtracurricularActivity[]) => void;
}

const ExtracurricularDragDrop: React.FC<ExtracurricularDragDropProps> = ({ 
  activities = [], 
  onActivitiesReorder 
}) => {
  const [items, setItems] = useState<ExtracurricularActivity[]>(activities);
  const [isCollapsed, setIsCollapsed] = useState(activities?.length > 3);
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        if (onActivitiesReorder) {
          onActivitiesReorder(newItems);
        }
        
        return newItems;
      });
    }
  };
  
  const displayedActivities = isCollapsed ? items.slice(0, 3) : items;
  
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Extracurricular Activities
          </CardTitle>
          <CardDescription>Drag and drop to reorder your activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Award className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>You haven't added any extracurricular activities yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Extracurricular Activities
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isSectionCollapsed ? 
              <ChevronDown className="h-5 w-5" /> : 
              <ChevronUp className="h-5 w-5" />
            }
          </Button>
        </div>
        {!isSectionCollapsed && (
          <>
            <CardDescription>Drag and drop to reorder your activities</CardDescription>
            
            {items.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-4 right-4 md:right-10"
              >
                {isCollapsed ? 
                  <>Show All ({items.length})</> : 
                  <>Show Less</>
                }
              </Button>
            )}
          </>
        )}
      </CardHeader>
      
      {!isSectionCollapsed && (
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayedActivities.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {displayedActivities.map((activity) => (
                <SortableItem 
                  key={activity.id} 
                  id={activity.id} 
                  activity={activity} 
                />
              ))}
            </SortableContext>
          </DndContext>
          
          {isCollapsed && items.length > 3 && (
            <Button 
              variant="ghost" 
              className="w-full mt-2"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Show All Activities ({items.length})
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ExtracurricularDragDrop;
