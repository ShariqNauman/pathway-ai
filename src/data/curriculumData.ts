export interface CurriculumInfo {
  name: string;
  region: string;
  gradingSystem: {
    description: string;
    scale: string;
    passingGrade: string;
  };
  commonSubjects: string[];
  allPossibleSubjects: string[]; // Added all possible subjects
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
    commonSubjects: ["English", "Mathematics", "Science", "Social Studies", "Foreign Language", "Physical Education", "Electives"],
    allPossibleSubjects: [
      "English Language", "English Literature", "Algebra I", "Algebra II", "Geometry", "Pre-Calculus", 
      "Calculus", "Statistics", "Biology", "Chemistry", "Physics", "Earth Science", "Environmental Science", 
      "US History", "World History", "Government/Civics", "Economics", "Psychology", "Sociology", 
      "Spanish", "French", "German", "Latin", "Mandarin", "Japanese", "Physical Education", 
      "Health", "Art", "Music", "Theater", "Computer Science", "Business", "Speech/Debate", 
      "Journalism", "Photography", "Creative Writing", "AP Biology", "AP Chemistry", "AP Physics", 
      "AP Calculus AB", "AP Calculus BC", "AP Statistics", "AP Computer Science", "AP English Language", 
      "AP English Literature", "AP US History", "AP World History", "AP European History", 
      "AP Psychology", "AP Economics", "AP Government", "AP Spanish", "AP French", "AP Art History"
    ]
  },
  "International Baccalaureate (IB)": {
    name: "International Baccalaureate (IB)",
    region: "International",
    gradingSystem: {
      description: "Numeric scale for each subject",
      scale: "1-7 points per subject (7 highest)",
      passingGrade: "4 out of 7"
    },
    commonSubjects: ["Studies in Language and Literature", "Language Acquisition", "Individuals and Societies", "Sciences", "Mathematics", "The Arts", "Theory of Knowledge", "Extended Essay", "CAS"],
    allPossibleSubjects: [
      "English A Literature", "English A Language and Literature", "Language B (Spanish, French, German, etc.)", 
      "Language ab initio (Spanish, French, Mandarin, etc.)", "Business Management", "Economics", 
      "Geography", "History", "Information Technology in a Global Society", "Philosophy", 
      "Psychology", "Social and Cultural Anthropology", "World Religions", "Biology", "Chemistry", 
      "Computer Science", "Design Technology", "Environmental Systems and Societies", "Physics", 
      "Sports, Exercise and Health Science", "Mathematics: Analysis and Approaches", 
      "Mathematics: Applications and Interpretation", "Dance", "Film", "Music", "Theatre", 
      "Visual Arts", "Theory of Knowledge", "Extended Essay", "Creativity, Activity, Service"
    ]
  },
  "A-Levels (UK)": {
    name: "A-Levels (UK)",
    region: "United Kingdom",
    gradingSystem: {
      description: "Letter grades",
      scale: "A*, A, B, C, D, E, U (fail)",
      passingGrade: "E or higher"
    },
    commonSubjects: ["Mathematics", "Further Mathematics", "English Literature", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Modern Languages"],
    allPossibleSubjects: [
      "Mathematics", "Further Mathematics", "Pure Mathematics", "Statistics", "Mechanics", 
      "English Literature", "English Language", "English Language and Literature", "Physics", 
      "Chemistry", "Biology", "History", "Ancient History", "Medieval History", "Modern History", 
      "Geography", "Geology", "Economics", "Business Studies", "Accounting", "French", "German", 
      "Spanish", "Italian", "Russian", "Mandarin", "Classical Greek", "Latin", "Computer Science", 
      "ICT", "Art and Design", "Drama", "Music", "Music Technology", "Physical Education", 
      "Psychology", "Sociology", "Religious Studies", "Philosophy", "Government and Politics", 
      "Law", "Media Studies", "Film Studies", "Photography", "Environmental Science", "Archaeology"
    ]
  },
  "European Baccalaureate": {
    name: "European Baccalaureate",
    region: "Europe (European Schools)",
    gradingSystem: {
      description: "Numerical scale",
      scale: "0-10 (10 highest)",
      passingGrade: "6 out of 10"
    },
    commonSubjects: ["First Language", "Second Language", "Mathematics", "History", "Geography", "Science", "Philosophy", "Physical Education", "Art"],
    allPossibleSubjects: [
      "First Language (L1)", "Second Language (L2)", "Third Language (L3)", "Fourth Language (L4)", 
      "Latin", "Ancient Greek", "Mathematics 3", "Mathematics 5", "Advanced Mathematics", 
      "Physics", "Chemistry", "Biology", "ICT", "Laboratory Physics", "Laboratory Chemistry", 
      "Laboratory Biology", "History", "Geography", "Economics", "Philosophy", "Music", 
      "Art", "Physical Education", "Religion/Ethics", "Sociology", "Political Science", 
      "Classical Studies", "Advanced Language 1", "Advanced Language 2"
    ]
  },
  "French Baccalauréat": {
    name: "French Baccalauréat",
    region: "France",
    gradingSystem: {
      description: "Numerical scale",
      scale: "0-20 (20 highest)",
      passingGrade: "10 out of 20"
    },
    commonSubjects: ["French Literature", "Philosophy", "Mathematics", "History-Geography", "Living Languages", "Sciences", "Economics", "Social Sciences"],
    allPossibleSubjects: [
      "French",
      "Philosophy",
      "Mathematics",
      "History",
      "Geography",
      "Physics",
      "Chemistry",
      "Biology",
      "Geology",
      "Economics",
      "Sociology",
      "Foreign Languages (English, Spanish, German, Italian, etc.)",
      "Arts (Visual Arts, Music, Theater)",
      "Computer Science",
      "Engineering Sciences",
      "Social Sciences",
      "Physical Education",
    ]
  },
  "German Abitur": {
    name: "German Abitur",
    region: "Germany",
    gradingSystem: {
      description: "Numerical scale",
      scale: "1-6 (1 highest, 6 lowest)",
      passingGrade: "4 or better"
    },
    commonSubjects: ["German", "Mathematics", "Foreign Language", "Natural Sciences", "Social Sciences", "Arts/Music", "Sports"],
    allPossibleSubjects: [
      "German",
      "Mathematics",
      "English",
      "French",
      "Latin",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "Social Studies",
      "Politics",
      "Economics",
      "Philosophy",
      "Arts",
      "Music",
      "Sports",
      "Computer Science",
      "Religion",
    ]
  },
  "Indian CBSE/ISC": {
    name: "Indian CBSE/ISC",
    region: "India",
    gradingSystem: {
      description: "Percentage and letter grades",
      scale: "A1, A2, B1, B2, C1, C2, D, E (fail)",
      passingGrade: "D or higher (33%+)"
    },
    commonSubjects: ["English", "Hindi or Regional Language", "Mathematics", "Science", "Social Science", "Computer Science", "Physical Education"],
    allPossibleSubjects: [
      "English",
      "Hindi",
      "Sanskrit",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "Economics",
      "Political Science",
      "Sociology",
      "Psychology",
      "Computer Science",
      "Information Practices",
      "Physical Education",
      "Accountancy",
      "Business Studies",
      "Home Science",
      "Fine Arts",
      "Music",
    ]
  },
  "Australian HSC": {
    name: "Australian HSC",
    region: "Australia",
    gradingSystem: {
      description: "Band system",
      scale: "Band 6 (90-100) to Band 1 (<50)",
      passingGrade: "Band 2 or higher"
    },
    commonSubjects: ["English", "Mathematics", "Sciences", "Humanities", "Arts", "Languages", "Technology"],
    allPossibleSubjects: [
      "English (Standard, Advanced, Extension 1, Extension 2)",
      "Mathematics (Standard, Advanced, Extension 1, Extension 2)",
      "Biology",
      "Chemistry",
      "Physics",
      "Earth and Environmental Science",
      "Ancient History",
      "Modern History",
      "Geography",
      "Economics",
      "Business Studies",
      "Legal Studies",
      "Studies of Religion",
      "Visual Arts",
      "Music",
      "Drama",
      "Languages (French, German, Italian, Japanese, Chinese, etc.)",
      "Information Processes and Technology",
      "Software Design and Development",
      "Engineering Studies",
      "Design and Technology",
      "Food Technology",
      "Personal Development, Health and Physical Education (PDHPE)",
    ]
  },
  "Canadian High School": {
    name: "Canadian High School",
    region: "Canada",
    gradingSystem: {
      description: "Percentage and letter grades",
      scale: "A (80-100%), B (70-79%), C (60-69%), D (50-59%), F (<50%)",
      passingGrade: "D (50%) or higher"
    },
    commonSubjects: ["English", "French", "Mathematics", "Science", "Social Studies", "Arts", "Physical Education"],
    allPossibleSubjects: [
      "English Language Arts",
      "Français (French)",
      "Mathematics (Principles, Foundations, Pre-Calculus, Calculus)",
      "Science (Biology, Chemistry, Physics, Earth Science, Environmental Science)",
      "Social Studies (History, Geography, Civics, Economics)",
      "Visual Arts",
      "Music",
      "Drama",
      "Physical Education",
      "Computer Science",
      "Business Studies",
      "Law",
      "Psychology",
      "Sociology",
      "Native Studies",
      "World Languages (Spanish, German, Mandarin, etc.)",
      "Technological Education",
    ]
  },
  "Chinese Gaokao": {
    name: "Chinese Gaokao",
    region: "China",
    gradingSystem: {
      description: "Points-based system",
      scale: "Total score usually out of 750",
      passingGrade: "Varies by province and year"
    },
    commonSubjects: ["Chinese", "Mathematics", "Foreign Language", "Sciences (Physics, Chemistry, Biology)", "Humanities (History, Geography, Politics)"],
    allPossibleSubjects: [
      "Chinese Language and Literature",
      "Mathematics",
      "English",
      "Physics",
      "Chemistry",
      "Biology",
      "Politics",
      "History",
      "Geography",
      "Technology",
    ]
  },
  "Japanese High School": {
    name: "Japanese High School",
    region: "Japan",
    gradingSystem: {
      description: "5-point scale",
      scale: "5 (excellent) to 1 (poor)",
      passingGrade: "2 or higher"
    },
    commonSubjects: ["Japanese", "Mathematics", "English", "Science", "Social Studies", "Physical Education", "Art", "Home Economics"],
    allPossibleSubjects: [
      "Japanese Language",
      "Mathematics (I, II, III, A, B)",
      "English (Communication English I, II, III, English Expression I, II)",
      "Physics",
      "Chemistry",
      "Biology",
      "Earth Science",
      "World History",
      "Japanese History",
      "Geography",
      "Civics",
      "Ethics",
      "Politics and Economics",
      "Art",
      "Music",
      "Calligraphy",
      "Physical Education",
      "Home Economics",
      "Information",
    ]
  },
  "South Korean High School": {
    name: "South Korean High School",
    region: "South Korea",
    gradingSystem: {
      description: "Letter grade and percentage",
      scale: "A (90-100%), B (80-89%), C (70-79%), D (60-69%), F (<60%)",
      passingGrade: "D (60%) or higher"
    },
    commonSubjects: ["Korean Language", "Mathematics", "English", "Social Studies", "Science", "Physical Education", "Music", "Fine Arts"],
    allPossibleSubjects: [
      "Korean Language",
      "Mathematics",
      "English",
      "Social Studies (Korean History, World History, Geography, Ethics)",
      "Science (Physics, Chemistry, Biology, Earth Science)",
      "Technology and Home Economics",
      "Arts (Music, Fine Arts)",
      "Physical Education",
      "Classical Chinese",
      "Electives (Economics, Politics, Sociology, Psychology, Philosophy, etc.)",
    ]
  },
  "Brazilian Vestibular": {
    name: "Brazilian Vestibular",
    region: "Brazil",
    gradingSystem: {
      description: "0-10 scale",
      scale: "0-10 (10 highest)",
      passingGrade: "5 or higher"
    },
    commonSubjects: ["Portuguese", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Foreign Language"],
    allPossibleSubjects: [
      "Portuguese Language and Literature",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "English",
      "Spanish",
      "Philosophy",
      "Sociology",
      "Arts",
      "Physical Education",
    ]
  },
  "Russian Certificate of Secondary Education": {
    name: "Russian Certificate of Secondary Education",
    region: "Russia",
    gradingSystem: {
      description: "5-point scale",
      scale: "5 (excellent) to 2 (unsatisfactory)",
      passingGrade: "3 or higher"
    },
    commonSubjects: ["Russian Language", "Mathematics", "Foreign Language", "Physics", "Chemistry", "Biology", "History", "Social Science", "Geography"],
    allPossibleSubjects: [
      "Russian Language and Literature",
      "Mathematics (Algebra and Calculus)",
      "Foreign Language (English, German, French, Spanish, etc.)",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Social Science (Economics, Law, Political Science)",
      "Geography",
      "Information Technology",
      "Physical Education",
      "Arts (Music, Fine Arts)",
    ]
  },
  "Italian Maturità": {
    name: "Italian Maturità",
    region: "Italy",
    gradingSystem: {
      description: "Points-based system",
      scale: "60-100 (100 highest)",
      passingGrade: "60 out of 100"
    },
    commonSubjects: ["Italian", "Mathematics", "Foreign Language", "Science", "History", "Philosophy", "Art History"],
    allPossibleSubjects: [
      "Italian Language and Literature",
      "Mathematics",
      "English Language",
      "History",
      "Philosophy",
      "Physics",
      "Chemistry",
      "Biology",
      "Art History",
      "Latin",
      "Greek",
      "Social Science",
      "Economics",
    ]
  },
  "Spanish Bachillerato": {
    name: "Spanish Bachillerato",
    region: "Spain",
    gradingSystem: {
      description: "Numerical scale",
      scale: "0-10 (10 highest)",
      passingGrade: "5 out of 10"
    },
    commonSubjects: ["Spanish Language and Literature", "Foreign Language", "Philosophy", "History", "Mathematics", "Physics", "Chemistry", "Biology", "Earth Sciences"],
    allPossibleSubjects: [
      "Spanish Language and Literature",
      "Foreign Language (English, French, German, etc.)",
      "Philosophy",
      "History of Spain",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Earth and Environmental Sciences",
      "Technical Drawing",
      "Latin",
      "Greek",
      "Economics",
      "Business Administration",
    ]
  },
  "NCEA (New Zealand)": {
    name: "NCEA (New Zealand)",
    region: "New Zealand",
    gradingSystem: {
      description: "Credit-based system with achievement levels",
      scale: "Not Achieved, Achieved, Merit, Excellence",
      passingGrade: "Achieved or higher"
    },
    commonSubjects: ["English", "Mathematics", "Science", "Social Studies", "Arts", "Languages", "Technology", "Health and Physical Education"],
    allPossibleSubjects: [
      "English",
      "Mathematics",
      "Science (Biology, Chemistry, Physics)",
      "Social Studies (History, Geography, Economics)",
      "Te Reo Māori",
      "Visual Arts",
      "Music",
      "Drama",
      "Dance",
      "Technology (Digital Technology, Design and Visual Communication, Materials Technology)",
      "Health and Physical Education",
      "Classical Studies",
      "Business Studies",
      "Accounting",
      "Economics",
      "Tourism",
    ]
  },
  "Singapore A-Levels": {
    name: "Singapore A-Levels",
    region: "Singapore",
    gradingSystem: {
      description: "Letter grades",
      scale: "A, B, C, D, E, S, U (fail)",
      passingGrade: "S or higher"
    },
    commonSubjects: ["General Paper", "Mathematics", "Sciences (Physics, Chemistry, Biology)", "Humanities (Economics, History, Literature)", "Mother Tongue Language", "Project Work"],
    allPossibleSubjects: [
      "General Paper",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Economics",
      "History",
      "Literature",
      "Geography",
      "Chinese Language",
      "Malay Language",
      "Tamil Language",
      "Hindi Language",
      "Art",
      "Music",
      "Computing",
      "Further Mathematics",
    ]
  },
  "Hong Kong DSE": {
    name: "Hong Kong DSE",
    region: "Hong Kong",
    gradingSystem: {
      description: "Numbered levels",
      scale: "5** (highest), 5*, 5, 4, 3, 2, 1, U (fail)",
      passingGrade: "Level 2 or above"
    },
    commonSubjects: ["Chinese Language", "English Language", "Mathematics", "Liberal Studies", "Elective subjects"],
    allPossibleSubjects: [
      "Chinese Language",
      "English Language",
      "Mathematics (Compulsory Part)",
      "Liberal Studies",
      "Chinese Literature",
      "English Literature",
      "Chinese History",
      "World History",
      "Geography",
      "Economics",
      "Business, Accounting and Financial Studies",
      "Information and Communication Technology",
      "Physics",
      "Chemistry",
      "Biology",
      "Combined Science",
      "Integrated Science",
      "Visual Arts",
      "Music",
      "Physical Education",
    ]
  },
  "South African NSC": {
    name: "South African NSC",
    region: "South Africa",
    gradingSystem: {
      description: "Achievement levels",
      scale: "Level 7 (80-100%) to Level 1 (0-29%)",
      passingGrade: "Level 3 (40%) or higher"
    },
    commonSubjects: ["Home Language", "First Additional Language", "Mathematics or Mathematical Literacy", "Life Orientation", "Three elective subjects"],
    allPossibleSubjects: [
      "Home Language (English, Afrikaans, etc.)",
      "First Additional Language (English, Afrikaans, etc.)",
      "Mathematics",
      "Mathematical Literacy",
      "Life Orientation",
      "Accounting",
      "Business Studies",
      "Economics",
      "Geography",
      "History",
      "Life Sciences",
      "Physical Sciences",
      "Computer Applications Technology",
      "Information Technology",
      "Visual Arts",
      "Dramatic Arts",
      "Music",
      "Tourism",
    ]
  },
  "Pakistani HSSC": {
    name: "Pakistani HSSC",
    region: "Pakistan",
    gradingSystem: {
      description: "10-point grading system",
      scale: "A++ (90-100%), A+ (85-89%), A (80-84%), B++ (75-79%), B+ (70-74%), B (65-69%), C (60-64%), D (50-59%), E (40-49%), U (<40%)",
      passingGrade: "E (40%) or higher"
    },
    commonSubjects: [
      "English",
      "Urdu",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "Economics",
      "Statistics",
      "Pakistan Studies",
      "Islamic Studies"
    ],
    allPossibleSubjects: [
      "English",
      "Urdu",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "Economics",
      "Statistics",
      "Pakistan Studies",
      "Islamic Studies",
      "General Science",
      "Geography",
      "History",
      "Business Studies",
      "Accounting",
      "Principles of Commerce",
      "Principles of Economics",
      "Sociology",
      "Psychology",
      "Political Science",
      "Islamic History",
      "Arabic",
      "Persian",
      "Home Economics",
      "Fine Arts",
      "Physical Education"
    ]
  }
};
