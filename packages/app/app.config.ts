/// <reference types="node" />
import { ExpoConfig, ConfigContext } from '@expo/config';

/**
 * Use ts-node here so we can use TypeScript for our Config Plugins
 * and not have to compile them to JavaScript
 */
require('ts-node/register');

/**
 * @param config ExpoConfig coming from the static config app.json if it exists
 *
 * You can read more about Expo's Configuration Resolution Rules here:
 * https://docs.expo.dev/workflow/configuration/#configuration-resolution-rules
 */
/**
 * The store-facing version number, owned by `package.json` so that Changesets is the one
 * thing that moves it: `pnpm changeset` describes the release, `pnpm changeset:version`
 * bumps the package, and the next build carries that number into App Store Connect and
 * Play. `app.json` deliberately has no `version` key - two copies of the same number drift.
 *
 * The build number under it is a different counter and is not kept here at all: eas.json
 * sets `appVersionSource: "remote"`, so EAS holds `ios.buildNumber` / `android.versionCode`
 * and increments them per production build.
 */
const { version } = require('./package.json') as { version: string };

module.exports = ({ config }: ConfigContext): Partial<ExpoConfig> => {
    const existingPlugins = config.plugins ?? [];

    return {
        ...config,
        version,
        ios: {
            ...config.ios,
            // This privacyManifests is to get you started.
            // See Expo's guide on apple privacy manifests here:
            // https://docs.expo.dev/guides/apple-privacy/
            // You may need to add more privacy manifests depending on your app's usage of APIs.
            // More details and a list of "required reason" APIs can be found in the Apple Developer Documentation.
            // https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
            privacyManifests: {
                NSPrivacyAccessedAPITypes: [
                    {
                        NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
                        NSPrivacyAccessedAPITypeReasons: ['CA92.1'], // CA92.1 = "Access info from same app, per documentation"
                    },
                ],
            },
        },
        plugins: [...existingPlugins, require('./plugins/withSplashScreen').withSplashScreen],
    };
};
