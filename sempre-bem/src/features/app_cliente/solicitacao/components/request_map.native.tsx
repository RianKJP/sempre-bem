import {
    Camera,
    type CameraRef,
    Map as MapLibreMap,
    type MapRef,
    type StyleSpecification,
    ViewAnnotation,
} from "@maplibre/maplibre-react-native";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RequestMapProps = {
    controlsTopOffset?: number;
    hasCurrentLocation: boolean;
    latitude: number;
    longitude: number;
};

const INITIAL_ZOOM = 15;
const STREET_ZOOM = 17;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const DEFAULT_COORDINATE: [number, number] = [-46.6346, -23.5898];

const OPEN_STREET_MAP_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        openStreetMap: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 0,
            maxzoom: MAX_ZOOM,
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [
        {
            id: "openStreetMap",
            type: "raster",
            source: "openStreetMap",
            minzoom: 0,
            maxzoom: MAX_ZOOM,
        },
    ],
};

export function RequestMap({
    controlsTopOffset = 12,
    hasCurrentLocation,
    latitude,
    longitude,
}: RequestMapProps) {
    const cameraRef = useRef<CameraRef>(null);
    const mapRef = useRef<MapRef>(null);
    const coordinate: [number, number] = hasCurrentLocation
        ? [longitude, latitude]
        : DEFAULT_COORDINATE;

    useEffect(() => {
        if (!hasCurrentLocation) {
            return;
        }

        cameraRef.current?.easeTo({
            center: [longitude, latitude],
            zoom: INITIAL_ZOOM,
            duration: 500,
        });
    }, [hasCurrentLocation, latitude, longitude]);

    const changeZoom = async (amount: number) => {
        const currentZoom = (await mapRef.current?.getZoom()) ?? INITIAL_ZOOM;
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + amount));

        cameraRef.current?.zoomTo(nextZoom, { duration: 180 });
    };

    const centerOnCurrentLocation = () => {
        cameraRef.current?.easeTo({
            center: coordinate,
            zoom: STREET_ZOOM,
            duration: 450,
        });
    };

    return (
        <View style={styles.container}>
            <MapLibreMap
                attribution
                attributionPosition={{ bottom: 4, left: 4 }}
                compass
                compassPosition={{ top: 8, left: 8 }}
                doubleTapHoldZoom
                doubleTapZoom
                dragPan
                logo={false}
                mapStyle={OPEN_STREET_MAP_STYLE}
                ref={mapRef}
                scaleBar={false}
                style={StyleSheet.absoluteFill}
                touchPitch
                touchRotate
                touchZoom
            >
                <Camera
                    initialViewState={{ center: coordinate, zoom: INITIAL_ZOOM }}
                    maxZoom={MAX_ZOOM}
                    minZoom={MIN_ZOOM}
                    ref={cameraRef}
                />

                {hasCurrentLocation ? (
                    <ViewAnnotation
                        anchor="bottom"
                        id="current-location"
                        lngLat={coordinate}
                        title="Seu endereço"
                    >
                        <View style={styles.locationMarker}>
                            <View style={styles.locationMarkerCenter} />
                        </View>
                    </ViewAnnotation>
                ) : null}
            </MapLibreMap>

            <View style={[styles.controls, { top: controlsTopOffset }]}>
                <Pressable
                    accessibilityLabel="Aumentar zoom do mapa"
                    onPress={() => void changeZoom(1)}
                    style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
                >
                    <Text style={styles.controlText}>+</Text>
                </Pressable>
                <View style={styles.controlDivider} />
                <Pressable
                    accessibilityLabel="Diminuir zoom do mapa"
                    onPress={() => void changeZoom(-1)}
                    style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
                >
                    <Text style={styles.controlText}>−</Text>
                </Pressable>
            </View>

            {hasCurrentLocation ? (
                <Pressable
                    accessibilityLabel="Centralizar mapa na minha localização"
                    onPress={centerOnCurrentLocation}
                    style={({ pressed }) => [
                        styles.locationButton,
                        { top: controlsTopOffset + 96 },
                        pressed && styles.controlPressed,
                    ]}
                >
                    <SymbolView
                        name={{ ios: "location.fill", android: "my_location", web: "my_location" }}
                        size={22}
                        tintColor="#713568"
                    />
                </Pressable>
            ) : null}

            <Text pointerEvents="none" style={styles.attributionText}>
                © OpenStreetMap contributors
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    controls: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E5DED5",
        borderRadius: 12,
        borderWidth: 1,
        elevation: 4,
        position: "absolute",
        right: 12,
        shadowColor: "#262326",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
        zIndex: 3,
    },
    controlButton: {
        alignItems: "center",
        height: 42,
        justifyContent: "center",
        width: 42,
    },
    controlDivider: {
        backgroundColor: "#E5DED5",
        height: 1,
        marginHorizontal: 7,
    },
    controlText: {
        color: "#262326",
        fontSize: 25,
        fontWeight: "600",
        lineHeight: 28,
    },
    controlPressed: {
        opacity: 0.55,
    },
    locationButton: {
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderColor: "#E5DED5",
        borderRadius: 22,
        borderWidth: 1,
        elevation: 4,
        height: 44,
        justifyContent: "center",
        position: "absolute",
        right: 12,
        shadowColor: "#262326",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
        width: 44,
        zIndex: 3,
    },
    locationMarker: {
        alignItems: "center",
        backgroundColor: "rgba(113, 53, 104, 0.22)",
        borderRadius: 18,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    locationMarkerCenter: {
        backgroundColor: "#713568",
        borderColor: "#FFFFFF",
        borderRadius: 9,
        borderWidth: 3,
        height: 18,
        width: 18,
    },
    attributionText: {
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        bottom: 3,
        color: "#4A4749",
        fontSize: 8,
        left: 28,
        paddingHorizontal: 3,
        position: "absolute",
    },
});
