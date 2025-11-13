import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimesheetsScreen } from '../screens/TimesheetsScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { NewTimesheetScreen } from '../screens/NewTimesheetScreen';
import { TimesheetDetailScreen } from '../screens/TimesheetDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Timesheets') {
            iconName = 'clipboard-text';
          } else if (route.name === 'Projects') {
            iconName = 'briefcase';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Timesheets" component={TimesheetsScreen} />
      <Tab.Screen name="Projects" component={ProjectsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="NewTimesheet" 
              component={NewTimesheetScreen}
              options={{ title: 'New Timesheet' }}
            />
            <Stack.Screen 
              name="TimesheetDetail" 
              component={TimesheetDetailScreen}
              options={{ title: 'Timesheet Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
