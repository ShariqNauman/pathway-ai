
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExtracurricularActivity } from "@/types/user";
import { Award, Clock, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

interface ExtracurricularDragDropProps {
  activities?: ExtracurricularActivity[];
  onActivitiesReorder?: (activities: ExtracurricularActivity[]) => void;
}

const SortableActivity = ({ activity }: { activity: ExtracurricularActivity }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' : 'static',
    opacity: isDragging ? 0.8 : 1,
  } as React.CSSProperties;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="border rounded-lg p-4 bg-background mb-4 max-w-full"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          type="button"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
            <div>
              <h4 className="font-medium">{activity.name}</h4>
              <p className="text-sm text-muted-foreground">
                {activity.position && `${activity.position}, `}
                {activity.organization}
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              <Clock className="h-3 w-3 mr-1" />
              {activity.yearsInvolved}
            </Badge>
          </div>
          
          {(activity.hoursPerWeek > 0 || activity.weeksPerYear > 0) && (
            <p className="text-sm text-muted-foreground mb-2">
              {activity.hoursPerWeek} hrs/week, {activity.weeksPerYear} weeks/yr
            </p>
          )}
          
          {activity.description && (
            <p className="text-sm mt-2 break-words">{activity.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ExtracurricularDragDrop: React.FC<ExtracurricularDragDropProps> = ({ 
  activities = [], 
  onActivitiesReorder 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Activation distance to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex((activity) => activity.id === active.id);
      const newIndex = activities.findIndex((activity) => activity.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newActivities = arrayMove(activities, oldIndex, newIndex);
        if (onActivitiesReorder) {
          onActivitiesReorder(newActivities);
          toast("Activities reordered successfully");
        }
      }
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Extracurricular Activities
          </CardTitle>
          <CardDescription>No activities have been added yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Add your extracurricular activities to enhance your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Extracurricular Activities
        </CardTitle>
        <CardDescription>Drag and drop to reorder activities by importance</CardDescription>
      </CardHeader>
      <CardContent className="max-w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activities.map(activity => activity.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-w-full">
              {activities.map((activity) => (
                <SortableActivity key={activity.id} activity={activity} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};

export default ExtracurricularDragDrop;
