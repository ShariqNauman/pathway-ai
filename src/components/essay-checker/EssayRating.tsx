
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Star, Lightbulb, Music, Waves, Heart, Target, ScanLine } from "lucide-react";
import { motion } from "framer-motion";

export interface RatingCategory {
  name: string;
  score: number;
  description: string;
  icon: React.ComponentType<any>; // Updated to accept a component type instead of a ReactNode
}

export interface EssayRatingProps {
  ratings: {
    overall: number;
    categories: RatingCategory[];
  };
}

const EssayRating = ({ ratings }: EssayRatingProps) => {
  if (!ratings || !ratings.categories.length) return null;

  const getColorClass = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-green-400";
    if (score >= 70) return "bg-yellow-400";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-primary">Your Results</h3>
        <p className="text-sm text-muted-foreground mt-1">
          If you have concerns or questions, you can reach out at{" "}
          <a href="mailto:contact@maxadmit.com" className="text-blue-600 hover:underline">
            contact@maxadmit.com
          </a>
          .
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="font-semibold">Overall</span>
          </div>
          <span className="font-bold text-xl">{ratings.overall}</span>
        </div>
        <Progress 
          value={ratings.overall} 
          className="h-3 rounded-full bg-accent/50" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ratings.categories.map((category, index) => {
          const IconComponent = category.icon;
          
          return (
            <motion.div 
              key={category.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-primary" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="font-bold">{category.score}</span>
              </div>
              <Progress 
                value={category.score} 
                className={`h-2.5 rounded-full overflow-hidden bg-accent/50`}
              />
              <div className="mt-1.5 overflow-hidden">
                <p className="text-xs text-muted-foreground h-0 group-hover:h-auto transition-all duration-300">
                  {category.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default EssayRating;
