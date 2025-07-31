import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  spring,
  Easing,
} from "remotion";

// Scene 1: Hero Introduction (0-120 frames, 4 seconds)
const HeroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
    },
  });

  const titleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [60, 90], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
      <div className="text-center">
        <div 
          style={{
            transform: `scale(${logoScale})`,
            opacity: frame > 15 ? 1 : 0,
          }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-2xl">
            <span className="text-3xl font-bold text-blue-600">P</span>
          </div>
        </div>
        
        <h1 
          style={{ opacity: titleOpacity }}
          className="text-6xl font-bold text-white mb-4"
        >
          Pathway
        </h1>
        
        <p 
          style={{ 
            transform: `translateY(${subtitleY}px)`,
            opacity: frame > 60 ? 1 : 0,
          }}
          className="text-2xl text-blue-100"
        >
          Your AI-Powered College Application Guide
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Essay Analyzer Feature (120-240 frames, 4 seconds)
const EssayAnalyzerScene = () => {
  const frame = useCurrentFrame();
  
  const documentScale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textReveal = interpolate(frame, [30, 90], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ratingAppear = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
      <div className="max-w-4xl mx-auto flex items-center gap-16">
        {/* Document Mock */}
        <div 
          style={{ transform: `scale(${documentScale})` }}
          className="bg-white rounded-lg shadow-2xl p-8 w-96"
        >
          <div className="space-y-4">
            {/* Title */}
            <div className="h-6 bg-gray-800 rounded" style={{ width: `${Math.min(textReveal, 100)}%` }} />
            
            {/* Content lines */}
            {[80, 90, 75, 85].map((width, i) => (
              <div 
                key={i}
                className="h-3 bg-gray-300 rounded" 
                style={{ 
                  width: `${Math.min(textReveal - (i * 10), width)}%`,
                  opacity: textReveal > (i * 10) ? 1 : 0,
                }} 
              />
            ))}
          </div>
        </div>

        {/* Feature Description */}
        <div className="text-white">
          <h2 className="text-5xl font-bold mb-6">Essay Analyzer</h2>
          <p className="text-2xl mb-8 text-green-100">
            Get instant AI feedback on your essays
          </p>
          
          {/* Rating Display */}
          <div 
            style={{ opacity: ratingAppear }}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-6"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-yellow-300">9.2</span>
              <div>
                <div className="text-lg font-semibold">Overall Score</div>
                <div className="text-green-200">Excellent work!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: AI Consultant Feature (240-360 frames, 4 seconds)
const ConsultantScene = () => {
  const frame = useCurrentFrame();
  
  const chatBubbles = [
    { delay: 0, text: "Which universities should I apply to?" },
    { delay: 30, text: "Based on your profile, I recommend MIT, Stanford, and UC Berkeley for CS..." },
    { delay: 60, text: "What about safety schools?" },
    { delay: 90, text: "Consider UC San Diego and Georgia Tech as excellent options..." },
  ];

  return (
    <AbsoluteFill className="bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
      <div className="max-w-5xl mx-auto flex items-center gap-16">
        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-2xl p-6 w-96 h-80 overflow-hidden">
          <div className="space-y-4">
            {chatBubbles.map((bubble, i) => {
              const appear = interpolate(frame, [bubble.delay, bubble.delay + 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

              if (appear === 0) return null;

              return (
                <div 
                  key={i}
                  style={{ opacity: appear }}
                  className={`p-3 rounded-lg max-w-xs ${
                    i % 2 === 0 
                      ? 'bg-blue-500 text-white ml-auto' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm">{bubble.text}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Description */}
        <div className="text-white">
          <h2 className="text-5xl font-bold mb-6">AI Consultant</h2>
          <p className="text-2xl mb-8 text-purple-100">
            Get personalized college guidance 24/7
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-lg">University recommendations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-lg">Application strategies</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-lg">Career guidance</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Smart Recommender Feature (360-480 frames, 4 seconds)
const SmartRecommenderScene = () => {
  const frame = useCurrentFrame();
  
  const universities = [
    { name: "MIT", match: "98%", color: "bg-red-500" },
    { name: "Stanford", match: "95%", color: "bg-red-600" },
    { name: "UC Berkeley", match: "92%", color: "bg-blue-500" },
    { name: "Georgia Tech", match: "88%", color: "bg-yellow-500" },
  ];

  return (
    <AbsoluteFill className="bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
      <div className="max-w-5xl mx-auto flex items-center gap-16">
        {/* Recommendation Cards */}
        <div className="grid grid-cols-2 gap-4">
          {universities.map((uni, i) => {
            const appear = interpolate(frame, [i * 20, i * 20 + 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const slideY = interpolate(frame, [i * 20, i * 20 + 30], [50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div 
                key={i}
                style={{ 
                  opacity: appear,
                  transform: `translateY(${slideY}px)`,
                }}
                className="bg-white rounded-lg p-6 shadow-xl"
              >
                <div className={`w-12 h-12 ${uni.color} rounded-lg mb-4`} />
                <h3 className="font-bold text-lg mb-2">{uni.name}</h3>
                <div className="text-green-600 font-semibold text-xl">{uni.match} Match</div>
              </div>
            );
          })}
        </div>

        {/* Feature Description */}
        <div className="text-white">
          <h2 className="text-5xl font-bold mb-6">Smart Recommender</h2>
          <p className="text-2xl mb-8 text-orange-100">
            Find your perfect university matches
          </p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
            <div className="text-lg font-semibold mb-2">Powered by AI</div>
            <div className="text-orange-100">
              Analyzes your profile, grades, and preferences to recommend the best universities for you
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Call to Action (480-600 frames, 4 seconds)
const CallToActionScene = () => {
  const frame = useCurrentFrame();
  
  const titleScale = spring({
    frame,
    fps: 30,
    config: {
      damping: 12,
      stiffness: 200,
    },
  });

  const buttonBounce = interpolate(
    Math.sin((frame / 15) * Math.PI * 2),
    [-1, 1],
    [0.95, 1.05]
  );

  const sparkles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const radius = interpolate(frame, [0, 60], [0, 200], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: interpolate(frame, [0, 30, 90], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    };
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Sparkles */}
      {sparkles.map((sparkle, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(${sparkle.x - 2}px, ${sparkle.y - 2}px)`,
            opacity: sparkle.opacity,
          }}
          className="w-1 h-1 bg-white rounded-full"
        />
      ))}

      <div className="text-center z-10">
        <h1 
          style={{ transform: `scale(${titleScale})` }}
          className="text-7xl font-bold text-white mb-8"
        >
          Start Your Journey
        </h1>
        
        <p className="text-3xl text-purple-100 mb-12">
          Join thousands of students getting into their dream colleges
        </p>
        
        <button 
          style={{ transform: `scale(${buttonBounce})` }}
          className="bg-white text-purple-600 px-12 py-6 rounded-full text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all"
        >
          Get Started Free
        </button>
        
        <div className="mt-8 text-purple-200 text-xl">
          ✨ No credit card required ✨
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main Video Composition
export const AdVideo = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={120}>
        <HeroScene />
      </Sequence>
      
      <Sequence from={120} durationInFrames={120}>
        <EssayAnalyzerScene />
      </Sequence>
      
      <Sequence from={240} durationInFrames={120}>
        <ConsultantScene />
      </Sequence>
      
      <Sequence from={360} durationInFrames={120}>
        <SmartRecommenderScene />
      </Sequence>
      
      <Sequence from={480} durationInFrames={120}>
        <CallToActionScene />
      </Sequence>
    </AbsoluteFill>
  );
};