import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";

let pendingAccessRequest: Promise<boolean> | null = null;

function showSettingsAlert(message: string) {
    Alert.alert("Ative sua localização", message, [
        { text: "Agora não", style: "cancel" },
        { text: "Abrir ajustes", onPress: () => void Linking.openSettings() },
    ]);
}

async function checkLocationAccess(): Promise<boolean> {
    let permission = await Location.getForegroundPermissionsAsync();

    if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
    }

    if (!permission.granted) {
        if (Platform.OS !== "web" && !permission.canAskAgain) {
            showSettingsAlert("Permita o acesso à localização nos ajustes do celular para usarmos seu endereço atual.");
        }
        return false;
    }

    if (await Location.hasServicesEnabledAsync()) {
        return true;
    }

    if (Platform.OS === "android") {
        try {
            await Location.enableNetworkProviderAsync();
            return await Location.hasServicesEnabledAsync();
        } catch {
            return false;
        }
    }

    if (Platform.OS === "ios") {
        showSettingsAlert("Ative os Serviços de Localização nos ajustes do celular para usarmos seu endereço atual.");
    }

    return false;
}

export function ensureLocationAccess() {
    if (!pendingAccessRequest) {
        pendingAccessRequest = checkLocationAccess()
            .catch(() => false)
            .finally(() => {
                pendingAccessRequest = null;
            });
    }

    return pendingAccessRequest;
}

function formatAddress(address: Location.LocationGeocodedAddress) {
    if (address.formattedAddress) {
        return address.formattedAddress;
    }

    const parts = [
        address.street,
        address.streetNumber,
        address.district,
        address.city,
        address.region,
        address.postalCode,
    ].filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index);

    return parts.join(", ");
}

export type CurrentLocation = {
    address: string;
    latitude: number;
    longitude: number;
};

export async function getCurrentLocation(): Promise<CurrentLocation | null> {
    try {
        if (!(await ensureLocationAccess())) {
            return null;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            mayShowUserSettingsDialog: true,
        });
        const [geocodedAddress] = await Location.reverseGeocodeAsync(currentLocation.coords);

        return {
            address: geocodedAddress ? formatAddress(geocodedAddress) : "",
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
        };
    } catch {
        return null;
    }
}

export async function getCurrentAddress() {
    const currentLocation = await getCurrentLocation();
    return currentLocation?.address || null;
}
