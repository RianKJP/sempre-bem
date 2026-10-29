import type { ReactElement } from "react";

export type RequestMapProps = {
    controlsTopOffset?: number;
    hasCurrentLocation: boolean;
    latitude: number;
    longitude: number;
    providerLatitude?: number | null;
    providerLongitude?: number | null;
    routeDashed?: boolean;
    showProviderRoute?: boolean;
};

export declare function RequestMap(props: RequestMapProps): ReactElement;
