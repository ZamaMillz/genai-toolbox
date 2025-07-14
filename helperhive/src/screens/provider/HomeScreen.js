import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS, VERIFICATION_STATUS } from '../../constants';
import { providerService, userService } from '../../services/api';

const ProviderHomeScreen = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [jobRequests, setJobRequests] = useState([]);
  const [earnings, setEarnings] = useState({ thisWeek: 0, lastPayout: 0 });
  const [verificationStatus, setVerificationStatus] = useState(VERIFICATION_STATUS.PENDING);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadProviderData();
    loadJobRequests();
    loadEarnings();
  }, []);

  const loadProviderData = async () => {
    try {
      const profile = await userService.getProfile();
      setUserName(profile.firstName);
      setVerificationStatus(profile.verificationStatus || VERIFICATION_STATUS.PENDING);
      setIsAvailable(profile.isAvailable || false);
    } catch (error) {
      console.error('Failed to load provider data:', error);
    }
  };

  const loadJobRequests = async () => {
    try {
      const requests = await providerService.getJobRequests();
      setJobRequests(requests.slice(0, 3)); // Show top 3 requests
    } catch (error) {
      console.error('Failed to load job requests:', error);
    }
  };

  const loadEarnings = async () => {
    try {
      const earningsData = await providerService.getEarnings('week');
      setEarnings(earningsData);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadProviderData(), loadJobRequests(), loadEarnings()]);
    setIsRefreshing(false);
  };

  const handleAvailabilityToggle = async () => {
    if (verificationStatus !== VERIFICATION_STATUS.APPROVED) {
      Alert.alert(
        'Verification Required',
        'Please complete your document verification to start accepting jobs.',
        [
          { text: 'Upload Documents', onPress: () => navigation.navigate('DocumentUpload') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      const newAvailability = !isAvailable;
      await providerService.updateAvailability(newAvailability);
      setIsAvailable(newAvailability);
      
      Alert.alert(
        'Availability Updated',
        `You are now ${newAvailability ? 'available' : 'unavailable'} for new jobs.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability. Please try again.');
    }
  };

  const handleJobAccept = (jobId) => {
    navigation.navigate('JobAcceptance', { jobId });
  };

  const getVerificationStatusDisplay = () => {
    switch (verificationStatus) {
      case VERIFICATION_STATUS.APPROVED:
        return { text: 'Verified', color: COLORS.success, icon: '✅' };
      case VERIFICATION_STATUS.UNDER_REVIEW:
        return { text: 'Under Review', color: COLORS.warning, icon: '⏳' };
      case VERIFICATION_STATUS.REJECTED:
        return { text: 'Rejected', color: COLORS.danger, icon: '❌' };
      default:
        return { text: 'Pending', color: COLORS.text.secondary, icon: '📋' };
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const verificationInfo = getVerificationStatusDisplay();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, {userName}!
              </Text>
              <View style={styles.verificationContainer}>
                <Text style={styles.verificationIcon}>{verificationInfo.icon}</Text>
                <Text style={[styles.verificationText, { color: verificationInfo.color }]}>
                  {verificationInfo.text}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityHeader}>
            <Text style={styles.availabilityTitle}>Work Status</Text>
            <TouchableOpacity
              style={[
                styles.availabilityToggle,
                isAvailable && styles.availabilityToggleActive
              ]}
              onPress={handleAvailabilityToggle}
            >
              <View style={[
                styles.availabilityKnob,
                isAvailable && styles.availabilityKnobActive
              ]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.availabilityStatus}>
            You are currently {isAvailable ? 'available' : 'unavailable'} for new jobs
          </Text>
          {!isAvailable && verificationStatus === VERIFICATION_STATUS.APPROVED && (
            <Text style={styles.availabilityNote}>
              💡 Turn on availability to start receiving job requests
            </Text>
          )}
        </View>

        {/* Earnings Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earnings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
              <Text style={styles.viewAllText}>View Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.earningsContainer}>
            <View style={styles.earningCard}>
              <Text style={styles.earningLabel}>This Week</Text>
              <Text style={styles.earningAmount}>R{earnings.thisWeek.toFixed(2)}</Text>
            </View>
            <View style={styles.earningCard}>
              <Text style={styles.earningLabel}>Last Payout</Text>
              <Text style={styles.earningAmount}>R{earnings.lastPayout.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Job Requests */}
        {jobRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Job Requests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('JobRequests')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {jobRequests.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobService}>{job.serviceName}</Text>
                  <Text style={styles.jobAmount}>R{job.amount}</Text>
                </View>
                <Text style={styles.jobLocation}>{job.location}</Text>
                <Text style={styles.jobTime}>{new Date(job.scheduledFor).toLocaleString()}</Text>
                
                <View style={styles.jobActions}>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => handleJobAccept(job.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton}>
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Verification Status */}
        {verificationStatus !== VERIFICATION_STATUS.APPROVED && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Complete Your Profile</Text>
            <TouchableOpacity 
              style={styles.verificationCard}
              onPress={() => navigation.navigate('DocumentUpload')}
            >
              <View style={styles.verificationContent}>
                <Text style={styles.verificationCardIcon}>📋</Text>
                <View style={styles.verificationCardInfo}>
                  <Text style={styles.verificationCardTitle}>Upload Documents</Text>
                  <Text style={styles.verificationCardDescription}>
                    Complete verification to start accepting jobs
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Text style={styles.quickActionIcon}>💰</Text>
              <Text style={styles.quickActionText}>Earnings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Support')}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyIcon}>🔒</Text>
          <Text style={styles.safetyText}>
            Your safety and customer satisfaction are our top priorities
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  availabilityCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 24,
    marginTop: -15,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  availabilityToggle: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  availabilityToggleActive: {
    backgroundColor: COLORS.secondary,
  },
  availabilityKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
  },
  availabilityKnobActive: {
    alignSelf: 'flex-end',
  },
  availabilityStatus: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  availabilityNote: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  earningsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  earningCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobService: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  jobAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  jobLocation: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  jobTime: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  verificationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationCardIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  verificationCardInfo: {
    flex: 1,
  },
  verificationCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  verificationCardDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  safetyIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  safetyText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
});

export default ProviderHomeScreen;