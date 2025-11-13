import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import moment from 'moment';
import { projectService } from '../services';

export const ProjectsScreen = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectService.getAll();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#2e7d32',
      completed: '#1976d2',
      'on-hold': '#ed6c02',
      cancelled: '#d32f2f'
    };
    return colors[status] || '#757575';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadProjects} />
      }
    >
      {projects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No projects found
            </Text>
          </Card.Content>
        </Card>
      ) : (
        projects.map((project) => (
          <Card key={project._id} style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium">{project.projectCode}</Text>
                <Chip
                  textStyle={{ color: 'white' }}
                  style={{ backgroundColor: getStatusColor(project.status) }}
                >
                  {project.status.toUpperCase()}
                </Chip>
              </View>
              <Text variant="bodyLarge" style={styles.projectName}>
                {project.projectName}
              </Text>
              {project.description && (
                <Text variant="bodySmall" style={styles.description}>
                  {project.description}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.manager}>
                Manager: {project.managerId?.firstName} {project.managerId?.lastName}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                Start Date: {moment(project.startDate).format('MMM DD, YYYY')}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 8,
  },
  emptyCard: {
    margin: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  manager: {
    marginTop: 8,
    color: '#666',
  },
  date: {
    marginTop: 4,
    color: '#999',
  },
});
