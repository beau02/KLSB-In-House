import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip, FAB } from 'react-native-paper';
import moment from 'moment';
import { timesheetService } from '../services';

export const TimesheetsScreen = ({ navigation }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const response = await timesheetService.getAll();
      setTimesheets(response.timesheets || []);
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#757575',
      submitted: '#ed6c02',
      approved: '#2e7d32',
      rejected: '#d32f2f'
    };
    return colors[status] || '#757575';
  };

  const handleSubmit = async (id) => {
    try {
      await timesheetService.submit(id);
      loadTimesheets();
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert(error.response?.data?.message || 'Error submitting timesheet');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTimesheets} />
        }
      >
        {timesheets.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No timesheets found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          timesheets.map((timesheet) => (
            <Card key={timesheet._id} style={styles.card}>
              <Card.Content>
                <View style={styles.header}>
                  <Text variant="titleMedium">
                    {moment().month(timesheet.month - 1).format('MMMM')} {timesheet.year}
                  </Text>
                  <Chip
                    textStyle={{ color: 'white' }}
                    style={{ backgroundColor: getStatusColor(timesheet.status) }}
                  >
                    {timesheet.status.toUpperCase()}
                  </Chip>
                </View>
                <Text variant="bodyMedium" style={styles.project}>
                  {timesheet.projectId?.projectName || 'N/A'}
                </Text>
                <Text variant="bodySmall" style={styles.hours}>
                  Normal: {timesheet.totalNormalHours || 0} hrs | OT: {timesheet.totalOTHours || 0} hrs
                </Text>
                <Text variant="bodySmall" style={styles.totalHours}>
                  Total Hours: {timesheet.totalHours} hrs
                </Text>
                {timesheet.submittedAt && (
                  <Text variant="bodySmall" style={styles.date}>
                    Submitted: {moment(timesheet.submittedAt).format('MMM DD, YYYY')}
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                {timesheet.status === 'draft' && (
                  <>
                    <Button onPress={() => navigation.navigate('TimesheetDetail', { id: timesheet._id })}>
                      Edit
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => handleSubmit(timesheet._id)}
                    >
                      Submit
                    </Button>
                  </>
                )}
                {timesheet.status !== 'draft' && (
                  <Button onPress={() => navigation.navigate('TimesheetDetail', { id: timesheet._id })}>
                    View
                  </Button>
                )}
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('NewTimesheet')}
      />
    </View>
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
  project: {
    marginTop: 8,
    color: '#666',
  },
  hours: {
    marginTop: 4,
    color: '#666',
  },
  totalHours: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  date: {
    marginTop: 4,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
