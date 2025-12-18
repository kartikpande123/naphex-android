import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { EventSourcePolyfill } from 'event-source-polyfill';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

const ChartResults = () => {
  const [resultsMap, setResultsMap] = useState({});
  const [selectedSession, setSelectedSession] = useState('session1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const eventSourceRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const connectSSE = () => {
      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        eventSourceRef.current = new EventSourcePolyfill(`${API_BASE_URL}/fetch-results`);

        eventSourceRef.current.onmessage = (e) => {
          if (!isMountedRef.current) return;

          try {
            const res = JSON.parse(e.data);
            if (!res.success) return;

            const map = {};
            map[res.results.date] = res.results.todayResults;

            res.results.previousResults.forEach((d) => {
              map[d.date] = {
                session1: d.session1 ?? null,
                session2: d.session2 ?? null,
              };
            });

            setResultsMap(map);
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error('Failed to parse SSE data:', err);
          }
        };

        eventSourceRef.current.onerror = (err) => {
          console.error('SSE error:', err);
          if (!isMountedRef.current) return;
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          
          // Try to reconnect after 3 seconds
          setTimeout(() => {
            if (isMountedRef.current) {
              connectSSE();
            }
          }, 3000);
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
      }
    };

    connectSSE();

    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Format date to match web component (dd/mm/yyyy)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Group dates into weeks (7 days per week)
  const groupWeeks = (arr) => {
    const out = [];
    for (let i = 0; i < arr.length; i += 7) {
      out.push(arr.slice(i, i + 7));
    }
    return out;
  };

  // SectionGrid component - EXACT same as web component
  const SectionGrid = ({ data }) => {
    const openPana = data?.['open-pana']
      ? data['open-pana'].split('')
      : ['-', '-', '-'];

    const closePana = data?.['close-pana']
      ? data['close-pana'].split('')
      : ['-', '-', '-'];

    const openNum = data?.['open-number'];
    const closeNum = data?.['close-number'];

    const PP = openNum !== undefined && closeNum !== undefined
      ? `${openNum}${closeNum}`
      : '-';

    return (
      <View style={styles.section}>
        {/* Header - positioned at top */}
        <View style={[styles.grid, styles.header]}>
          <Text style={styles.headerText}>pp</Text>
        </View>

        {/* Row 1 */}
        <View style={styles.grid}>
          <View style={styles.gridCell}>
            <Text style={styles.gridText}>{openPana[0]}P</Text>
          </View>
          <View style={styles.gridCell}></View>
          <View style={styles.gridCell}>
            <Text style={styles.gridText}>{closePana[0]}P</Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.grid}>
          <View style={styles.gridCell}>
            <Text style={styles.gridText}>{openPana[1]}P</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.ppText}>{PP}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.gridText}>{closePana[1]}P</Text>
          </View>
        </View>

        {/* Row 3 */}
        <View style={styles.grid}>
          <View style={styles.gridCell}>
            <Text style={styles.gridText}>{openPana[2]}P</Text>
          </View>
          <View style={styles.gridCell}></View>
          <View style={styles.gridCell}>
            <Text style={styles.gridText}>{closePana[2]}P</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Chart Results...</Text>
      </View>
    );
  }

  if (error && Object.keys(resultsMap).length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Sort dates in descending order (newest first)
  const dates = Object.keys(resultsMap).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // Group into weeks and reverse each week
  const weeks = groupWeeks(dates);
  weeks.forEach((week) => week.reverse());

  return (
    <View style={styles.chartWrapper}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <Text style={styles.headerTitle}>Fruit Game Chart Results</Text>
      </View>

      {/* Session Filter Buttons */}
      <View style={styles.sessionFilter}>
        <TouchableOpacity
          style={[
            styles.sessionButton,
            selectedSession === 'session1' && styles.sessionButtonActive,
          ]}
          onPress={() => setSelectedSession('session1')}
        >
          <Text
            style={[
              styles.sessionButtonText,
              selectedSession === 'session1' && styles.sessionButtonTextActive,
            ]}
          >
            Session 1
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sessionButton,
            selectedSession === 'session2' && styles.sessionButtonActive,
          ]}
          onPress={() => setSelectedSession('session2')}
        >
          <Text
            style={[
              styles.sessionButtonText,
              selectedSession === 'session2' && styles.sessionButtonTextActive,
            ]}
          >
            Session 2
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Container */}
      <ScrollView 
        style={styles.resultContainer}
        showsVerticalScrollIndicator={false}
      >
        {weeks.map((week, i) => (
          <View key={i} style={styles.weekRow}>
            {/* Week Label - Left side */}
            <View style={styles.weekLabel}>
              <Text style={styles.weekDateStart}>{formatDate(week[0])}</Text>
              <Text style={styles.weekDateDivider}>to</Text>
              <Text style={styles.weekDateEnd}>{formatDate(week[week.length - 1])}</Text>
            </View>

            {/* Week Days - Horizontal scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.weekDays}
              contentContainerStyle={styles.weekDaysContent}
            >
              {week.map((date) => (
                <View key={date} style={styles.dayColumn}>
                  <View style={styles.date}>
                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                  </View>

                  {selectedSession === 'session1' && (
                    <SectionGrid data={resultsMap[date]?.session1} />
                  )}

                  {selectedSession === 'session2' && (
                    <SectionGrid data={resultsMap[date]?.session2} />
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Chart Wrapper
  chartWrapper: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  // Chart Header
  chartHeader: {
    backgroundColor: '#007bff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#0056b3',
    paddingTop:60
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Session Filter Buttons
  sessionFilter: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  sessionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#dee2e6',
    backgroundColor: 'white',
    borderRadius: 6,
  },
  sessionButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  sessionButtonTextActive: {
    color: 'white',
  },

  // Result Container
  resultContainer: {
    flex: 1,
    padding: 15,
  },

  // Week Row
  weekRow: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 6,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },

  // Week Label
  weekLabel: {
    minWidth: 140,
    backgroundColor: '#f8f9fa',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: '#dee2e6',
  },
  weekDateStart: {
    fontWeight: '700',
    fontSize: 13,
    color: '#495057',
    marginBottom: 4,
  },
  weekDateDivider: {
    fontSize: 11,
    color: '#6c757d',
    marginVertical: 2,
    fontWeight: '400',
  },
  weekDateEnd: {
    fontWeight: '700',
    fontSize: 13,
    color: '#495057',
    marginTop: 4,
  },

  // Week Days (horizontal scroll)
  weekDays: {
    flex: 1,
  },
  weekDaysContent: {
    flexDirection: 'row',
  },

  // Day Column
  dayColumn: {
    minWidth: 140,
    padding: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  dayColumnFirst: {
    borderLeftWidth: 0,
  },
  date: {
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    paddingVertical: 6,
    marginBottom: 8,
  },
  dateText: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    color: '#212529',
  },

  // Section Grid
  section: {
    marginBottom: 0,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  header: {
    justifyContent: 'center',
    marginBottom: 0,
    paddingBottom: 10,
    display:"flex",
    position:"relative",
    bottom:-55
  },
  headerText: {
    fontWeight: '700',
    color: '#495057',
    fontSize: 15,
  },
  gridCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  ppText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007bff',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007bff',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },

  // Mobile Optimization
  mobileOptimization: {
    // These styles apply automatically on mobile
  },
});

export default ChartResults;