
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { ExtracurricularActivity } from "@/types/user";
import { BookText, Plus, Trash2, Pencil, Award, Clock } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ExtracurricularActivitiesProps {
  onUpdate?: () => void;
}

const MAX_ACTIVITIES = 10;

const ExtracurricularActivities: React.FC<ExtracurricularActivitiesProps> = ({ onUpdate }) => {
  const { currentUser, updateUserPreferences } = useUser();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ExtracurricularActivity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<ExtracurricularActivity>({
    id: "",
    name: "",
    position: "",
    organization: "",
    description: "",
    yearsInvolved: "",
    hoursPerWeek: 0,
    weeksPerYear: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.preferences.extracurricularActivities) {
      setActivities(currentUser.preferences.extracurricularActivities);
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert hours and weeks to numbers
    if (name === 'hoursPerWeek' || name === 'weeksPerYear') {
      setCurrentActivity({
        ...currentActivity,
        [name]: Number(value) || 0
      });
    } else {
      setCurrentActivity({
        ...currentActivity,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setCurrentActivity({
      id: "",
      name: "",
      position: "",
      organization: "",
      description: "",
      yearsInvolved: "",
      hoursPerWeek: 0,
      weeksPerYear: 0
    });
    setIsEditing(false);
  };

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent any default form submission
    
    if (!currentActivity.name || !currentActivity.organization) {
      toast({
        title: "Missing information",
        description: "Please provide at least an activity name and organization"
      });
      return;
    }

    const updatedActivities = [...activities];
    
    if (isEditing) {
      // Update existing activity
      const index = updatedActivities.findIndex(a => a.id === currentActivity.id);
      if (index !== -1) {
        updatedActivities[index] = currentActivity;
      }
    } else {
      // Add new activity
      if (updatedActivities.length >= MAX_ACTIVITIES) {
        toast({
          title: "Maximum activities reached",
          description: `You can add up to ${MAX_ACTIVITIES} activities`
        });
        return;
      }
      
      updatedActivities.push({
        ...currentActivity,
        id: uuidv4()
      });
    }

    setActivities(updatedActivities);
    resetForm();
    setDialogOpen(false);
    
    // Update preferences
    if (currentUser) {
      updateUserPreferences({
        ...currentUser.preferences,
        extracurricularActivities: updatedActivities
      });
      
      toast({
        title: isEditing ? "Activity updated" : "Activity added",
        description: `${currentActivity.name} has been ${isEditing ? 'updated' : 'added'} successfully`
      });
      
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  const handleEdit = (activity: ExtracurricularActivity, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default navigation
    e.stopPropagation(); // Stop event propagation
    
    setCurrentActivity(activity);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default navigation
    e.stopPropagation(); // Stop event propagation
    
    const updatedActivities = activities.filter(activity => activity.id !== id);
    setActivities(updatedActivities);
    
    // Update preferences
    if (currentUser) {
      updateUserPreferences({
        ...currentUser.preferences,
        extracurricularActivities: updatedActivities
      });
      
      toast({
        title: "Activity removed",
        description: "The activity has been removed successfully"
      });
      
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    // If we're closing the dialog and not via the Add button (which sets dialogOpen to false itself)
    if (!open && dialogOpen) {
      resetForm();
    }
    setDialogOpen(open);
  };

  const handleOpenAddDialog = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    resetForm();
    setDialogOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Extracurricular Activities
        </CardTitle>
        <CardDescription>
          Add up to 10 extracurricular activities, similar to the Common App format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {activities.length} of {MAX_ACTIVITIES} activities added
          </p>
          
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={handleOpenAddDialog}
                disabled={activities.length >= MAX_ACTIVITIES}
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Activity' : 'Add Extracurricular Activity'}</DialogTitle>
                <DialogDescription>
                  Enter the details of your extracurricular activity
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Activity Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Debate Team, Volunteer Work"
                    value={currentActivity.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position/Leadership</Label>
                  <Input
                    id="position"
                    name="position"
                    placeholder="e.g. Captain, President, Member"
                    value={currentActivity.position}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    name="organization"
                    placeholder="e.g. High School Name, Community Center"
                    value={currentActivity.organization}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsInvolved">Years Involved</Label>
                  <Input
                    id="yearsInvolved"
                    name="yearsInvolved"
                    placeholder="e.g. 9th-12th grade, 2020-2023"
                    value={currentActivity.yearsInvolved}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hoursPerWeek">Hours per Week</Label>
                    <Input
                      id="hoursPerWeek"
                      name="hoursPerWeek"
                      type="number"
                      min="0"
                      placeholder="e.g. 5"
                      value={currentActivity.hoursPerWeek || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weeksPerYear">Weeks per Year</Label>
                    <Input
                      id="weeksPerYear"
                      name="weeksPerYear"
                      type="number"
                      min="0"
                      max="52"
                      placeholder="e.g. 40"
                      value={currentActivity.weeksPerYear || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Briefly describe your role, responsibilities, and accomplishments"
                    rows={4}
                    value={currentActivity.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} type="button">
                  Cancel
                </Button>
                <Button onClick={handleAdd} type="button">
                  {isEditing ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <BookText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-lg mb-1">No activities yet</h3>
            <p className="text-muted-foreground">
              Add your extracurricular activities to enhance your profile
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{activity.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {activity.position && `${activity.position}, `}
                      {activity.organization}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEdit(activity, e)}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(activity.id, e)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 mb-2 text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {activity.yearsInvolved}
                  </span>
                  {(activity.hoursPerWeek > 0 || activity.weeksPerYear > 0) && (
                    <span className="text-muted-foreground">
                      {activity.hoursPerWeek} hrs/week, {activity.weeksPerYear} weeks/yr
                    </span>
                  )}
                </div>
                {activity.description && (
                  <p className="text-sm mt-2">{activity.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExtracurricularActivities;
