package com.jaagruth.ui.components

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.jaagruth.model.LatLng
import com.jaagruth.model.SafetyHub
import com.jaagruth.model.VerifiedResponder

private const val GOOGLE_MAPS_API_KEY = "AIzaSyC77L9nFquGR6g2Lfzys60O7fxqgVTcMDs"

@SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
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
    val mainHandler = remember { Handler(Looper.getMainLooper()) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    val routeJson = remember(routePoints) {
        routePoints.joinToString(prefix = "[", postfix = "]") { "{lat:${it.lat},lng:${it.lng}}" }
    }

    val hubsJson = remember(safetyHubs) {
        safetyHubs.joinToString(prefix = "[", postfix = "]") { hub ->
            """{"id":"${hub.id}","name":"${hub.name.replace("\"", "\\\"")}","icon":"${hub.icon}","lat":${hub.location.lat},"lng":${hub.location.lng}}"""
        }
    }

    val htmlContent = remember(userPos, responderPos, routeJson, hubsJson) {
        buildGoogleMapsHtml(
            apiKey = GOOGLE_MAPS_API_KEY,
            userLat = userPos.lat,
            userLng = userPos.lng,
            respLat = responderPos.lat,
            respLng = responderPos.lng,
            respName = activeResponder?.name ?: "1st Responder",
            routeJson = routeJson,
            hubsJson = hubsJson
        )
    }

    // Dynamic position updates without reloading entire page
    LaunchedEffect(responderPos) {
        webViewRef?.evaluateJavascript(
            "if(window.updateResponder) window.updateResponder(${responderPos.lat}, ${responderPos.lng});",
            null
        )
    }

    LaunchedEffect(userPos) {
        webViewRef?.evaluateJavascript(
            "if(window.updateUser) window.updateUser(${userPos.lat}, ${userPos.lng});",
            null
        )
    }

    Box(modifier = modifier) {
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )

                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        setSupportZoom(false)
                        cacheMode = WebSettings.LOAD_DEFAULT
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    }

                    addJavascriptInterface(
                        object {
                            @JavascriptInterface
                            fun onHubClicked(hubId: String) {
                                mainHandler.post {
                                    val matched = safetyHubs.find { it.id == hubId }
                                    if (matched != null) {
                                        onSelectHub(matched)
                                    }
                                }
                            }
                        },
                        "AndroidInterface"
                    )

                    webViewClient = WebViewClient()

                    setOnTouchListener { v, _ ->
                        v.parent?.requestDisallowInterceptTouchEvent(true)
                        false
                    }

                    loadDataWithBaseURL("https://localhost", htmlContent, "text/html", "UTF-8", null)
                    webViewRef = this
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        DisposableEffect(Unit) {
            onDispose {
                webViewRef?.destroy()
                webViewRef = null
            }
        }

        // Semi-transparent dark badge showing nearest facility
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

        // Floating Zoom In / Zoom Out Controls (+ / −)
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
                    .clickable {
                        webViewRef?.evaluateJavascript("if(window.zoomIn) window.zoomIn();", null)
                    },
                shape = RoundedCornerShape(8.dp),
                color = Color(0xEE0F172A),
                border = BorderStroke(1.dp, Color(0x44FFFFFF)),
                shadowElevation = 4.dp
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(
                        text = "+",
                        color = Color.White,
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
                    .clickable {
                        webViewRef?.evaluateJavascript("if(window.zoomOut) window.zoomOut();", null)
                    },
                shape = RoundedCornerShape(8.dp),
                color = Color(0xEE0F172A),
                border = BorderStroke(1.dp, Color(0x44FFFFFF)),
                shadowElevation = 4.dp
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(
                        text = "−",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

private fun buildGoogleMapsHtml(
    apiKey: String,
    userLat: Double,
    userLng: Double,
    respLat: Double,
    respLng: Double,
    respName: String,
    routeJson: String,
    hubsJson: String
): String {
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body, #map { width: 100%; height: 100%; background: #f8fafc; overflow: hidden; }
            </style>
            <script src="https://maps.googleapis.com/maps/api/js?key=$apiKey&libraries=geometry"></script>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map;
                var userMarker;
                var respMarker;
                var polyline;

                function initMap() {
                    var userLoc = { lat: $userLat, lng: $userLng };
                    var respLoc = { lat: $respLat, lng: $respLng };

                    map = new google.maps.Map(document.getElementById('map'), {
                        center: userLoc,
                        zoom: 15,
                        disableDefaultUI: true,
                        zoomControl: false,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        gestureHandling: 'greedy'
                    });

                    // 1. Draw emergency route
                    var routePoints = $routeJson;
                    if (routePoints && routePoints.length > 0) {
                        polyline = new google.maps.Polyline({
                            path: routePoints,
                            geodesic: true,
                            strokeColor: '#EA3B52',
                            strokeOpacity: 0.9,
                            strokeWeight: 6,
                            map: map
                        });
                    }

                    // 2. User Location Marker (Red Pin with pulse)
                    userMarker = new google.maps.Marker({
                        position: userLoc,
                        map: map,
                        title: "You are here",
                        zIndex: 200,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 9,
                            fillColor: '#EA3B52',
                            fillOpacity: 1,
                            strokeColor: '#FFFFFF',
                            strokeWeight: 3
                        }
                    });

                    // 3. Responder Marker (Ambulance emoji)
                    respMarker = new google.maps.Marker({
                        position: respLoc,
                        map: map,
                        title: "${respName.replace("\"", "\\\"")}",
                        zIndex: 210,
                        label: {
                            text: '🚑',
                            fontSize: '24px'
                        }
                    });

                    // 4. Safety Hubs Markers
                    var hubs = $hubsJson;
                    if (hubs && hubs.length > 0) {
                        hubs.forEach(function(hub) {
                            var m = new google.maps.Marker({
                                position: { lat: hub.lat, lng: hub.lng },
                                map: map,
                                title: hub.name,
                                zIndex: 150,
                                label: {
                                    text: hub.icon || '🏥',
                                    fontSize: '18px'
                                }
                            });
                            m.addListener('click', function() {
                                if (window.AndroidInterface) {
                                    window.AndroidInterface.onHubClicked(hub.id);
                                }
                            });
                        });
                    }
                }

                window.zoomIn = function() {
                    if (map) map.setZoom(map.getZoom() + 1);
                };

                window.zoomOut = function() {
                    if (map) map.setZoom(map.getZoom() - 1);
                };

                window.updateResponder = function(lat, lng) {
                    if (respMarker) respMarker.setPosition({ lat: lat, lng: lng });
                };

                window.updateUser = function(lat, lng) {
                    if (userMarker) userMarker.setPosition({ lat: lat, lng: lng });
                };

                window.onload = initMap;
            </script>
        </body>
        </html>
    """.trimIndent()
}
