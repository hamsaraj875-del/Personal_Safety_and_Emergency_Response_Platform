package com.jaagruth.data.remote

import com.google.gson.annotations.SerializedName
import com.jaagruth.model.*
import retrofit2.Response
import retrofit2.http.*

// Request & Response DTOs
data class RegisterRequest(
    val name: String,
    val phone: String,
    val email: String,
    val password: String,
    val bloodGroup: String? = null,
    val emergencyNotes: String? = null
)

data class LoginRequest(
    val emailOrPhone: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val user: ServerUserDto
)

data class ServerUserDto(
    val id: String,
    val name: String,
    val phone: String,
    val email: String,
    val avatar: String? = null,
    val bloodGroup: String? = null,
    val emergencyNotes: String? = null,
    val address: String? = null,
    val role: String,
    val settings: UserSettingsDto? = null
)

data class UserSettingsDto(
    val demoMode: Boolean = true,
    val escalationSpeed: String = "FAST"
)

data class UpdatePinsRequest(
    val safetyPin: String,
    val duressPin: String
)

data class DeviceTokenRequest(
    val token: String,
    val platform: String = "android"
)

data class CreateContactRequest(
    val name: String,
    val phone: String,
    val relation: String,
    val priority: Int
)

data class ReorderContactsRequest(
    val contactIds: List<String>
)

data class ContactsListResponse(
    val contacts: List<ServerContactDto>
)

data class ServerContactDto(
    val id: String,
    val name: String,
    val phone: String,
    val relation: String,
    val priority: Int,
    val avatar: String? = null,
    val status: String? = null
)

data class CreateIncidentRequest(
    val lat: Double,
    val lng: Double,
    val address: String? = null,
    val clientId: String? = null,
    val offline: Boolean = false,
    val createdAtClient: String? = null,
    val speedProfile: String = "FAST"
)

data class IncidentResponse(
    val incident: ServerIncidentDto
)

data class ServerIncidentDto(
    val id: String,
    val code: String,
    val userId: String,
    val userName: String,
    val userPhone: String,
    val status: String,
    val mode: String,
    val duress: Boolean,
    val severity: Int,
    val category: String,
    val location: LocationPointDto,
    val address: String,
    val trackingToken: String,
    val speedProfile: String,
    val ladder: ServerLadderDto? = null,
    val assignedResponderId: String? = null,
    val assignedResponder: VerifiedResponder? = null,
    val rankedResponders: List<VerifiedResponder>? = null,
    val falseAlarmKind: String? = null,
    val resolvedAt: String? = null,
    val resolvedOutcome: String? = null,
    val createdAt: String,
    val updatedAt: String
)

data class LocationPointDto(
    val type: String = "Point",
    val coordinates: List<Double> // [lng, lat]
)

data class ServerLadderDto(
    val step: Int,
    val nextStepAt: String? = null,
    val steps: List<ServerLadderStepDto>? = null
)

data class ServerLadderStepDto(
    val index: Int,
    val title: String,
    val state: String,
    val startedAt: String? = null
)

data class ResolveIncidentRequest(
    val pin: String,
    val outcome: String = "SAFE"
)

data class ResolveResponse(
    val status: String,
    val incidentId: String,
    val resolvedAt: String,
    val outcome: String,
    val message: String
)

data class LocationPingRequest(
    val lat: Double,
    val lng: Double,
    val speed: Double? = null,
    val battery: Int? = null,
    val accuracy: Double? = null
)

data class RespondersListResponse(
    val responders: List<VerifiedResponder>
)

data class SafetyHubsListResponse(
    val hubs: List<SafetyHub>
)

data class LedgerResponse(
    val blocks: List<IncidentBlock>
)

data class SyncIncidentsRequest(
    val incidents: List<CreateIncidentRequest>
)

data class SyncIncidentsResponse(
    val synced: List<ServerIncidentDto>,
    val count: Int
)

interface ApiService {
    // Auth
    @POST("auth/register")
    suspend fun register(@Body req: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body req: LoginRequest): Response<AuthResponse>

    // User Profile
    @GET("me")
    suspend fun getProfile(): Response<ServerUserDto>

    @PATCH("me")
    suspend fun updateProfile(@Body fields: Map<String, Any>): Response<ServerUserDto>

    @PUT("me/pins")
    suspend fun updatePins(@Body req: UpdatePinsRequest): Response<Map<String, Any>>

    @POST("me/device-token")
    suspend fun registerDeviceToken(@Body req: DeviceTokenRequest): Response<Map<String, Any>>

    // Contacts
    @GET("contacts")
    suspend fun getContacts(): Response<ContactsListResponse>

    @POST("contacts")
    suspend fun createContact(@Body req: CreateContactRequest): Response<ServerContactDto>

    @PUT("contacts/{id}")
    suspend fun updateContact(@Path("id") id: String, @Body req: CreateContactRequest): Response<ServerContactDto>

    @DELETE("contacts/{id}")
    suspend fun deleteContact(@Path("id") id: String): Response<Map<String, Any>>

    @PUT("contacts/reorder")
    suspend fun reorderContacts(@Body req: ReorderContactsRequest): Response<ContactsListResponse>

    // Incidents
    @POST("incidents")
    suspend fun createIncident(@Body req: CreateIncidentRequest): Response<IncidentResponse>

    @GET("incidents/active")
    suspend fun getActiveIncident(): Response<IncidentResponse>

    @GET("incidents/{id}")
    suspend fun getIncident(@Path("id") id: String): Response<IncidentResponse>

    @POST("incidents/{id}/cancel")
    suspend fun cancelIncident(@Path("id") id: String): Response<IncidentResponse>

    @POST("incidents/{id}/resolve")
    suspend fun resolveIncident(@Path("id") id: String, @Body req: ResolveIncidentRequest): Response<ResolveResponse>

    @POST("incidents/{id}/location")
    suspend fun sendLocationPing(@Path("id") id: String, @Body req: LocationPingRequest): Response<Map<String, Any>>

    @GET("incidents/{id}/ledger")
    suspend fun getLedger(@Path("id") id: String): Response<LedgerResponse>

    @GET("incidents/{id}/ledger/verify")
    suspend fun verifyLedger(@Path("id") id: String): Response<VerificationResult>

    @POST("incidents/sync")
    suspend fun syncOfflineIncidents(@Body req: SyncIncidentsRequest): Response<SyncIncidentsResponse>

    // Responders & Hubs
    @GET("responders/nearby")
    suspend fun getNearbyResponders(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("category") category: String? = null,
        @Query("radiusKm") radiusKm: Double? = 10.0
    ): Response<RespondersListResponse>

    @GET("hubs/nearby")
    suspend fun getNearbyHubs(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radiusMeters") radiusMeters: Int? = 5000
    ): Response<SafetyHubsListResponse>

    // Demo Tamper / Restore
    @POST("demo/incidents/{id}/tamper")
    suspend fun tamperBlock(@Path("id") id: String, @Body body: Map<String, Int>): Response<Map<String, Any>>

    @POST("demo/incidents/{id}/restore")
    suspend fun restoreBlock(@Path("id") id: String, @Body body: Map<String, Int>): Response<Map<String, Any>>
}
