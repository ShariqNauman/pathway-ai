
import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { getRecommenderCount } from "@/utils/smartRecommenderApi";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

const SmartRecommenderLimits = () => {
  const { currentUser } = useUser();
  const [limitInfo, setLimitInfo] = useState<{ count: number; isLimitReached: boolean }>({ 
    count: 0, 
    isLimitReached: false 
  });

  useEffect(() => {
    const fetchLimitInfo = async () => {
      if (!currentUser?.id) return;
      
      const info = await getRecommenderCount(currentUser.id);
      setLimitInfo(info);
    };

    fetchLimitInfo();
  }, [currentUser?.id]);

  if (!currentUser) {
    return null;
  }

  const remainingRecommendations = 5 - limitInfo.count;

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Info className="h-4 w-4" />
          <span>
            {limitInfo.isLimitReached ? (
              <span className="text-red-600 font-medium">
                Daily recommendation limit reached (5/5). Resets at UTC midnight.
              </span>
            ) : (
              <span>
                Recommendations remaining today: <span className="font-medium">{remainingRecommendations}/5</span>
                {remainingRecommendations <= 2 && (
                  <span className="text-orange-600 ml-1">(Limit resets at UTC midnight)</span>
                )}
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartRecommenderLimits;
