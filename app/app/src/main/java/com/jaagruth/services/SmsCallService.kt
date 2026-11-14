package com.jaagruth.services

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SmsCallService(private val context: Context) {

    fun dialEmergency112() {
        dialNumber("112")
    }

    fun dialNumber(phoneNumber: String) {
        try {
            val intent = Intent(Intent.ACTION_DIAL).apply {
                data = Uri.parse("tel:${phoneNumber.trim()}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Unable to launch phone dialer: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun prepareEmergencySms(
        phoneNumber: String,
        userName: String,
        latitude: Double,
        longitude: Double,
        incidentId: String
    ) {
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        val currentTime = timeFormat.format(Date())

        val body = """
            JAAGRUTH SOS from $userName.
            Need help.
            Location: https://maps.google.com/?q=$latitude,$longitude
            Time: $currentTime
            Incident: $incidentId
        """.trimIndent()

        try {
            val intent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("smsto:${phoneNumber.trim()}")
                putExtra("sms_body", body)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Unable to open messaging app: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
}
