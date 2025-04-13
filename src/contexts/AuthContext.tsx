import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';

type DbSavedUniversity = Database['public']['Tables']['saved_universities']['Row'];

interface UniversityData {
  id: string;
  name: string;
  location: string;
  tuitionRange: string;
  programMatch: number;
  requirements: string[];
  rankings: {
    global?: number;
    national?: number;
    program?: number;
  };
  tags: string[];
  applicationDeadline?: string;
  scholarshipInfo?: string;
  website: string;
}

interface SavedUniversity extends Omit<DbSavedUniversity, 'university_data'> {
  university_data: UniversityData;
}

interface AuthContextType {
  currentUser: any | null;
  isLoading: boolean;
  savedUniversities: SavedUniversity[];
  saveUniversity: (universityData: UniversityData) => Promise<void>;
  removeSavedUniversity: (universityId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  savedUniversities: [],
  saveUniversity: async () => {},
  removeSavedUniversity: async () => {},
});

function isUniversityData(data: unknown): data is UniversityData {
  const d = data as UniversityData;
  return (
    typeof d === 'object' &&
    d !== null &&
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.location === 'string' &&
    typeof d.tuitionRange === 'string' &&
    typeof d.programMatch === 'number' &&
    Array.isArray(d.requirements) &&
    Array.isArray(d.tags) &&
    typeof d.website === 'string'
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [savedUniversities, setSavedUniversities] = useState<SavedUniversity[]>([]);

  useEffect(() => {
    async function loadSavedUniversities() {
      if (currentUser?.id) {
        try {
          const { data, error } = await supabase
            .from('saved_universities')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          const validUniversities = (data || []).filter(
            item => isUniversityData(item.university_data as unknown)
          ).map(item => ({
            ...item,
            university_data: item.university_data as unknown as UniversityData
          }));
          
          setSavedUniversities(validUniversities);
        } catch (error) {
          console.error('Error loading saved universities:', error);
        }
      } else {
        setSavedUniversities([]);
      }
    }

    loadSavedUniversities();
    setIsLoading(false);
  }, [currentUser]);

  const saveUniversity = async (universityData: UniversityData) => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('saved_universities')
        .insert([
          {
            user_id: currentUser.id,
            university_name: universityData.name,
            university_data: universityData as unknown as Database['public']['Tables']['saved_universities']['Insert']['university_data'],
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      if (data && isUniversityData(data.university_data as unknown)) {
        setSavedUniversities(prev => [{
          ...data,
          university_data: data.university_data as unknown as UniversityData
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error saving university:', error);
      throw error;
    }
  };

  const removeSavedUniversity = async (universityId: string) => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabase
        .from('saved_universities')
        .delete()
        .eq('id', universityId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setSavedUniversities(prev => 
        prev.filter(uni => uni.id !== universityId)
      );
    } catch (error) {
      console.error('Error removing saved university:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        isLoading, 
        savedUniversities,
        saveUniversity,
        removeSavedUniversity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 