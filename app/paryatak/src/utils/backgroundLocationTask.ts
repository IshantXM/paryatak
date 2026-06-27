import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import api from './api';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Background Location Error', error);
        return;
    }
    
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && locations.length > 0) {
            const loc = locations[0];
            
            try {
                // We use a silent API call so it does not disturb the frontend user interface if it fails
                await api.post('/trip/location', {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    speed: loc.coords.speed || 0,
                    bearing: loc.coords.heading || 0,
                    accuracy: loc.coords.accuracy || 0,
                    timestamp: new Date(loc.timestamp)
                });
            } catch (err) {
                // If network fails offline, realistically we would store coords locally and sync later.
                console.log('Failed to post background location update');
            }
        }
    }
});
