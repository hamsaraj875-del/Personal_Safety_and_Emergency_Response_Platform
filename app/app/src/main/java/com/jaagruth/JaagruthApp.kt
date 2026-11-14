package com.jaagruth

import android.app.Application
import com.jaagruth.data.repository.AuthRepository
import com.jaagruth.data.repository.ContactRepository
import com.jaagruth.data.repository.IncidentRepository
import com.jaagruth.data.repository.ResponderRepository
import com.jaagruth.services.EscalationEngine
import com.jaagruth.services.LocationService
import com.jaagruth.services.NotificationService
import com.jaagruth.services.SmsCallService

class JaagruthApp : Application() {

    lateinit var authRepository: AuthRepository
        private set
    lateinit var contactRepository: ContactRepository
        private set
    lateinit var responderRepository: ResponderRepository
        private set
    lateinit var incidentRepository: IncidentRepository
        private set
    lateinit var locationService: LocationService
        private set
    lateinit var notificationService: NotificationService
        private set
    lateinit var smsCallService: SmsCallService
        private set
    lateinit var escalationEngine: EscalationEngine
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize repositories and services (Manual Dependency Injection)
        authRepository = AuthRepository(this)
        contactRepository = ContactRepository(this)
        responderRepository = ResponderRepository()
        incidentRepository = IncidentRepository(this)
        locationService = LocationService(this)
        notificationService = NotificationService(this)
        smsCallService = SmsCallService(this)

        escalationEngine = EscalationEngine(
            incidentRepository = incidentRepository,
            contactRepository = contactRepository,
            responderRepository = responderRepository,
            notificationService = notificationService,
            smsCallService = smsCallService
        )
    }

    companion object {
        lateinit var instance: JaagruthApp
            private set
    }
}
