import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService, projectService } from '../services';

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 16,
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '47%',
    margin: '1.5%',
  },
  statTitle: {
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
  },
  actionsCard: {
    margin: 16,
  },
  actionsTitle: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
  },
});
