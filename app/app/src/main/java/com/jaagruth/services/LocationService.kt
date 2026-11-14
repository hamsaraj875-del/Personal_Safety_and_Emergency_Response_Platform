package com.jaagruth.services

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.os.Looper
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.jaagruth.data.local.MockDataSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.math.abs

class LocationService(private val context: Context) {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private val locationScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    data class LocationState(
        val latitude: Double = MockDataSource.DEFAULT_LATITUDE,
        val longitude: Double = MockDataSource.DEFAULT_LONGITUDE,
        val address: String = MockDataSource.DEFAULT_ADDRESS,
        val isFallback: Boolean = true,
        val isGpsActive: Boolean = false,
        val lastUpdatedTime: Long = System.currentTimeMillis()
    )

    private val _locationState = MutableStateFlow(LocationState())
    val locationState: StateFlow<LocationState> = _locationState.asStateFlow()

    private var isTracking = false
    private var lastGeocodedLat = 0.0
    private var lastGeocodedLng = 0.0

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                updateFromLocation(location)
            }
        }
    }

    fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
        return fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED
    }

    @SuppressLint("MissingPermission")
    fun refreshCurrentLocation(onComplete: ((LocationState) -> Unit)? = null) {
        if (!hasLocationPermission()) {
            useFallbackLocation("Permission not granted")
            onComplete?.invoke(_locationState.value)
            return
        }

        try {
            fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
                if (location != null) {
                    updateFromLocation(location)
                } else {
                    requestSingleUpdate()
                }
                onComplete?.invoke(_locationState.value)
            }.addOnFailureListener {
                useFallbackLocation("Location request failed")
                onComplete?.invoke(_locationState.value)
            }
        } catch (e: Exception) {
            useFallbackLocation(e.localizedMessage ?: "Unknown location error")
            onComplete?.invoke(_locationState.value)
        }
    }

    @SuppressLint("MissingPermission")
    fun startEmergencyTracking() {
        if (isTracking || !hasLocationPermission()) return

        // Throttle updates to 5-second interval with min 3-second interval
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setMinUpdateIntervalMillis(3000L)
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
            isTracking = true
        } catch (e: Exception) {
            isTracking = false
        }
    }

    fun stopEmergencyTracking() {
        if (!isTracking) return
        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        } catch (e: Exception) {
            // Ignore
        } finally {
            isTracking = false
        }
    }

    @SuppressLint("MissingPermission")
    private fun requestSingleUpdate() {
        if (!hasLocationPermission()) return
        val singleRequest = LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 1000L)
            .setMaxUpdates(1)
            .build()
        try {
            fusedLocationClient.requestLocationUpdates(singleRequest, locationCallback, Looper.getMainLooper())
        } catch (e: Exception) {
            useFallbackLocation("Single update failed")
        }
    }

    private fun updateFromLocation(location: Location) {
        val current = _locationState.value

        // Only update state if coordinates have actually changed
        val latChanged = abs(current.latitude - location.latitude) > 0.00001
        val lngChanged = abs(current.longitude - location.longitude) > 0.00001

        if (!latChanged && !lngChanged && current.isGpsActive) {
            return
        }

        // Immediately update coordinates on the main thread without blocking for geocoder
        _locationState.value = LocationState(
            latitude = location.latitude,
            longitude = location.longitude,
            address = current.address,
            isFallback = false,
            isGpsActive = true,
            lastUpdatedTime = System.currentTimeMillis()
        )

        // Asynchronously resolve human-readable address on Dispatchers.IO only when moved > 50 meters
        val distanceMoved = abs(lastGeocodedLat - location.latitude) + abs(lastGeocodedLng - location.longitude)
        if (distanceMoved > 0.0005 || current.address.contains("Bengaluru")) {
            lastGeocodedLat = location.latitude
            lastGeocodedLng = location.longitude

            locationScope.launch {
                val resolved = resolveAddressAsync(location.latitude, location.longitude)
                if (resolved != _locationState.value.address) {
                    _locationState.value = _locationState.value.copy(address = resolved)
                }
            }
        }
    }

    private fun useFallbackLocation(reason: String) {
        _locationState.value = LocationState(
            latitude = MockDataSource.DEFAULT_LATITUDE,
            longitude = MockDataSource.DEFAULT_LONGITUDE,
            address = "${MockDataSource.DEFAULT_ADDRESS} ($reason)",
            isFallback = true,
            isGpsActive = false,
            lastUpdatedTime = System.currentTimeMillis()
        )
    }

    private suspend fun resolveAddressAsync(lat: Double, lng: Double): String = withContext(Dispatchers.IO) {
        return@withContext try {
            val geocoder = Geocoder(context, Locale.getDefault())
            val addresses = geocoder.getFromLocation(lat, lng, 1)
            if (!addresses.isNullOrEmpty()) {
                val addr = addresses[0]
                val line = addr.getAddressLine(0)
                line ?: "${addr.locality ?: "Bengaluru"}, ${addr.adminArea ?: "Karnataka"}"
            } else {
                String.format(Locale.US, "%.4f, %.4f (Bengaluru)", lat, lng)
            }
        } catch (e: Exception) {
            String.format(Locale.US, "%.4f, %.4f (Bengaluru)", lat, lng)
        }
    }
}
