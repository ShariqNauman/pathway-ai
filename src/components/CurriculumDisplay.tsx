
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Award, GraduationCap } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { Badge } from "@/components/ui/badge";

interface CurriculumDisplayProps {
  curriculum: string;
  subjects?: string[];
  grades?: Record<string, string | number>;
}

const CurriculumDisplay: React.FC<CurriculumDisplayProps> = ({ curriculum, subjects = [], grades = {} }) => {
  if (!curriculum || !curriculumData[curriculum]) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            High School Curriculum
          </CardTitle>
          <CardDescription>No curriculum information provided</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please update your profile to add your curriculum information.</p>
        </CardContent>
      </Card>
    );
  }

  const curriculumInfo = curriculumData[curriculum];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5 text-primary" />
          High School Curriculum
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-medium">{curriculum}</span>
            <Badge variant="outline">{curriculumInfo.region}</Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            Grading System
          </h3>
          <div className="bg-muted/30 p-3 rounded-md text-sm">
            <p><span className="font-medium">Scale:</span> {curriculumInfo.gradingSystem.scale}</p>
            <p><span className="font-medium">Passing Grade:</span> {curriculumInfo.gradingSystem.passingGrade}</p>
          </div>
        </div>

        {subjects && subjects.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Subjects & Grades
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((subject) => (
                <div key={subject} className="bg-muted/30 p-3 rounded-md">
                  <p className="font-medium">{subject}</p>
                  {grades[subject] && (
                    <p className="text-sm text-muted-foreground">
                      Grade: <span className="font-medium text-foreground">{grades[subject]}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurriculumDisplay;
