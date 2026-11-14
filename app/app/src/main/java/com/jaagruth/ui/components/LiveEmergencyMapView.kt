package com.jaagruth.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng as GmsLatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.MapType
import com.google.maps.android.compose.MapUiSettings
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.Polyline
import com.google.maps.android.compose.rememberCameraPositionState
import com.jaagruth.model.LatLng
import com.jaagruth.model.SafetyHub
import com.jaagruth.model.VerifiedResponder
import com.jaagruth.theme.JagrathPrimaryRed

@Composable
fun LiveEmergencyMapView(
    userPos: LatLng,
    responderPos: LatLng,
    safetyHubs: List<SafetyHub>,
    routePoints: List<LatLng>,
    activeResponder: VerifiedResponder?,
    onSelectHub: (SafetyHub) -> Unit,
    modifier: Modifier = Modifier
) {
    var currentZoom by remember { mutableFloatStateOf(15.5f) }

    val userGmsLatLng = GmsLatLng(userPos.lat, userPos.lng)

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(userGmsLatLng, 15.5f)
    }

    // Re-center camera when user position changes
    LaunchedEffect(userPos) {
        cameraPositionState.animate(
            CameraUpdateFactory.newLatLngZoom(userGmsLatLng, cameraPositionState.position.zoom)
        )
    }

    val mapProperties = remember {
        MapProperties(
            mapType = MapType.NORMAL,
            isMyLocationEnabled = false,
            minZoomPreference = 5f,
            maxZoomPreference = 19f
        )
    }

    val uiSettings = remember {
        MapUiSettings(
            zoomControlsEnabled = false,
            myLocationButtonEnabled = false,
            mapToolbarEnabled = false,
            compassEnabled = false
        )
    }

    Box(modifier = modifier) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            properties = mapProperties,
            uiSettings = uiSettings
        ) {
            // 1. Draw route polyline
            if (routePoints.isNotEmpty()) {
                Polyline(
                    points = routePoints.map { GmsLatLng(it.lat, it.lng) },
                    color = JagrathPrimaryRed,
                    width = 10f
                )
            }

            // 2. User marker
            Marker(
                state = MarkerState(position = userGmsLatLng),
                title = "You are here",
                snippet = "Live emergency location",
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
            )

            // 3. Responder marker
            Marker(
                state = MarkerState(position = GmsLatLng(responderPos.lat, responderPos.lng)),
                title = activeResponder?.name ?: "1st Responder",
                snippet = "${activeResponder?.etaMinutes ?: 4} min ETA",
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)
            )

            // 4. Safety Hub markers
            safetyHubs.forEach { hub ->
                Marker(
                    state = MarkerState(position = GmsLatLng(hub.location.lat, hub.location.lng)),
                    title = hub.name,
                    snippet = "${hub.distanceMeters}m away • ${hub.status}",
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN),
                    onClick = {
                        onSelectHub(hub)
                        true
                    }
                )
            }
        }

        // Semi-transparent dark background behind bottom-start safety hub label
        val primaryHub = safetyHubs.firstOrNull { it.type == "hospital" } ?: safetyHubs.firstOrNull()
        if (primaryHub != null) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 10.dp, bottom = 10.dp),
                shape = RoundedCornerShape(8.dp),
                color = Color(0xDD0F172A),
                border = BorderStroke(1.dp, Color(0x33FFFFFF))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = primaryHub.icon, fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${primaryHub.shortName} • ${primaryHub.distanceMeters}m",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        // On-map Zoom In / Zoom Out Controls (+ / −)
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 10.dp, bottom = 10.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            val canZoomIn = cameraPositionState.position.zoom < 19f
            val canZoomOut = cameraPositionState.position.zoom > 5f

            // Zoom In (+)
            Surface(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(enabled = canZoomIn) {
                        if (canZoomIn) {
                            val newZoom = (cameraPositionState.position.zoom + 1f).coerceAtMost(19f)
                            cameraPositionState.move(CameraUpdateFactory.zoomTo(newZoom))
                        }
                    },
                shape = RoundedCornerShape(8.dp),
                color = if (canZoomIn) Color(0xEE0F172A) else Color(0x660F172A),
                border = BorderStroke(
                    1.dp,
                    if (canZoomIn) Color(0x44FFFFFF) else Color(0x1FFFFFFF)
                ),
                shadowElevation = 4.dp
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(
                        text = "+",
                        color = if (canZoomIn) Color.White else Color(0x66FFFFFF),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Zoom Out (−)
            Surface(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(enabled = canZoomOut) {
                        if (canZoomOut) {
                            val newZoom = (cameraPositionState.position.zoom - 1f).coerceAtLeast(5f)
                            cameraPositionState.move(CameraUpdateFactory.zoomTo(newZoom))
                        }
                    },
                shape = RoundedCornerShape(8.dp),
                color = if (canZoomOut) Color(0xEE0F172A) else Color(0x660F172A),
                border = BorderStroke(
                    1.dp,
                    if (canZoomOut) Color(0x44FFFFFF) else Color(0x1FFFFFFF)
                ),
                shadowElevation = 4.dp
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(
                        text = "−",
                        color = if (canZoomOut) Color.White else Color(0x66FFFFFF),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
