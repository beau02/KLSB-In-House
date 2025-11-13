import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Text, ActivityIndicator, Chip } from 'react-native-paper';
import moment from 'moment';
import { timesheetService } from '../services';

export const TimesheetDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [timesheet, setTimesheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    loadTimesheet();
  }, [id]);

  const loadTimesheet = async () => {
    try {
      const response = await timesheetService.getById(id);
      setTimesheet(response.timesheet);
      setEntries(response.timesheet.entries || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load timesheet');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await timesheetService.update(id, { entries });
      Alert.alert('Success', 'Timesheet updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error updating timesheet');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalNormalHours = entries.reduce((sum, e) => sum + (parseFloat(e.normalHours) || 0), 0);
  const totalOTHours = entries.reduce((sum, e) => sum + (parseFloat(e.otHours) || 0), 0);
  const totalHours = totalNormalHours + totalOTHours;
  const isEditable = timesheet.status === 'draft';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleLarge">
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
            Project: {timesheet.projectId?.projectName || 'N/A'}
          </Text>
          <Text variant="bodyMedium" style={styles.project}>
            Code: {timesheet.projectId?.projectCode || 'N/A'}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Daily Hours</Text>

          {entries.map((entry, index) => {
            const entryDate = moment(entry.date);
            const isWeekend = entryDate.day() === 0 || entryDate.day() === 6;
            return (
              <View key={index} style={[styles.dayRow, isWeekend && styles.weekendRow]}>
                <View style={styles.dateColumn}>
                  <Text variant="titleMedium">{entryDate.format('DD')}</Text>
                  <Text variant="bodySmall" style={isWeekend ? styles.weekendText : null}>
                    {entryDate.format('ddd')}
                  </Text>
                </View>
                <View style={styles.hoursColumn}>
                  <TextInput
                    mode="outlined"
                    value={entry.normalHours.toString()}
                    onChangeText={(text) => handleEntryChange(index, 'normalHours', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                    dense
                    disabled={!isEditable}
                    placeholder="Normal"
                    style={styles.hoursInput}
                  />
                </View>
                <View style={styles.otColumn}>
                  <TextInput
                    mode="outlined"
                    value={entry.otHours.toString()}
                    onChangeText={(text) => handleEntryChange(index, 'otHours', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                    dense
                    disabled={!isEditable}
                    placeholder="OT"
                    style={styles.hoursInput}
                  />
                </View>
                <View style={styles.descColumn}>
                  <TextInput
                    mode="outlined"
                    value={entry.description}
                    onChangeText={(text) => handleEntryChange(index, 'description', text)}
                    placeholder="Description"
                    dense
                    disabled={!isEditable}
                    style={styles.descInput}
                  />
                </View>
              </View>
            );
          })}

          <View style={styles.totalContainer}>
            <Text variant="titleMedium">Normal Hours: {totalNormalHours.toFixed(1)} hrs</Text>
            <Text variant="titleMedium">OT Hours: {totalOTHours.toFixed(1)} hrs</Text>
            <Text variant="titleLarge" style={styles.totalText}>Total: {totalHours.toFixed(1)} hrs</Text>
          </View>
        </Card.Content>
      </Card>

      {isEditable && (
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleUpdate}
            loading={saving}
            disabled={saving}
            style={styles.button}
          >
            Update Timesheet
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  project: {
    marginTop: 4,
    color: '#666',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  weekendRow: {
    backgroundColor: '#f5f5f5',
  },
  dateColumn: {
    width: 60,
    alignItems: 'center',
  },
  weekendText: {
    color: '#d32f2f',
  },
  hoursColumn: {
    width: 70,
    marginRight: 4,
  },
  otColumn: {
    width: 70,
    marginHorizontal: 4,
  },
  hoursInput: {
    height: 40,
  },
  totalText: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  descColumn: {
    flex: 1,
  },
  descInput: {
    height: 40,
  },
  totalContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonContainer: {
    margin: 16,
  },
  button: {
    paddingVertical: 8,
  },
});
