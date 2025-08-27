import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Compass, Home, User } from 'lucide-react-native';
import React from 'react';
import * as NavigationBar from 'expo-navigation-bar';

export default function TabLayout() {
  const visibility = NavigationBar.useVisibility();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarBackground: () => (
            <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                className="h-full w-full"
            />
        ),
        tabBarStyle: {
            borderTopWidth: 0,
            position: 'absolute',
            elevation: 0,
            height: visibility === 'visible' ? 90 : 70,
            paddingTop: visibility === 'visible' ? 4 : 10,
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
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
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
