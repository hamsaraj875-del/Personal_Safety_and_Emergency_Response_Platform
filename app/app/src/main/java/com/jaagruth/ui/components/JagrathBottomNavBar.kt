package com.jaagruth.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jaagruth.theme.JagrathCrimson
import com.jaagruth.theme.Slate200
import com.jaagruth.theme.Slate400
import com.jaagruth.theme.Slate600
import com.jaagruth.theme.White

enum class MainTab(val title: String) {
    HOME("Home"),
    ACTIVITY("Activity"),
    CONTACTS("Contacts"),
    PROFILE("Profile")
}

@Composable
fun JagrathBottomNavBar(
    activeTab: MainTab,
    onTabSelected: (MainTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(elevation = 12.dp, shape = CircleShape),
            shape = CircleShape,
            color = White,
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                NavBarItem(
                    tab = MainTab.HOME,
                    icon = Icons.Default.Home,
                    isActive = activeTab == MainTab.HOME,
                    onClick = { onTabSelected(MainTab.HOME) }
                )
                NavBarItem(
                    tab = MainTab.ACTIVITY,
                    icon = Icons.Default.Description,
                    isActive = activeTab == MainTab.ACTIVITY,
                    onClick = { onTabSelected(MainTab.ACTIVITY) }
                )
                NavBarItem(
                    tab = MainTab.CONTACTS,
                    icon = Icons.Default.Person,
                    isActive = activeTab == MainTab.CONTACTS,
                    onClick = { onTabSelected(MainTab.CONTACTS) }
                )
                NavBarItem(
                    tab = MainTab.PROFILE,
                    icon = Icons.Default.Tune,
                    isActive = activeTab == MainTab.PROFILE,
                    onClick = { onTabSelected(MainTab.PROFILE) }
                )
            }
        }
    }
}

@Composable
private fun NavBarItem(
    tab: MainTab,
    icon: ImageVector,
    isActive: Boolean,
    onClick: () -> Unit
) {
    val bgModifier = if (isActive) {
        Modifier
            .clip(CircleShape)
            .background(JagrathCrimson)
            .padding(horizontal = 14.dp, vertical = 8.dp)
    } else {
        Modifier
            .clip(CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    }

    Row(
        modifier = bgModifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = tab.title,
            tint = if (isActive) White else Slate400,
            modifier = Modifier.size(18.dp)
        )
        if (isActive) {
            Text(
                text = tab.title,
                color = White,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(start = 6.dp)
            )
        }
    }
}
