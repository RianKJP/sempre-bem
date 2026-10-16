import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
    const plugins: NonNullable<ExpoConfig["plugins"]> = [
        ...(config.plugins ?? []),
    ];

    const hasMapLibrePlugin = plugins.some((plugin) =>
        Array.isArray(plugin)
            ? plugin[0] === "@maplibre/maplibre-react-native"
            : plugin === "@maplibre/maplibre-react-native",
    );

    if (!hasMapLibrePlugin) {
        plugins.push("@maplibre/maplibre-react-native");
    }

    return {
        ...config,
        name: config.name ?? "sempre-bem",
        slug: config.slug ?? "sempre-bem",
        plugins,
    };
};
