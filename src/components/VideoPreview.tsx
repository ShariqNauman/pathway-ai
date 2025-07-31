import { Player } from "@remotion/player";
import { AdVideo } from "@/video/AdVideo";

export const VideoPreview = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Pathway Platform Ad</h2>
      <div className="rounded-lg overflow-hidden shadow-2xl">
        <Player
          component={AdVideo}
          durationInFrames={600}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          style={{
            width: "100%",
            height: "auto",
          }}
          controls
          clickToPlay
        />
      </div>
      <div className="mt-4 text-center text-gray-600">
        <p>30-second marketing video showcasing all platform features</p>
      </div>
    </div>
  );
};