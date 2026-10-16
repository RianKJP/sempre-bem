import type { ReactElement } from "react";

export type RequestMapProps = {
    controlsTopOffset?: number;
    hasCurrentLocation: boolean;
    latitude: number;
    longitude: number;
};

export declare function RequestMap(props: RequestMapProps): ReactElement;
