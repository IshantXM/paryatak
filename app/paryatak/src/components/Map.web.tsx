import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

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
    style, 
    markers = [], 
    showPolyline = false, 
    polylineCoordinates = [] 
}: MapProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    // Escape JSON strings for iframe embed
    const escapedMarkers = JSON.stringify(markers);
    const escapedPolyline = JSON.stringify(polylineCoordinates);

    // Sync state dynamically when props update without reloading the iframe
    useEffect(() => {
        if (iframeLoaded && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_MAP',
                region,
                markers,
                showPolyline,
                polylineCoordinates
            }, '*');
        }
    }, [iframeLoaded, region.latitude, region.longitude, escapedMarkers, escapedPolyline, showPolyline]);

    const srcDocContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    overflow: hidden;
                    background-color: #0c0520;
                }
                
                /* 3D Perspective Wrapper */
                #map-wrapper {
                    width: 100%;
                    height: 100%;
                    perspective: 1000px;
                    overflow: hidden;
                }

                #map {
                    width: 100%;
                    height: 100%;
                    background-color: #0c0520;
                    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
                    transform-origin: center bottom;
                }

                /* Google-style 3D Tilt perspective class */
                #map.map-tilted {
                    transform: rotateX(32deg) scale(1.18);
                }

                .custom-div-icon {
                    background: transparent;
                    border: none;
                }

                /* Google Maps Pulsing Blue Dot */
                .pulse-marker-start {
                    width: 16px;
                    height: 16px;
                    background-color: #1a73e8;
                    border-radius: 50%;
                    border: 2.5px solid #ffffff;
                    box-shadow: 0 0 10px rgba(26, 115, 232, 0.6);
                    position: relative;
                }
                .pulse-marker-start::after {
                    content: '';
                    position: absolute;
                    top: -10px;
                    left: -10px;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(26, 115, 232, 0.25);
                    animation: pulse 1.8s infinite;
                }

                /* Google Maps Red Location Pin */
                .pulse-marker-dest {
                    width: 20px;
                    height: 20px;
                    background-color: #ea4335;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 2px solid #ffffff;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                }
                .pulse-marker-dest::after {
                    content: '';
                    width: 6px;
                    height: 6px;
                    background: #ffffff;
                    position: absolute;
                    border-radius: 50%;
                    top: 5px;
                    left: 5px;
                }

                @keyframes pulse {
                    0% { transform: scale(0.6); opacity: 0.9; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.6); opacity: 0.9; }
                }

                /* Flat, Accessible Controls Overlay */
                .custom-controls {
                    position: absolute;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none; /* Let pointer events pass through container */
                }
                .custom-controls.top-right {
                    top: 16px;
                    right: 16px;
                }
                .custom-controls.bottom-right {
                    bottom: 24px;
                    right: 16px;
                }
                
                .control-btn {
                    pointer-events: auto; /* Enable clicks on buttons */
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background-color: rgba(25, 18, 48, 0.9);
                    border: 1.5px solid rgba(123, 44, 191, 0.4);
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
                    backdrop-filter: blur(8px);
                }
                .control-btn:hover {
                    background-color: rgba(123, 44, 191, 0.9);
                    border-color: #7b2cbf;
                    transform: scale(1.08);
                    box-shadow: 0 6px 16px rgba(123, 44, 191, 0.5);
                }
                .control-btn:active {
                    transform: scale(0.95);
                }
                .control-btn.active {
                    background-color: #7b2cbf;
                    border-color: #9d4edd;
                    box-shadow: 0 0 12px rgba(123, 44, 191, 0.6);
                }
                .control-btn.hidden {
                    display: none;
                }
                
                .btn-text {
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                }

                /* Layers Control Panel */
                .layer-container {
                    position: relative;
                    pointer-events: auto;
                }
                .layer-panel {
                    position: absolute;
                    top: 0;
                    right: 54px;
                    background: rgba(25, 18, 48, 0.95);
                    border: 1.5px solid rgba(123, 44, 191, 0.4);
                    border-radius: 12px;
                    padding: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                    display: flex;
                    gap: 10px;
                    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                    transform-origin: right center;
                    backdrop-filter: blur(10px);
                }
                .layer-panel.hidden {
                    opacity: 0;
                    transform: scale(0.85) translateX(15px);
                    pointer-events: none;
                }
                
                .layer-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    width: 64px;
                }
                .layer-thumb {
                    width: 52px;
                    height: 52px;
                    border-radius: 8px;
                    border: 2px solid transparent;
                    transition: all 0.2s;
                }
                
                .roadmap-thumb {
                    background: linear-gradient(135deg, #3a225d 0%, #1c0f30 100%);
                    border-color: rgba(255,255,255,0.1);
                }
                .hybrid-thumb {
                    background: linear-gradient(135deg, #104e5b 0%, #08252b 100%);
                    border-color: rgba(255,255,255,0.1);
                }
                .terrain-thumb {
                    background: linear-gradient(135deg, #184b22 0%, #0e2913 100%);
                    border-color: rgba(255,255,255,0.1);
                }

                .layer-option.active .layer-thumb {
                    border-color: #4cc9f0;
                    box-shadow: 0 0 10px rgba(76, 201, 240, 0.6);
                }
                .layer-option span {
                    font-size: 10px;
                    font-weight: 600;
                    color: #ffffff;
                }
            </style>
        </head>
        <body>
            <div id="map-wrapper">
                <div id="map"></div>
            </div>

            <!-- Top Right controls: Layers, 3D, Compass -->
            <div class="custom-controls top-right">
                <div class="layer-container">
                    <button class="control-btn" id="layer-btn" title="Map Layers" onclick="toggleLayerPanel(event)">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                            <polyline points="2 17 12 22 22 17"/>
                            <polyline points="2 12 12 17 22 12"/>
                        </svg>
                    </button>
                    <div id="layer-panel" class="layer-panel hidden">
                        <div class="layer-option active" onclick="setMapLayer('roadmap', this, event)">
                            <div class="layer-thumb roadmap-thumb"></div>
                            <span>Default</span>
                        </div>
                        <div class="layer-option" onclick="setMapLayer('hybrid', this, event)">
                            <div class="layer-thumb hybrid-thumb"></div>
                            <span>Satellite</span>
                        </div>
                        <div class="layer-option" onclick="setMapLayer('terrain', this, event)">
                            <div class="layer-thumb terrain-thumb"></div>
                            <span>Terrain</span>
                        </div>
                    </div>
                </div>

                <button class="control-btn" id="tilt-btn" title="Toggle 3D View" onclick="toggleTilt(event)">
                    <span class="btn-text">3D</span>
                </button>

                <button class="control-btn hidden" id="compass-btn" title="Reset Orientation" onclick="resetCompass(event)">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#4cc9f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 19 21 12 17 5 21 12 2"/>
                    </svg>
                </button>
            </div>

            <!-- Bottom Right controls: Zoom buttons -->
            <div class="custom-controls bottom-right">
                <button class="control-btn zoom-btn" title="Zoom In" onclick="zoomIn(event)">
                    <span class="btn-text" style="font-size: 20px;">+</span>
                </button>
                <button class="control-btn zoom-btn" title="Zoom Out" onclick="zoomOut(event)">
                    <span class="btn-text" style="font-size: 20px;">−</span>
                </button>
            </div>

            <script>
                // Initialize map
                var map = L.map('map', {
                    zoomControl: false,
                    attributionControl: false
                }).setView([${region.latitude}, ${region.longitude}], 13);

                // Define layers
                var activeTileLayer;
                var layers = {
                    roadmap: L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                        maxZoom: 20,
                        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
                    }),
                    hybrid: L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                        maxZoom: 20,
                        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
                    }),
                    terrain: L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
                        maxZoom: 20,
                        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
                    })
                };

                // Add Roadmap layer by default
                activeTileLayer = layers.roadmap;
                activeTileLayer.addTo(map);

                // Start location marker icon (Google Blue Dot)
                var startIcon = L.divIcon({
                    html: '<div class="pulse-marker-start"></div>',
                    className: 'custom-div-icon',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                // Destination marker icon (Google Red Pin)
                var destIcon = L.divIcon({
                    html: '<div class="pulse-marker-dest"></div>',
                    className: 'custom-div-icon',
                    iconSize: [20, 20],
                    iconAnchor: [10, 20]
                });

                var markersLayer = L.layerGroup().addTo(map);
                var polylinePath = null;
                var isTilted = ${showPolyline ? 'true' : 'false'};

                // Set initial tilt if navigation is active
                if (isTilted) {
                    document.getElementById('map').classList.add('map-tilted');
                    var tiltBtn = document.getElementById('tilt-btn');
                    tiltBtn.classList.add('active');
                    tiltBtn.querySelector('.btn-text').innerText = '2D';
                    document.getElementById('compass-btn').classList.remove('hidden');
                }

                function updateMapData(region, markers, showPolyline, polylineCoordinates) {
                    // Clear old markers
                    markersLayer.clearLayers();
                    
                    var latlngs = [];
                    
                    // Render markers
                    markers.forEach(function(m) {
                        var icon = m.id === 'start' ? startIcon : destIcon;
                        L.marker([m.latitude, m.longitude], { icon: icon })
                            .addTo(markersLayer)
                            .bindPopup("<strong>" + m.title + "</strong>");
                        latlngs.push([m.latitude, m.longitude]);
                    });
                    
                    // Clear old polyline
                    if (polylinePath) {
                        map.removeLayer(polylinePath);
                        polylinePath = null;
                    }
                    
                    // Render polyline
                    if (showPolyline && polylineCoordinates.length > 1) {
                        var polyPoints = polylineCoordinates.map(function(pt) { return [pt.latitude, pt.longitude]; });
                        polylinePath = L.polyline(polyPoints, { 
                            color: '#4cc9f0', 
                            weight: 6, 
                            opacity: 0.9
                        }).addTo(map);
                        
                        map.fitBounds(polylinePath.getBounds(), { padding: [40, 40] });
                    } else if (latlngs.length > 0) {
                        map.setView([region.latitude, region.longitude], map.getZoom() || 13);
                    }
                }

                // Initial map populating
                updateMapData(
                    { latitude: ${region.latitude}, longitude: ${region.longitude} },
                    ${escapedMarkers},
                    ${showPolyline ? 'true' : 'false'},
                    ${escapedPolyline}
                );

                // Listen for messages from React Native to dynamically update the map
                var lastShowPolyline = ${showPolyline ? 'true' : 'false'};
                window.addEventListener('message', function(event) {
                    var data = event.data;
                    if (data && data.type === 'UPDATE_MAP') {
                        updateMapData(data.region, data.markers, data.showPolyline, data.polylineCoordinates);
                        
                        // Handle sync of tilt only when navigation state transitioned
                        if (data.showPolyline !== lastShowPolyline) {
                            if (data.showPolyline) {
                                enableTilt();
                            } else {
                                disableTilt();
                            }
                            lastShowPolyline = data.showPolyline;
                        }
                    }
                });

                // Layer selection panel logic
                function toggleLayerPanel(e) {
                    if (e) e.stopPropagation();
                    var panel = document.getElementById('layer-panel');
                    panel.classList.toggle('hidden');
                }

                document.addEventListener('click', function() {
                    document.getElementById('layer-panel').classList.add('hidden');
                });

                function setMapLayer(layerType, element, e) {
                    if (e) e.stopPropagation();
                    
                    map.removeLayer(activeTileLayer);
                    activeTileLayer = layers[layerType];
                    activeTileLayer.addTo(map);
                    
                    // Update layout classes
                    var options = document.querySelectorAll('.layer-option');
                    options.forEach(function(opt) {
                        opt.classList.remove('active');
                    });
                    
                    if (element) {
                        element.classList.add('active');
                    }
                    
                    document.getElementById('layer-panel').classList.add('hidden');
                }

                // 3D Tilt perspective triggers
                function enableTilt() {
                    isTilted = true;
                    document.getElementById('map').classList.add('map-tilted');
                    var tiltBtn = document.getElementById('tilt-btn');
                    tiltBtn.classList.add('active');
                    tiltBtn.querySelector('.btn-text').innerText = '2D';
                    document.getElementById('compass-btn').classList.remove('hidden');
                }

                function disableTilt() {
                    isTilted = false;
                    document.getElementById('map').classList.remove('map-tilted');
                    var tiltBtn = document.getElementById('tilt-btn');
                    tiltBtn.classList.remove('active');
                    tiltBtn.querySelector('.btn-text').innerText = '3D';
                    document.getElementById('compass-btn').classList.add('hidden');
                }

                function toggleTilt(e) {
                    if (e) e.stopPropagation();
                    if (isTilted) {
                        disableTilt();
                    } else {
                        enableTilt();
                    }
                }

                // Compass reset orientation & tilt
                function resetCompass(e) {
                    if (e) e.stopPropagation();
                    disableTilt();
                    
                    // Recenter to bounds or markers
                    if (polylinePath) {
                        map.fitBounds(polylinePath.getBounds(), { padding: [40, 40] });
                    } else {
                        map.setView([${region.latitude}, ${region.longitude}], 14);
                    }
                }

                // Zoom actions
                function zoomIn(e) {
                    if (e) e.stopPropagation();
                    map.zoomIn();
                }

                // Zoom out
                function zoomOut(e) {
                    if (e) e.stopPropagation();
                    map.zoomOut();
                }
            </script>
        </body>
        </html>
    `;

    return (
        <View style={[style, styles.container]}>
            <iframe
                ref={iframeRef}
                onLoad={() => setIframeLoaded(true)}
                title="Tactical Navigation Map"
                width="100%"
                height="100%"
                style={{ 
                    border: 0, 
                    borderRadius: 16,
                }}
                srcDoc={srcDocContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0c0520',
        borderRadius: 16,
        overflow: 'hidden',
    }
});
