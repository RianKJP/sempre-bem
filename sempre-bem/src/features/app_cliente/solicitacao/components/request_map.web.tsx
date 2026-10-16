import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

type RequestMapProps = {
    controlsTopOffset?: number;
    hasCurrentLocation: boolean;
    latitude: number;
    longitude: number;
};

export function RequestMap({ hasCurrentLocation, latitude, longitude }: RequestMapProps) {
    return (
        <View style={styles.map}>
            <View style={[styles.road, styles.roadOne]} />
            <View style={[styles.road, styles.roadTwo]} />
            <View style={[styles.road, styles.roadThree]} />
            {hasCurrentLocation ? (
                <>
                    <View style={styles.pin}>
                        <SymbolView
                            name={{ ios: "mappin", android: "location_on", web: "location_on" }}
                            size={28}
                            tintColor="#713568"
                        />
                    </View>
                    <Text style={styles.coordinate}>{latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
                </>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    map: { flex: 1, overflow: "hidden", backgroundColor: "#E8E4DC" },
    road: { position: "absolute", height: 26, width: "140%", left: "-20%", backgroundColor: "#F8F5EE", borderColor: "#D4CCC1", borderWidth: 1 },
    roadOne: { top: 36, transform: [{ rotate: "-12deg" }] },
    roadTwo: { top: 112, transform: [{ rotate: "18deg" }] },
    roadThree: { top: 76, transform: [{ rotate: "-54deg" }] },
    pin: { position: "absolute", left: "50%", top: "44%", width: 38, height: 38, marginLeft: -19, marginTop: -19, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#262326", shadowOpacity: 0.16, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    coordinate: { position: "absolute", right: 10, bottom: 30, color: "#766F73", fontSize: 9, backgroundColor: "rgba(255, 255, 255, 0.86)", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
});
