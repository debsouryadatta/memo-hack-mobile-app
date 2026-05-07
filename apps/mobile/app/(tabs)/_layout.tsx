import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { Bot, Home, Trophy, User } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabBarBackground = React.memo(function TabBarBackground() {
  return (
    <LinearGradient
      colors={["#4F46E5", "#6366F1"]}
      className="h-full w-full"
    />
  );
});

/**
 * Vertical space for the icon + label stack inside the bar (excluding padding).
 * Web needs a few extra px so labels are not clipped by the bar bounds.
 */
const TAB_BAR_INNER_ROW_HEIGHT = Platform.select({ web: 60, ios: 56, default: 56 });

const TAB_BAR_PADDING_TOP = 8;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 8) : insets.bottom;
  const tabBarHeight =
    TAB_BAR_PADDING_TOP + TAB_BAR_INNER_ROW_HEIGHT + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          ...(Platform.OS === 'web' ? { lineHeight: 14 } : {}),
        },
        tabBarStyle: {
            borderTopWidth: 0,
            position: 'absolute',
            elevation: 0,
            height: tabBarHeight,
            paddingTop: TAB_BAR_PADDING_TOP,
            paddingBottom: bottomInset,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Memo AI',
          tabBarIcon: ({ color, size }) => <Bot color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
