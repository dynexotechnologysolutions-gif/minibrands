"use client";

export interface PreciseCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  confidenceScore: number;
  timestamp: number;
  retries: number;
  durationMs: number;
}

export function getPreciseLocation(
  onProgress?: (msg: string) => void
): Promise<PreciseCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser."));
    }

    const startTime = Date.now();
    const samples: GeolocationPosition[] = [];
    let watchId: number | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    // Timeout guard for the entire operation (15 seconds total)
    let totalTimeoutId: NodeJS.Timeout;

    const stopTracking = (bestPosition: GeolocationPosition) => {
      // Clear total timeout
      clearTimeout(totalTimeoutId);

      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      
      const durationMs = Date.now() - startTime;
      const { latitude, longitude, accuracy } = bestPosition.coords;

      // Calculate confidence score
      let confidenceScore = 50;
      if (accuracy <= 20) {
        // Excellent (95 - 100)
        confidenceScore = Math.round(95 + (20 - accuracy) * 0.25);
      } else if (accuracy <= 50) {
        // Very Good (80 - 94)
        confidenceScore = Math.round(80 + (50 - accuracy) * (14 / 30));
      } else if (accuracy <= 100) {
        // Good (60 - 79)
        confidenceScore = Math.round(60 + (100 - accuracy) * (19 / 50));
      } else {
        // Poor (Below 60)
        confidenceScore = Math.max(10, Math.round(60 - (accuracy - 100) * 0.05));
      }
      confidenceScore = Math.min(100, Math.max(0, confidenceScore));

      const result: PreciseCoordinates = {
        latitude,
        longitude,
        accuracy,
        confidenceScore,
        timestamp: bestPosition.timestamp,
        retries: retryCount,
        durationMs,
      };

      console.log(`[Precise GPS Success] Selected coordinate with accuracy: ${accuracy}m, confidence: ${confidenceScore}%, retries: ${retryCount}, duration: ${durationMs}ms`, result);
      resolve(result);
    };

    const startWatching = () => {
      onProgress?.(`Detecting precise location (Attempt ${retryCount + 1}/${maxRetries})...`);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const acc = position.coords.accuracy;

          // Reject impossible coordinates
          if (lat === 0 && lon === 0) return;
          if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

          console.log(`[GPS Sample ${samples.length + 1}] Lat: ${lat}, Lon: ${lon}, Accuracy: ${acc}m`);
          samples.push(position);

          // Rule 5: Accuracy < 20 meters immediately stops
          if (acc <= 20) {
            stopTracking(position);
            return;
          }

          // If we have collected at least 3 samples and accuracy is acceptable, stop
          if (samples.length >= 3) {
            const best = samples.reduce((prev, curr) =>
              curr.coords.accuracy < prev.coords.accuracy ? curr : prev
            );
            if (best.coords.accuracy <= 50) {
              stopTracking(best);
              return;
            }
          }
        },
        (error) => {
          console.warn("[GPS Position Error]", error);
          handleGPSFailure(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    };

    const handleGPSFailure = (error: GeolocationPositionError) => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }

      if (error.code === error.PERMISSION_DENIED) {
        reject(new Error("Location permission denied. Please allow GPS access in settings."));
        return;
      }

      // Pick the best of any collected samples
      if (samples.length > 0) {
        const best = samples.reduce((prev, curr) =>
          curr.coords.accuracy < prev.coords.accuracy ? curr : prev
        );
        stopTracking(best);
        return;
      }

      if (retryCount < maxRetries) {
        retryCount++;
        onProgress?.(`GPS signal poor. Retrying in 2s (Retry ${retryCount}/${maxRetries})...`);
        setTimeout(() => {
          startWatching();
        }, 2000);
      } else {
        if (error.code === error.TIMEOUT) {
          reject(new Error("GPS request timed out. Move closer to a window or open area."));
        } else {
          reject(new Error("Location detection failed. Move closer to a window or open area."));
        }
      }
    };

    totalTimeoutId = setTimeout(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (samples.length > 0) {
        const best = samples.reduce((prev, curr) =>
          curr.coords.accuracy < prev.coords.accuracy ? curr : prev
        );
        console.log("[GPS Timeout Guard] Stopped watching. Picking best coordinate.");
        stopTracking(best);
      } else {
        reject(new Error("Location request timed out. Move closer to a window or open area."));
      }
    }, 15000);

    startWatching();
  });
}
