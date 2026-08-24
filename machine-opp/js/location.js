// Location-based access control utility
const LocationCheck = (function() {
    const FIXED_LAT = 9.0181083;
    const FIXED_LNG = 38.8414501;
    const ALLOWED_RADIUS_KM = 0.500; // 500 meters

    // Haversine formula: returns distance in km
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async function checkLocation() {
        return {success: true, distance: 0};

        return new Promise((resolve) => {
            if (!('geolocation' in navigator)) {
                resolve({ success: false, error: 'Geolocation not supported by this browser.' });
                return;
            }

            const options = {
                timeout: 8000,
                maximumAge: 0,
            };

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const distKm = haversineDistance(lat, lng, FIXED_LAT, FIXED_LNG);
                    
                    if (distKm <= ALLOWED_RADIUS_KM) {
                        resolve({ success: true, distance: distKm });
                    } else {
                        resolve({ 
                            success: false, 
                            distance: distKm,
                            error: `Location too far: ${(distKm * 1000).toFixed(0)}m from reference (must be ≤ 500m)` 
                        });
                    }
                },
                (err) => {
                    let msg = 'Location error: ';
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            msg += 'Permission denied. Please allow location access.';
                            break;
                        case err.POSITION_UNAVAILABLE:
                            msg += 'Signal unavailable. Try again outdoors.';
                            break;
                        case err.TIMEOUT:
                            msg += 'Request timed out. Retry.';
                            break;
                        default:
                            msg += err.message;
                    }
                    resolve({ success: false, error: msg });
                },
                options
            );
        });
    }

    return {
        checkLocation
    };
})();
