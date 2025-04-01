
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExtracurricularActivity } from "@/types/user";
import { Award, Clock } from "lucide-react";

interface ExtracurricularDisplayProps {
  activities?: ExtracurricularActivity[];
}

const ExtracurricularDisplay: React.FC<ExtracurricularDisplayProps> = ({ activities = [] }) => {
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
        <CardDescription>Your extracurricular involvement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="border rounded-lg p-4">
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
                <p className="text-sm mt-2">{activity.description}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtracurricularDisplay;
