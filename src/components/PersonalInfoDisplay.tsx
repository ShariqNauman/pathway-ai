import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, MapPin, Phone } from "lucide-react";
import { UserProfile } from "@/types/user";

interface PersonalInfoDisplayProps {
  userProfile: UserProfile;
}

const PersonalInfoDisplay: React.FC<PersonalInfoDisplayProps> = ({ userProfile }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </CardTitle>
        <CardDescription>Your personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{userProfile.name || "Not provided"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{userProfile.preferences.dateOfBirth || "Not provided"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{userProfile.preferences.address || "Not provided"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">{userProfile.preferences.phone || "Not provided"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoDisplay;
