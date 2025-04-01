
export interface CurriculumInfo {
  name: string;
  region: string;
  gradingSystem: {
    description: string;
    scale: string;
    passingGrade: string;
  };
  commonSubjects: string[];
}

export const curriculumData: Record<string, CurriculumInfo> = {
  "US High School Diploma": {
    name: "US High School Diploma",
    region: "United States",
    gradingSystem: {
      description: "Letter grades with GPA",
      scale: "A (4.0), B (3.0), C (2.0), D (1.0), F (0)",
      passingGrade: "D (1.0) or higher"
    },
    commonSubjects: ["English", "Mathematics", "Science", "Social Studies", "Foreign Language", "Physical Education", "Electives"]
  },
  "International Baccalaureate (IB)": {
    name: "International Baccalaureate (IB)",
    region: "International",
    gradingSystem: {
      description: "Numeric scale for each subject",
      scale: "1-7 points per subject (7 highest)",
      passingGrade: "4 out of 7"
    },
    commonSubjects: ["Studies in Language and Literature", "Language Acquisition", "Individuals and Societies", "Sciences", "Mathematics", "The Arts", "Theory of Knowledge", "Extended Essay", "CAS"]
  },
  "A-Levels (UK)": {
    name: "A-Levels (UK)",
    region: "United Kingdom",
    gradingSystem: {
      description: "Letter grades",
      scale: "A*, A, B, C, D, E, U (fail)",
      passingGrade: "E or higher"
    },
    commonSubjects: ["Mathematics", "Further Mathematics", "English Literature", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Modern Languages"]
  },
  "European Baccalaureate": {
    name: "European Baccalaureate",
    region: "Europe (European Schools)",
    gradingSystem: {
      description: "Numerical scale",
      scale: "0-10 (10 highest)",
      passingGrade: "6 out of 10"
    },
    commonSubjects: ["First Language", "Second Language", "Mathematics", "History", "Geography", "Science", "Philosophy", "Physical Education", "Art"]
  },
  "French Baccalauréat": {
    name: "French Baccalauréat",
    region: "France",
    gradingSystem: {
      description: "Numerical scale",
      scale: "0-20 (20 highest)",
      passingGrade: "10 out of 20"
    },
    commonSubjects: ["French Literature", "Philosophy", "Mathematics", "History-Geography", "Living Languages", "Sciences", "Economics", "Social Sciences"]
  },
  "German Abitur": {
    name: "German Abitur",
    region: "Germany",
    gradingSystem: {
      description: "Numerical scale",
      scale: "1-6 (1 highest, 6 lowest)",
      passingGrade: "4 or better"
    },
    commonSubjects: ["German", "Mathematics", "Foreign Language", "Natural Sciences", "Social Sciences", "Arts/Music", "Sports"]
  },
  "Indian CBSE/ISC": {
    name: "Indian CBSE/ISC",
    region: "India",
    gradingSystem: {
      description: "Percentage and letter grades",
      scale: "A1, A2, B1, B2, C1, C2, D, E (fail)",
      passingGrade: "D or higher (33%+)"
    },
    commonSubjects: ["English", "Hindi or Regional Language", "Mathematics", "Science", "Social Science", "Computer Science", "Physical Education"]
  },
  "Australian HSC": {
    name: "Australian HSC",
    region: "Australia",
    gradingSystem: {
      description: "Band system",
      scale: "Band 6 (90-100) to Band 1 (<50)",
      passingGrade: "Band 2 or higher"
    },
    commonSubjects: ["English", "Mathematics", "Sciences", "Humanities", "Arts", "Languages", "Technology"]
  },
  "Canadian High School": {
    name: "Canadian High School",
    region: "Canada",
    gradingSystem: {
      description: "Percentage and letter grades",
      scale: "A (80-100%), B (70-79%), C (60-69%), D (50-59%), F (<50%)",
      passingGrade: "D (50%) or higher"
    },
    commonSubjects: ["English", "French", "Mathematics", "Science", "Social Studies", "Arts", "Physical Education"]
  },
  "Chinese Gaokao": {
    name: "Chinese Gaokao",
    region: "China",
    gradingSystem: {
      description: "Points-based system",
      scale: "Total score usually out of 750",
      passingGrade: "Varies by province and year"
    },
    commonSubjects: ["Chinese", "Mathematics", "Foreign Language", "Sciences (Physics, Chemistry, Biology)", "Humanities (History, Geography, Politics)"]
  },
  "Japanese High School": {
    name: "Japanese High School",
    region: "Japan",
    gradingSystem: {
      description: "5-point scale",
      scale: "5 (excellent) to 1 (poor)",
      passingGrade: "2 or higher"
    },
    commonSubjects: ["Japanese", "Mathematics", "English", "Science", "Social Studies", "Physical Education", "Art", "Home Economics"]
  },
  "South Korean High School": {
    name: "South Korean High School",
    region: "South Korea",
    gradingSystem: {
      description: "Letter grade and percentage",
      scale: "A (90-100%), B (80-89%), C (70-79%), D (60-69%), F (<60%)",
      passingGrade: "D (60%) or higher"
    },
    commonSubjects: ["Korean Language", "Mathematics", "English", "Social Studies", "Science", "Physical Education", "Music", "Fine Arts"]
  },
  "Brazilian Vestibular": {
    name: "Brazilian Vestibular",
    region: "Brazil",
    gradingSystem: {
      description: "0-10 scale",
      scale: "0-10 (10 highest)",
      passingGrade: "5 or higher"
    },
    commonSubjects: ["Portuguese", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Foreign Language"]
  },
  "Russian Certificate of Secondary Education": {
    name: "Russian Certificate of Secondary Education",
    region: "Russia",
    gradingSystem: {
      description: "5-point scale",
      scale: "5 (excellent) to 2 (unsatisfactory)",
      passingGrade: "3 or higher"
    },
    commonSubjects: ["Russian Language", "Mathematics", "Foreign Language", "Physics", "Chemistry", "Biology", "History", "Social Science", "Geography"]
  },
  "Italian Maturità": {
    name: "Italian Maturità",
    region: "Italy",
    gradingSystem: {
      description: "Points-based system",
      scale: "60-100 (100 highest)",
      passingGrade: "60 out of 100"
    },
    commonSubjects: ["Italian", "Mathematics", "Foreign Language", "Science", "History", "Philosophy", "Art History"]
  },
  "Spanish Bachillerato": {
    name: "Spanish Bachillerato",
    region: "Spain",
    gradingSystem: {
      description: "Numerical scale",
      scale: "0-10 (10 highest)",
      passingGrade: "5 out of 10"
    },
    commonSubjects: ["Spanish Language and Literature", "Foreign Language", "Philosophy", "History", "Mathematics", "Physics", "Chemistry", "Biology", "Earth Sciences"]
  },
  "NCEA (New Zealand)": {
    name: "NCEA (New Zealand)",
    region: "New Zealand",
    gradingSystem: {
      description: "Credit-based system with achievement levels",
      scale: "Not Achieved, Achieved, Merit, Excellence",
      passingGrade: "Achieved or higher"
    },
    commonSubjects: ["English", "Mathematics", "Science", "Social Studies", "Arts", "Languages", "Technology", "Health and Physical Education"]
  },
  "Singapore A-Levels": {
    name: "Singapore A-Levels",
    region: "Singapore",
    gradingSystem: {
      description: "Letter grades",
      scale: "A, B, C, D, E, S, U (fail)",
      passingGrade: "S or higher"
    },
    commonSubjects: ["General Paper", "Mathematics", "Sciences (Physics, Chemistry, Biology)", "Humanities (Economics, History, Literature)", "Mother Tongue Language", "Project Work"]
  },
  "Hong Kong DSE": {
    name: "Hong Kong DSE",
    region: "Hong Kong",
    gradingSystem: {
      description: "Numbered levels",
      scale: "5** (highest), 5*, 5, 4, 3, 2, 1, U (fail)",
      passingGrade: "Level 2 or above"
    },
    commonSubjects: ["Chinese Language", "English Language", "Mathematics", "Liberal Studies", "Elective subjects"]
  },
  "South African NSC": {
    name: "South African NSC",
    region: "South Africa",
    gradingSystem: {
      description: "Achievement levels",
      scale: "Level 7 (80-100%) to Level 1 (0-29%)",
      passingGrade: "Level 3 (40%) or higher"
    },
    commonSubjects: ["Home Language", "First Additional Language", "Mathematics or Mathematical Literacy", "Life Orientation", "Three elective subjects"]
  }
};
