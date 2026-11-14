package com.jaagruth.ui.components

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.jaagruth.model.LatLng
import com.jaagruth.model.SafetyHub
import com.jaagruth.model.VerifiedResponder
import com.jaagruth.theme.JagrathPrimaryRed
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline

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
    val context = LocalContext.current

    val mapView = remember {
        Configuration.getInstance().load(context, context.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            zoomController.setVisibility(org.osmdroid.views.CustomZoomButtonsController.Visibility.NEVER)
            controller.setZoom(15.5)
            controller.setCenter(GeoPoint(userPos.lat, userPos.lng))
        }
    }

    DisposableEffect(userPos, responderPos, safetyHubs, routePoints) {
        mapView.overlays.clear()

        // 1. Draw route polyline
        if (routePoints.isNotEmpty()) {
            val polyline = Polyline().apply {
                val geoPoints = routePoints.map { GeoPoint(it.lat, it.lng) }
                setPoints(geoPoints)
                outlinePaint.color = JagrathPrimaryRed.toArgb()
                outlinePaint.strokeWidth = 10f
                outlinePaint.isAntiAlias = true
            }
            mapView.overlays.add(polyline)
        }

        // 2. User marker
        val userMarker = Marker(mapView).apply {
            position = GeoPoint(userPos.lat, userPos.lng)
            title = "You are here"
            snippet = "Live emergency location"
            icon = createTextMarkerDrawable(context, "📍", 42)
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
        }
        mapView.overlays.add(userMarker)

        // 3. Responder marker
        val responderMarker = Marker(mapView).apply {
            position = GeoPoint(responderPos.lat, responderPos.lng)
            title = activeResponder?.name ?: "1st Responder"
            snippet = "${activeResponder?.etaMinutes ?: 4} min ETA"
            icon = createTextMarkerDrawable(context, "🚑", 42)
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
        }
        mapView.overlays.add(responderMarker)

        // 4. Safety Hubs markers
        safetyHubs.forEach { hub ->
            val hubMarker = Marker(mapView).apply {
                position = GeoPoint(hub.location.lat, hub.location.lng)
                title = hub.name
                snippet = "${hub.distanceMeters}m away • ${hub.status}"
                icon = createTextMarkerDrawable(context, hub.icon, 36)
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                setOnMarkerClickListener { _, _ ->
                    onSelectHub(hub)
                    true
                }
            }
            mapView.overlays.add(hubMarker)
        }

        mapView.invalidate()

        onDispose {
            // cleanup if needed
        }
    }

    AndroidView(
        factory = { mapView },
        modifier = modifier.fillMaxSize()
    )
}

private fun createTextMarkerDrawable(context: Context, emoji: String, sizePx: Int): Drawable {
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint().apply {
        textSize = (sizePx * 0.75).toFloat()
        textAlign = Paint.Align.CENTER
        isAntiAlias = true
    }
    val yPos = ((canvas.height / 2) - ((paint.descent() + paint.ascent()) / 2))
    canvas.drawText(emoji, (canvas.width / 2).toFloat(), yPos, paint)
    return BitmapDrawable(context.resources, bitmap)
}
