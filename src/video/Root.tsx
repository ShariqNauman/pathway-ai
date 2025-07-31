import { Composition } from "remotion";
import { AdVideo } from "./AdVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PathwayAd"
        component={AdVideo}
        durationInFrames={600} // 20 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};