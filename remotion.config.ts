import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/video/Root.tsx");
Config.setVideoImageFormat("jpeg");
Config.setQuality(90);
Config.setCodec("h264");