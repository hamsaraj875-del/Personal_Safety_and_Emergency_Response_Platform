package com.jaagruth.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.jaagruth.MainActivity
import com.jaagruth.R

class NotificationService(private val context: Context) {

    private val notificationManager = NotificationManagerCompat.from(context)

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val emergencyChannel = NotificationChannel(
                CHANNEL_EMERGENCY,
                "Jaagruth Emergency Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical SOS emergency alerts and status updates"
                enableVibration(true)
            }

            val escalationChannel = NotificationChannel(
                CHANNEL_ESCALATION,
                "Jaagruth Escalation Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Updates on contact notification and responder dispatch"
            }

            val systemManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            systemManager.createNotificationChannel(emergencyChannel)
            systemManager.createNotificationChannel(escalationChannel)
        }
    }

    fun showEmergencyTriggered(incidentId: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val logoBitmap = try {
            BitmapFactory.decodeResource(context.resources, R.drawable.ic_jaagruth_logo)
        } catch (e: Exception) {
            null
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_EMERGENCY)
            .setSmallIcon(R.drawable.ic_shield)
            .apply { if (logoBitmap != null) setLargeIcon(logoBitmap) }
            .setContentTitle("🚨 Jaagruth SOS Activated!")
            .setContentText("Emergency incident #$incidentId is active. Alerting contacts…")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setContentIntent(pendingIntent)
            .setAutoCancel(false)
            .setOngoing(true)
            .build()

        try {
            notificationManager.notify(NOTIFICATION_ID_ACTIVE, notification)
        } catch (e: SecurityException) {
            // Notification permission might be withheld
        }
    }

    fun showEscalationAlert(title: String, message: String) {
        val logoBitmap = try {
            BitmapFactory.decodeResource(context.resources, R.drawable.ic_jaagruth_logo)
        } catch (e: Exception) {
            null
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ESCALATION)
            .setSmallIcon(R.drawable.ic_shield)
            .apply { if (logoBitmap != null) setLargeIcon(logoBitmap) }
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()

        try {
            notificationManager.notify(System.currentTimeMillis().toInt(), notification)
        } catch (e: SecurityException) {
            // Notification permission might be withheld
        }
    }

    fun cancelActiveNotification() {
        notificationManager.cancel(NOTIFICATION_ID_ACTIVE)
    }

    companion object {
        const val CHANNEL_EMERGENCY = "jaagruth_emergency"
        const val CHANNEL_ESCALATION = "jaagruth_escalation"
        private const val NOTIFICATION_ID_ACTIVE = 1001
    }
}
