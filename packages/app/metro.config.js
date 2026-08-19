/* eslint-env node */
// Learn more https://docs.expo.io/guides/customizing-metro
// Sentry's Expo entry point, not `withSentryConfig` - that one is for bare React
// Native and replaces the serializer outright, which breaks `expo export` (Expo
// installs its own custom serializer for Hermes bytecode). This returns Expo's own
// default config with Sentry's debug-id plugin added alongside it.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
// A debug id in each bundle is what pairs a minified stack trace with the source
// map uploaded for that exact build.
const config = getSentryExpoConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');

config.transformer.getTransformOptions = async () => ({
    transform: {
        // Inline requires are very useful for deferring loading of large dependencies/components.
        // For example, we use it in app.tsx to conditionally load Reactotron.
        // However, this comes with some gotchas.
        // Read more here: https://reactnative.dev/docs/optimizing-javascript-loading
        // And here: https://github.com/expo/expo/issues/27279#issuecomment-1971610698
        inlineRequires: true,
    },
});

// This is a temporary fix that helps fixing an issue with axios/apisauce.
// See the following issues in Github for more details:
// https://github.com/infinitered/apisauce/issues/331
// https://github.com/axios/axios/issues/6899
// The solution was taken from the following issue:
// https://github.com/facebook/metro/issues/1272
config.resolver.unstable_conditionNames = ['require', 'default', 'browser'];

// This helps support certain popular third-party libraries
// such as Firebase that use the extension cjs.
config.resolver.sourceExts.push('cjs');
config.resolver.sourceExts.push('svg');

module.exports = config;
