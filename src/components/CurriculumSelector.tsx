
import React, { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Info } from "lucide-react";
import { curriculumData } from "@/data/curriculumData";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

interface CurriculumSelectorProps {
  onUpdate?: () => void;
}

const CurriculumSelector: React.FC<CurriculumSelectorProps> = ({ onUpdate }) => {
  const { currentUser, updateUserPreferences } = useUser();
  const { toast } = useToast();
  const [selectedCurriculum, setSelectedCurriculum] = useState(currentUser?.preferences.highSchoolCurriculum || "");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(currentUser?.preferences.curriculumSubjects || []);
  const [grades, setGrades] = useState<Record<string, string>>(currentUser?.preferences.curriculumGrades || {});

  useEffect(() => {
    if (currentUser?.preferences.highSchoolCurriculum) {
      setSelectedCurriculum(currentUser.preferences.highSchoolCurriculum);
      setSelectedSubjects(currentUser.preferences.curriculumSubjects || []);
      setGrades(currentUser.preferences.curriculumGrades || {});
    }
  }, [currentUser]);

  const handleCurriculumChange = (value: string) => {
    setSelectedCurriculum(value);
    // Reset subjects when curriculum changes
    setSelectedSubjects([]);
    setGrades({});
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prevSubjects => {
      if (prevSubjects.includes(subject)) {
        // Remove subject and its grade
        const newGrades = { ...grades };
        delete newGrades[subject];
        setGrades(newGrades);
        return prevSubjects.filter(s => s !== subject);
      } else {
        // Add subject
        return [...prevSubjects, subject];
      }
    });
  };

  const handleGradeChange = (subject: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [subject]: value
    }));
  };

  const handleSave = () => {
    if (!currentUser) return;

    updateUserPreferences({
      ...currentUser.preferences,
      highSchoolCurriculum: selectedCurriculum,
      curriculumSubjects: selectedSubjects,
      curriculumGrades: grades
    });

    toast({
      title: "Curriculum saved",
      description: "Your curriculum information has been updated"
    });

    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5 text-primary" />
          High School Curriculum
        </CardTitle>
        <CardDescription>Select your high school curriculum and add your subjects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="curriculum">Curriculum</Label>
          <Select 
            onValueChange={handleCurriculumChange}
            value={selectedCurriculum}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your curriculum" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(curriculumData).map((curr) => (
                <SelectItem key={curr} value={curr}>
                  {curr} ({curriculumData[curr].region})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCurriculum && (
          <>
            <Accordion type="single" collapsible className="w-full" defaultValue="grading-system">
              <AccordionItem value="grading-system">
                <AccordionTrigger className="font-medium">
                  Grading System
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Description</p>
                        <p className="text-muted-foreground">{curriculumData[selectedCurriculum].gradingSystem.description}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Scale</p>
                      <p className="text-muted-foreground">{curriculumData[selectedCurriculum].gradingSystem.scale}</p>
                    </div>
                    <div>
                      <p className="font-medium">Passing Grade</p>
                      <p className="text-muted-foreground">{curriculumData[selectedCurriculum].gradingSystem.passingGrade}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-3">
              <Label>Subjects</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {curriculumData[selectedCurriculum].commonSubjects.map((subject) => (
                  <div key={subject} className="flex items-start space-x-2">
                    <Checkbox 
                      id={`subject-${subject}`} 
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={() => handleSubjectToggle(subject)}
                    />
                    <Label 
                      htmlFor={`subject-${subject}`}
                      className="font-normal cursor-pointer"
                    >
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {selectedSubjects.length > 0 && (
              <div className="space-y-3">
                <Label>Grades</Label>
                <div className="space-y-3">
                  {selectedSubjects.map((subject) => (
                    <div key={`grade-${subject}`} className="grid grid-cols-3 gap-3 items-center">
                      <Label className="col-span-1">{subject}</Label>
                      <Input
                        className="col-span-2"
                        placeholder="Enter your grade"
                        value={grades[subject] || ""}
                        onChange={(e) => handleGradeChange(subject, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} className="w-full">Save Curriculum Information</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CurriculumSelector;
