import React from 'react';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

export type MarkerData = {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    color?: string;
};

type MapProps = {
    region: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    onRegionChangeComplete?: (region: any) => void;
    customMapStyle?: any[];
    style?: any;
    markers?: MarkerData[];
    showPolyline?: boolean;
    polylineCoordinates?: { latitude: number; longitude: number }[];
};

export default function CustomMap({ 
    region, 
    onRegionChangeComplete, 
    customMapStyle, 
    style, 
    markers = [], 
    showPolyline = false, 
    polylineCoordinates = [] 
}: MapProps) {
    return (
        <MapView
            provider={PROVIDER_DEFAULT}
            style={style}
            customMapStyle={customMapStyle}
            region={region}
            onRegionChangeComplete={onRegionChangeComplete}
        >
            {markers.map((m) => (
                <Marker 
                    key={m.id} 
                    coordinate={{ latitude: m.latitude, longitude: m.longitude }} 
                    title={m.title} 
                    pinColor={m.color} 
                />
            ))}
            {showPolyline && polylineCoordinates.length > 1 && (
                <Polyline 
                    coordinates={polylineCoordinates} 
                    strokeColor="#4cc9f0" 
                    strokeWidth={4} 
                />
            )}
        </MapView>
    );
}
