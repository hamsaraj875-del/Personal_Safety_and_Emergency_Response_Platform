package com.jaagruth.data.remote

import android.util.Log
import com.google.gson.JsonObject
import com.jaagruth.BuildConfig
import com.jaagruth.model.IncidentBlock
import com.jaagruth.model.LatLng
import com.jaagruth.model.VerifiedResponder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.launch
import okhttp3.*
import java.util.concurrent.TimeUnit

sealed class SocketEvent {
    data class LadderStep(val incidentId: String, val step: Int, val state: String, val secondsRemaining: Int) : SocketEvent()
    data class ResponderAssigned(val incidentId: String, val responder: VerifiedResponder, val explanation: String) : SocketEvent()
    data class IncidentResolved(val incidentId: String, val status: String) : SocketEvent()
    data class LedgerBlockAppended(val block: IncidentBlock) : SocketEvent()
    data class Connected(val isConnected: Boolean) : SocketEvent()
}

object WebSocketClient {
    private const val TAG = "WebSocketClient"
    private var webSocket: WebSocket? = null
    private val gson = NetworkClient.gson

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var reconnectJob: Job? = null
    private var activeSubscribedIncidentId: String? = null
    private var isExplicitDisconnect = false

    private val _events = MutableSharedFlow<SocketEvent>(extraBufferCapacity = 64)
    val events: SharedFlow<SocketEvent> = _events

    private val wsHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .pingInterval(15, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    fun connect() {
        isExplicitDisconnect = false
        val token = TokenStore.getToken() ?: return
        if (webSocket != null) return

        val wsUrl = "${BuildConfig.WS_URL}?token=$token"
        val request = Request.Builder().url(wsUrl).build()

        webSocket = wsHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected successfully.")
                reconnectJob?.cancel()
                _events.tryEmit(SocketEvent.Connected(true))

                activeSubscribedIncidentId?.let { id ->
                    subscribeIncident(id)
                }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val root = gson.fromJson(text, JsonObject::class.java) ?: return
                    val type = root.get("type")?.asString ?: return
                    val payload = root.getAsJsonObject("payload") ?: return

                    when (type) {
                        "ladder.step" -> {
                            val incId = payload.get("incidentId")?.asString ?: ""
                            val step = payload.get("step")?.asInt ?: 1
                            val state = payload.get("state")?.asString ?: "ACTIVE"
                            val rem = payload.get("secondsRemaining")?.asInt ?: 0
                            _events.tryEmit(SocketEvent.LadderStep(incId, step, state, rem))
                        }
                        "responder.assigned" -> {
                            val incId = payload.get("incidentId")?.asString ?: ""
                            val explanation = payload.get("explanation")?.asString ?: ""
                            val responderObj = payload.get("responder")
                            if (responderObj != null && responderObj.isJsonObject) {
                                val resp = gson.fromJson(responderObj, VerifiedResponder::class.java)
                                if (resp != null) {
                                    val safeResp = if (resp.location.lat == 0.0 && resp.location.lng == 0.0) {
                                        resp.copy(location = LatLng(12.9362, 77.5368))
                                    } else {
                                        resp
                                    }
                                    _events.tryEmit(SocketEvent.ResponderAssigned(incId, safeResp, explanation))
                                }
                            }
                        }
                        "incident.resolved" -> {
                            val incId = payload.get("id")?.asString ?: ""
                            val status = payload.get("status")?.asString ?: "RESOLVED"
                            _events.tryEmit(SocketEvent.IncidentResolved(incId, status))
                        }
                        "ledger.block" -> {
                            val block = gson.fromJson(payload, IncidentBlock::class.java)
                            if (block != null) {
                                _events.tryEmit(SocketEvent.LedgerBlockAppended(block))
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing websocket message safely: ${e.message}")
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $reason")
                _events.tryEmit(SocketEvent.Connected(false))
                this@WebSocketClient.webSocket = null
                scheduleReconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.w(TAG, "WebSocket failure: ${t.message}")
                _events.tryEmit(SocketEvent.Connected(false))
                this@WebSocketClient.webSocket = null
                scheduleReconnect()
            }
        })
    }

    private fun scheduleReconnect() {
        if (isExplicitDisconnect) return
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            delay(3000L)
            if (!isExplicitDisconnect && webSocket == null) {
                Log.d(TAG, "Attempting WebSocket reconnection...")
                connect()
            }
        }
    }

    fun subscribeIncident(incidentId: String) {
        activeSubscribedIncidentId = incidentId
        val json = "{\"type\":\"subscribe\",\"incidentId\":\"$incidentId\"}"
        try {
            webSocket?.send(json)
        } catch (e: Exception) {
            // Non-fatal
        }
    }

    fun disconnect() {
        isExplicitDisconnect = true
        reconnectJob?.cancel()
        try {
            webSocket?.close(1000, "App closed")
        } catch (e: Exception) {
            // Ignore
        }
        webSocket = null
    }
}
