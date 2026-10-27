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

    if (!plugins.some((plugin) => plugin === "expo-image" || (Array.isArray(plugin) && plugin[0] === "expo-image"))) {
        plugins.push("expo-image");
    }

    if (!plugins.some((plugin) => plugin === "expo-sqlite" || (Array.isArray(plugin) && plugin[0] === "expo-sqlite"))) {
        plugins.push("expo-sqlite");
    }

    if (!plugins.some((plugin) => plugin === "expo-location" || (Array.isArray(plugin) && plugin[0] === "expo-location"))) {
        plugins.push([
            "expo-location",
            {
                locationWhenInUsePermission: "Permita que o Sempre Bem use sua localização durante os recursos de mapa e atendimento.",
            },
        ]);
    }

    if (!plugins.some((plugin) => plugin === "expo-image-picker" || (Array.isArray(plugin) && plugin[0] === "expo-image-picker"))) {
        plugins.push([
            "expo-image-picker",
            {
                photosPermission: "Permita que o Sempre Bem acesse suas fotos para adicionar uma imagem ao perfil.",
                microphonePermission: false,
            },
        ]);
    }

    return {
        ...config,
        name: config.name ?? "sempre-bem",
        slug: config.slug ?? "sempre-bem",
        plugins,
    };
};
