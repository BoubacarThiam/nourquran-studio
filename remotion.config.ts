// @ts-ignore — types exposés via le package CLI au runtime
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");

// Remotion Lambda (commenté — activer si déploiement sur AWS Lambda)
// import { getAwsClient } from "@remotion/lambda";
// Config.setRegion("us-east-1");
