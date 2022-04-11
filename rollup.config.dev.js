import buildConfig from './rollup.config';

// use first output of first config block for dev
const config = Array.isArray(buildConfig) ? buildConfig[1] : buildConfig;
Array.isArray(config.output) && (config.output = config.output[1]);

export default config;