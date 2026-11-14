package com.jaagruth.ui.components

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.jaagruth.model.LatLng
import com.jaagruth.model.SafetyHub
import com.jaagruth.model.VerifiedResponder
import com.jaagruth.theme.JagrathPrimaryRed
import org.osmdroid.config.Configuration
import org.osmdroid.events.MapListener
import org.osmdroid.events.ScrollEvent
import org.osmdroid.events.ZoomEvent
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.CustomZoomButtonsController
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline

@SuppressLint("ClickableViewAccessibility")
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
    val lifecycleOwner = LocalLifecycleOwner.current
    var currentZoom by remember { mutableDoubleStateOf(15.5) }

    val mapView = remember {
        Configuration.getInstance().load(context, context.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            setBuiltInZoomControls(false)
            zoomController.setVisibility(CustomZoomButtonsController.Visibility.NEVER)
            minZoomLevel = 5.0
            maxZoomLevel = 19.0
            controller.setZoom(15.5)
            controller.setCenter(GeoPoint(userPos.lat, userPos.lng))

            setOnTouchListener { v, _ ->
                v.parent?.requestDisallowInterceptTouchEvent(true)
                false
            }

            addMapListener(object : MapListener {
                override fun onScroll(event: ScrollEvent?): Boolean = false
                override fun onZoom(event: ZoomEvent?): Boolean {
                    event?.zoomLevel?.let { currentZoom = it.toDouble() }
                    return false
                }
            })
        }
    }

    DisposableEffect(lifecycleOwner, mapView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                Lifecycle.Event.ON_DESTROY -> mapView.onDetach()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            mapView.onDetach()
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

    val canZoomIn = currentZoom < 19.0
    val canZoomOut = currentZoom > 5.0

    Box(modifier = modifier) {
        AndroidView(
            factory = { mapView },
            modifier = Modifier.fillMaxSize()
        )

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
            // Zoom In (+)
            Surface(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(enabled = canZoomIn) {
                        if (canZoomIn) {
                            mapView.controller.zoomIn()
                            currentZoom = (currentZoom + 1.0).coerceAtMost(19.0)
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
                            mapView.controller.zoomOut()
                            currentZoom = (currentZoom - 1.0).coerceAtLeast(5.0)
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
