import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Text, Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import moment from 'moment';
import { timesheetService, projectService } from '../services';

export const NewTimesheetScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    entries: []
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    generateEntries();
  }, [formData.month, formData.year]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll({ status: 'active' });
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const generateEntries = () => {
    const daysInMonth = moment(`${formData.year}-${formData.month}`, 'YYYY-M').daysInMonth();
    const entries = [];
    for (let day = 1; day <= daysInMonth; day++) {
      entries.push({
        date: `${formData.year}-${String(formData.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        normalHours: 0,
        otHours: 0,
        description: ''
      });
    }
    setFormData(prev => ({ ...prev, entries }));
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setFormData({ ...formData, entries: newEntries });
  };

  const handleSubmit = async () => {
    if (!formData.projectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }

    setLoading(true);
    try {
      await timesheetService.create(formData);
      Alert.alert('Success', 'Timesheet created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error creating timesheet');
    } finally {
      setLoading(false);
    }
  };

  const totalNormalHours = formData.entries.reduce((sum, e) => sum + (parseFloat(e.normalHours) || 0), 0);
  const totalOTHours = formData.entries.reduce((sum, e) => sum + (parseFloat(e.otHours) || 0), 0);
  const totalHours = totalNormalHours + totalOTHours;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.label}>Project</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.projectId}
              onValueChange={(value) => setFormData({ ...formData, projectId: value })}
            >
              <Picker.Item label="Select a project" value="" />
              {projects.map((project) => (
                <Picker.Item
                  key={project._id}
                  label={`${project.projectCode} - ${project.projectName}`}
                  value={project._id}
                />
              ))}
            </Picker>
          </View>

          <Text variant="titleMedium" style={styles.label}>Month</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.month}
              onValueChange={(value) => setFormData({ ...formData, month: value })}
            >
              {moment.months().map((month, index) => (
                <Picker.Item key={index} label={month} value={index + 1} />
              ))}
            </Picker>
          </View>

          <Text variant="titleMedium" style={styles.label}>Year</Text>
          <TextInput
            mode="outlined"
            value={formData.year.toString()}
            onChangeText={(text) => setFormData({ ...formData, year: parseInt(text) || new Date().getFullYear() })}
            keyboardType="numeric"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleLarge">Daily Hours - {moment().month(formData.month - 1).format('MMMM')} {formData.year}</Text>
          </View>

          {formData.entries.map((entry, index) => {
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

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !formData.projectId}
          style={styles.button}
        >
          Create Timesheet
        </Button>
      </View>
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
  label: {
    marginTop: 8,
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  header: {
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
