import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  Checkbox,
  CircularProgress, 
  LinearProgress, 
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  ContactPhone as ContactIcon, 
  Notifications as ReminderIcon, 
  Check as CheckIcon,
  Add as AddIcon,
  BarChart as ChartIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { contactService } from '../services/contact.service';
import { reminderService } from '../services/reminder.service';
import { formatRelativeDate, formatContactCategory } from '../utils/format';
import { Contact, Reminder, ContactCategory, GoalProgress } from '../types';
import DueContactsWidget from '../components/dashboard/DueContactsWidget';
import GoalProgressWidget from '../components/dashboard/GoalProgressWidget';
import FollowupSettingsDialog from '../components/settings/FollowupSettingsDialog';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // State for contacts by category
  const [contactStats, setContactStats] = useState<Array<{ category: ContactCategory; count: number }>>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  
  // State for today's reminders
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState<string | null>(null);
  
  // State for goal progress - initialize with default values
  const [goalProgress, setGoalProgress] = useState<GoalProgress>({ 
    dailyGoal: 0, 
    contacted: 0, 
    remaining: 0,
    dueToday: 0
  });
  const [goalLoading, setGoalLoading] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);
  
  // State for followup settings dialog
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);

  // Get contacts by category data
  useEffect(() => {
    const fetchContactStats = async () => {
      setContactsLoading(true);
      setContactsError(null);
      try {
        const categories: ContactCategory[] = ['HOTLIST', 'A_LIST', 'B_LIST', 'C_LIST', 'STANDARD'];
        const stats = await Promise.all(
          categories.map(async (category) => {
            try {
              const contacts = await contactService.getContactsByCategory(category);
              // Handle case where contacts is undefined or null
              return { 
                category, 
                count: Array.isArray(contacts) ? contacts.length : 0 
              };
            } catch (error) {
              console.error(`Failed to fetch ${category} contacts:`, error);
              return { category, count: 0 };
            }
          })
        );
        setContactStats(stats);
      } catch (error) {
        console.error('Failed to fetch contact stats:', error);
        setContactsError('Failed to load contact statistics');
        // Set empty stats on error
        setContactStats([]);
      } finally {
        setContactsLoading(false);
      }
    };
    
    fetchContactStats();
  }, []);
  
  // Get today's reminders
  useEffect(() => {
    const fetchTodayReminders = async () => {
      setRemindersLoading(true);
      setRemindersError(null);
      try {
        const reminders = await reminderService.getDailyReminders();
        setTodayReminders(Array.isArray(reminders) ? reminders : []);
      } catch (error) {
        console.error('Failed to fetch today reminders:', error);
        setRemindersError('Failed to load today\'s reminders');
        setTodayReminders([]);
      } finally {
        setRemindersLoading(false);
      }
    };
    
    fetchTodayReminders();
  }, []);
  
  // Get goal progress
  useEffect(() => {
    const fetchGoalProgress = async () => {
      setGoalLoading(true);
      setGoalError(null);
      try {
        const progress = await reminderService.getGoalProgress();
        // Ensure we have all the required properties with fallback values
        setGoalProgress({
          dailyGoal: progress?.dailyGoal || 0,
          contacted: progress?.contacted || 0,
          remaining: progress?.remaining || 0,
          dueToday: progress?.dueToday || 0
        });
      } catch (error) {
        console.error('Failed to fetch goal progress:', error);
        setGoalError('Failed to load goal progress');
        // Keep default values in case of error
        setGoalProgress({ dailyGoal: 0, contacted: 0, remaining: 0, dueToday: 0 });
      } finally {
        setGoalLoading(false);
      }
    };
    
    fetchGoalProgress();
  }, []);
  
  // Handle reminder completion
  const handleCompleteReminder = async (id: number) => {
    try {
      await reminderService.completeReminder(id);
      // Update reminders list after completion
      setTodayReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === id ? { ...reminder, completed: true } : reminder
        )
      );
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  // Handle open followup settings dialog
  const handleOpenFollowupSettings = () => {
    setFollowupDialogOpen(true);
  };

  // Handle close followup settings dialog
  const handleCloseFollowupSettings = () => {
    setFollowupDialogOpen(false);
  };
  
  // Prepare chart data
  const chartData = {
    labels: contactStats.map((stat) => formatContactCategory(stat.category)),
    datasets: [
      {
        data: contactStats.map((stat) => stat.count),
        backgroundColor: [
          '#FF6384', // Hot List
          '#36A2EB', // A List
          '#FFCE56', // B List
          '#4BC0C0', // C List
          '#9966FF', // Standard
        ],
        borderWidth: 1,
      },
    ],
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Updated Dashboard Widgets */}
      <Grid container spacing={3} mb={3}>
        {/* <Grid item xs={12} md={6}>
          <GoalProgressWidget />
        </Grid> */}
        <Grid item xs={12} md={6}>
          <DueContactsWidget />
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Contact Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <ContactIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Contact Categories
              </Typography>
              <Box>
{/*                 <Tooltip title="Edit Followup Settings">
                  <IconButton onClick={handleOpenFollowupSettings} size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip> */}
                   <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<EditIcon />}
                  onClick={handleOpenFollowupSettings}
                  sx={{ mr: 1 }}
                >
                  Settings
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/contacts')}
                >
                  Add Contact
                </Button>
              </Box>
            </Box>
            
            {contactsLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : contactsError ? (
              <Alert severity="error">{contactsError}</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
                <Box sx={{ height: 200, width: { xs: '100%', sm: '50%' } }}>
                  {contactStats.length > 0 ? (
                    <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
                  ) : (
                    <Alert severity="info">No contact data available</Alert>
                  )}
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, mt: { xs: 2, sm: 0 } }}>
                  {contactStats.length > 0 ? (
                    <List dense>
                      {contactStats.map((stat) => (
                        <ListItem key={stat.category}>
                          <ListItemText 
                            primary={formatContactCategory(stat.category)} 
                          />
                          <ListItemSecondaryAction>
                            <Typography variant="body2">
                              {stat.count} contacts
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">No contact categories found</Typography>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Today's Reminders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <ReminderIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Today's Reminders
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/reminders')}
              >
                Add Reminder
              </Button>
            </Box>
            
            {remindersLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : remindersError ? (
              <Alert severity="error">{remindersError}</Alert>
            ) : todayReminders.length === 0 ? (
              <Alert severity="info">No reminders scheduled for today.</Alert>
            ) : (
              <List>
                {todayReminders.map((reminder) => (
                  <ListItem 
                    key={reminder.id}
                    sx={{ 
                      opacity: reminder.completed ? 0.6 : 1,
                      textDecoration: reminder.completed ? 'line-through' : 'none',
                    }}
                  >
                    <ListItemText
                      primary={reminder.message}
                      secondary={formatRelativeDate(reminder.time)}
                    />
                    <ListItemSecondaryAction>
                      <Checkbox
                        edge="end"
                        checked={reminder.completed}
                        disabled={reminder.completed}
                        onChange={() => handleCompleteReminder(reminder.id)}
                        icon={<CheckIcon />}
                        checkedIcon={<CheckIcon />}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button 
                variant="text" 
                onClick={() => navigate('/reminders')}
              >
                View All Reminders
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Followup Settings Dialog */}
      <FollowupSettingsDialog
        open={followupDialogOpen}
        onClose={handleCloseFollowupSettings}
      />
    </Box>
  );
};

export default Dashboard; 
