import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, SafeAreaView, Dimensions } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService, projectService } from '../services';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTimesheets: 0,
    pendingTimesheets: 0,
    approvedTimesheets: 0,
    activeProjects: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [timesheetsRes, projectsRes] = await Promise.all([
        timesheetService.getAll(),
        projectService.getAll({ status: 'active' })
      ]);

      const timesheets = timesheetsRes.timesheets || [];
      setStats({
        totalTimesheets: timesheets.length,
        pendingTimesheets: timesheets.filter(t => t.status === 'submitted').length,
        approvedTimesheets: timesheets.filter(t => t.status === 'approved').length,
        activeProjects: projectsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color }) => (
    <Card style={styles.statCard}>
      <Card.Content>
        <Text variant="bodyMedium" style={styles.statTitle}>{title}</Text>
        <Text variant="displaySmall" style={[styles.statValue, { color }]}>
          {value}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDashboardData} />
        }
      >
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Text variant="headlineSmall">
            Welcome, {user?.firstName}!
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Dashboard Overview
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Timesheets"
          value={stats.totalTimesheets}
          color="#1976d2"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingTimesheets}
          color="#ed6c02"
        />
        <StatCard
          title="Approved"
          value={stats.approvedTimesheets}
          color="#2e7d32"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          color="#0288d1"
        />
      </View>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.actionsTitle}>
            Quick Actions
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Timesheets')}
            style={styles.actionButton}
          >
            View My Timesheets
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Projects')}
            style={styles.actionButton}
          >
            View Projects
          </Button>
        </Card.Content>
      </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  welcomeCard: {
    marginHorizontal: '4%',
    marginVertical: 12,
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: '2%',
    paddingVertical: 8,
  },
  statCard: {
    width: width < 400 ? '96%' : '47%',
    marginHorizontal: '1.5%',
    marginVertical: 6,
  },
  statTitle: {
    color: '#666',
    marginBottom: 8,
    fontSize: width < 350 ? 12 : 14,
  },
  statValue: {
    fontWeight: 'bold',
  },
  actionsCard: {
    marginHorizontal: '4%',
    marginVertical: 12,
    marginBottom: 20,
  },
  actionsTitle: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
  },
});
