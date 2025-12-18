import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { EventSourcePolyfill } from 'event-source-polyfill';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

// Import your number image assets
import number0 from '../images/picture-0.png';
import number1 from '../images/picture-1.png';
import number2 from '../images/picture-2.png';
import number3 from '../images/picture-3.png';
import number4 from '../images/picture-4.png';
import number5 from '../images/picture-5.png';
import number6 from '../images/picture-6.png';
import number7 from '../images/picture-7.png';
import number8 from '../images/picture-8.png';
import number9 from '../images/picture-9.png';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

const ResultsDashboard = () => {
  const navigation = useNavigation();
  const [results, setResults] = useState({
    date: null,
    todayResults: { session1: null, session2: null },
    previousResults: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openResultsIndex, setOpenResultsIndex] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Refs for cleanup
  const eventSourceRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);

  // Constants
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  const POLL_INTERVAL = 30000;
  const SSE_TIMEOUT = 120000;

  // Cleanup function
  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // HTTP fallback function
  const fetchDataWithHTTP = async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('Attempting HTTP request...');
      const response = await axios.get(`${API_BASE_URL}/api/fetch-results`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        const { date, todayResults, previousResults } = response.data.results;
        setResults({
          date,
          todayResults: {
            session1: todayResults.session1,
            session2: todayResults.session2,
          },
          previousResults: previousResults.filter(
            (result) => result.date !== date
          ),
        });
        setLoading(false);
        setError(null);
        setConnectionStatus('connected');
        console.log('HTTP request successful');
      } else {
        throw new Error(response.data?.message || 'Failed to fetch results');
      }
    } catch (error) {
      console.error('HTTP request failed:', error);
      if (isMountedRef.current) {
        setError(`Connection failed: ${error.message}`);
        setLoading(false);
        setConnectionStatus('error');
      }
    }
  };

  // Start polling function
  const startPolling = () => {
    console.log('Starting HTTP polling...');
    setConnectionStatus('polling');
    
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Initial fetch
    fetchDataWithHTTP();
    
    // Poll every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchDataWithHTTP();
      }
    }, POLL_INTERVAL);
  };

  // SSE connection function
  const connectSSE = () => {
    if (!isMountedRef.current) return;

    console.log('Attempting SSE connection...');
    setConnectionStatus('connecting');
    
    try {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      eventSourceRef.current = new EventSourcePolyfill(`${API_BASE_URL}/fetch-results`, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        heartbeatTimeout: SSE_TIMEOUT,
        retry: RECONNECT_DELAY,
      });

      eventSourceRef.current.onopen = () => {
        console.log('SSE connection opened successfully');
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSourceRef.current.onmessage = (event) => {
        if (!isMountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log('Received SSE data:', data);
          
          if (data.success) {
            const { date, todayResults, previousResults } = data.results;
            setResults({
              date,
              todayResults: {
                session1: todayResults.session1,
                session2: todayResults.session2,
              },
              previousResults: previousResults.filter(
                (result) => result.date !== date
              ),
            });
            setLoading(false);
            setError(null);
            setConnectionStatus('connected');
          } else {
            console.error('SSE data error:', data.message);
            setError(data.message || 'Failed to fetch results');
            setLoading(false);
          }
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
          setError('Failed to parse response');
          setLoading(false);
        }
      };

      eventSourceRef.current.onerror = (err) => {
        console.error('SSE error:', err);
        if (!isMountedRef.current) return;
        
        setConnectionStatus('error');
        
        // Clean up current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);
          
          console.log(`SSE reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connectSSE();
            }
          }, delay);
        } else {
          console.log('Max SSE reconnect attempts reached, falling back to HTTP polling');
          startPolling();
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      startPolling();
    }
  };

  // Main effect for data fetching
  useEffect(() => {
    isMountedRef.current = true;
    
    // Try SSE first, fallback to polling if it fails
    connectSSE();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  // Filter results based on search date
  useEffect(() => {
    if (!searchDate.trim()) {
      setFilteredResults([]);
      return;
    }

    const searchParts = searchDate.split('/');
    
    const normalizeDate = (dateStr) => {
      if (!dateStr) return null;
      
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return {
          day: day.padStart(2, '0'),
          month: month.padStart(2, '0'),
          year: year,
          fullDate: `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
        };
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return {
            day: parts[0].padStart(2, '0'),
            month: parts[1].padStart(2, '0'),
            year: parts[2],
            fullDate: `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`
          };
        }
      }
      return null;
    };
    
    if (searchParts.length === 1 && searchParts[0].length <= 2) {
      const searchDay = searchParts[0].padStart(2, '0');
      const filtered = results.previousResults.filter(result => {
        const normalized = normalizeDate(result.date);
        return normalized && normalized.day === searchDay;
      });
      setFilteredResults(filtered);
    } else if (searchParts.length === 2) {
      const searchDay = searchParts[0].padStart(2, '0');
      const searchMonth = searchParts[1].padStart(2, '0');
      const filtered = results.previousResults.filter(result => {
        const normalized = normalizeDate(result.date);
        return normalized && normalized.day === searchDay && normalized.month === searchMonth;
      });
      setFilteredResults(filtered);
    } else if (searchParts.length === 3) {
      const searchDay = searchParts[0].padStart(2, '0');
      const searchMonth = searchParts[1].padStart(2, '0');
      const searchYear = searchParts[2];
      const fullSearchDate = `${searchDay}/${searchMonth}/${searchYear}`;
      
      const filtered = results.previousResults.filter(result => {
        const normalized = normalizeDate(result.date);
        return normalized && normalized.fullDate === fullSearchDate;
      });
      setFilteredResults(filtered);
    } else {
      setFilteredResults([]);
    }
  }, [searchDate, results.previousResults]);

  // Function to get the number image based on the digit
  const getNumberImage = (digit) => {
    switch (digit) {
      case '0':
        return number0;
      case '1':
        return number1;
      case '2':
        return number2;
      case '3':
        return number3;
      case '4':
        return number4;
      case '5':
        return number5;
      case '6':
        return number6;
      case '7':
        return number7;
      case '8':
        return number8;
      case '9':
        return number9;
      default:
        return null;
    }
  };

  // Format numbers as image components
  const formatNumbers = (numberString, isFullNumbers = false, isPana = false) => {
    if (!numberString) return null;

    const sanitizedString = String(numberString).replace(/[^0-9]/g, '');

    if (isFullNumbers) {
      // For full pictures, arrange in 3/2/3 layout
      const digits = Array.from(sanitizedString);
      const rows = [
        digits.slice(0, 3),   // First 3 digits
        digits.slice(3, 5),   // Next 2 digits  
        digits.slice(5, 8)    // Last 3 digits
      ];

      return (
        <View style={styles.fullPicturesGrid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.pictureRow}>
              {row.map((digit, digitIndex) => {
                const imageSrc = getNumberImage(digit);
                return imageSrc ? (
                  <View key={digitIndex} style={styles.imageContainer}>
                    <Image
                      source={imageSrc}
                      style={styles.numberImage}
                      resizeMode="contain"
                    />
                    <View style={styles.imageLabel}>
                      <Text style={styles.imageLabelText}>Picture {digit}</Text>
                    </View>
                  </View>
                ) : null;
              })}
            </View>
          ))}
        </View>
      );
    } else if (isPana) {
      // For pana numbers, display all 3 in a single row
      return (
        <View style={styles.panaImagesRow}>
          {Array.from(sanitizedString).map((digit, index) => {
            const imageSrc = getNumberImage(digit);
            return imageSrc ? (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={imageSrc}
                  style={styles.numberImage}
                  resizeMode="contain"
                />
                <View style={styles.imageLabel}>
                  <Text style={styles.imageLabelText}>Picture {digit}</Text>
                </View>
              </View>
            ) : null;
          })}
        </View>
      );
    } else {
      // For regular numbers (open/close), keep original layout
      return (
        <View style={styles.resultImages}>
          {Array.from(sanitizedString).map((digit, index) => {
            const imageSrc = getNumberImage(digit);
            return imageSrc ? (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={imageSrc}
                  style={styles.numberImage}
                  resizeMode="contain"
                />
                <View style={styles.imageLabel}>
                  <Text style={styles.imageLabelText}>Picture {digit}</Text>
                </View>
              </View>
            ) : null;
          })}
        </View>
      );
    }
  };

  // Format results for display
  const formatResult = (result, sessionType) => {
    if (!result) {
      return (
        <LinearGradient
          colors={['#8a2be2', '#8a2be2']}
          style={styles.noDataAlert}
        >
          <Text style={styles.noDataText}>No Data Available</Text>
        </LinearGradient>
      );
    }

    return (
      <View style={styles.resultCard}>
        <LinearGradient
          colors={['#e3f2fd', '#90caf9']}
          style={styles.cardBody}
        >
          <View style={styles.resultRow}>
            {result['open-number'] && (
              <View style={styles.resultColumn}>
                <LinearGradient
                  colors={['#e3f2fd', '#bbdefb']}
                  style={styles.openSection}
                >
                  <Text style={styles.sectionTitle}>Start Details</Text>
                  <View style={styles.numberSection}>
                    <Text style={styles.mobileLabel}>1 fruit start</Text>
                    {formatNumbers(result['open-number'])}
                  </View>
                  <View style={styles.panaSection}>
                    <Text style={styles.mobileLabel}>3 fruits start</Text>
                    {formatNumbers(result['open-pana'], false, true)}
                  </View>
                </LinearGradient>
              </View>
            )}
            {result['close-number'] && (
              <View style={styles.resultColumn}>
                <LinearGradient
                  colors={['#e8f5e8', '#c8e6c9']}
                  style={styles.closeSection}
                >
                  <Text style={[styles.sectionTitle, styles.successText]}>End Details</Text>
                  <View style={styles.numberSection}>
                    <Text style={styles.mobileLabel}>1 fruit end</Text>
                    {formatNumbers(result['close-number'])}
                  </View>
                  <View style={styles.panaSection}>
                    <Text style={[styles.mobileLabel, styles.successText]}>3 fruits start</Text>
                    {formatNumbers(result['close-pana'], false, true)}
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>
          {result.nums && (
            <LinearGradient
              colors={['#e0f7fa', '#80deea']}
              style={styles.fullPicturesSection}
            >
              <Text style={[styles.sectionTitle, styles.infoText]}>Full Fruits</Text>
              <View style={styles.fullPicturesContainer}>
                {formatNumbers(result.nums, true)}
              </View>
            </LinearGradient>
          )}
        </LinearGradient>
      </View>
    );
  };

  const toggleResultsVisibility = (index) => {
    setOpenResultsIndex(openResultsIndex === index ? null : index);
  };

  const handleDateSearch = (text) => {
    setSearchDate(text);
  };

  // Manual refresh function
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    cleanup();
    connectSSE();
  };

  // Navigation handler
  const handleNavigateToChartResults = () => {
    navigation.navigate('ChartResults');
  };

  // Connection status indicator
  const renderConnectionStatus = () => {
    let statusColor = '#28a745';
    let statusText = 'Connected';
    
    switch (connectionStatus) {
      case 'connecting':
        statusColor = '#ffc107';
        statusText = 'Connecting...';
        break;
      case 'polling':
        statusColor = '#17a2b8';
        statusText = 'Polling';
        break;
      case 'error':
        statusColor = '#dc3545';
        statusText = 'Connection Error';
        break;
    }

    return (
      <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusText}</Text>
        {connectionStatus === 'error' && (
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Icon name="refresh" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading...</Text>
        {renderConnectionStatus()}
      </View>
    );
  }

  if (error && !results.date) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#f0f8ff', '#f0f8ff']}
        style={styles.headerContainer}
      >
        <Text style={styles.headerTitle}>Results</Text>
        
        {/* Navigation Button */}
        <TouchableOpacity 
          style={styles.chartButton}
          onPress={handleNavigateToChartResults}
        >
          <LinearGradient
            colors={['#1a73e8', '#0d47a1']}
            style={styles.chartButtonGradient}
          >
            <Icon name="bar-chart" size={20} color="white" style={styles.chartButtonIcon} />
            <Text style={styles.chartButtonText}>Fruit Game Chart Results</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Error Alert (if any) */}
      {error && (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Icon name="refresh" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      )}

      {/* Date Search */}
      <View style={styles.dateSearchContainer}>
        <TextInput
          style={styles.dateInput}
          placeholder="Search by Date (dd/mm/yyyy)"
          value={searchDate}
          onChangeText={handleDateSearch}
          placeholderTextColor="#666"
        />
      </View>

      {/* Search Results */}
      {searchDate && (
        <View style={styles.searchResultsSection}>
          <Text style={styles.resultsDateTitle}>
            Search Results for "{searchDate}"
          </Text>
          {filteredResults.length > 0 ? (
            <View style={styles.accordionContainer}>
              {filteredResults.map((searchResult, index) => (
                <View key={`search-${index}`} style={styles.accordionCard}>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => toggleResultsVisibility(`search-${index}`)}
                  >
                    <Text style={styles.accordionTitle}>
                      Results for {searchResult.date}
                    </Text>
                    <Icon
                      name={openResultsIndex === `search-${index}` ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={24}
                      color="#1a73e8"
                    />
                  </TouchableOpacity>
                  {openResultsIndex === `search-${index}` && (
                    <View style={styles.accordionBody}>
                      <View style={styles.sessionContainer}>
                        <Text style={styles.sessionTitle}>Session 1</Text>
                        {formatResult(searchResult.session1, 'Search Session 1')}
                      </View>
                      <View style={styles.sessionContainer}>
                        <Text style={styles.sessionTitle}>Session 2</Text>
                        {formatResult(searchResult.session2, 'Search Session 2')}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.warningAlert}>
              <Text style={styles.warningText}>No results found for "{searchDate}"</Text>
            </View>
          )}
        </View>
      )}

      {/* Today's Results */}
      <View style={styles.todayResultsSection}>
        <Text style={styles.resultsDateTitle}>
          {results.date ? `Results for ${results.date}` : 'Results'}
        </Text>
        <View style={styles.sessionContainer}>
          <Text style={styles.sessionTitle}>Today Session 1</Text>
          {formatResult(results.todayResults.session1, 'Today Session 1')}
        </View>
        <View style={styles.sessionContainer}>
          <Text style={styles.sessionTitle}>Today Session 2</Text>
          {formatResult(results.todayResults.session2, 'Today Session 2')}
        </View>
      </View>

      {/* Previous Results */}
      <View style={styles.previousResultsSection}>
        <Text style={styles.previousResultsTitle}>Previous Results</Text>
        {results.previousResults.length > 0 ? (
          <View style={styles.accordionContainer}>
            {results.previousResults.map((prevResult, index) => (
              <View key={index} style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleResultsVisibility(index)}
                >
                  <Text style={styles.accordionTitle}>
                    Results for {prevResult.date}
                  </Text>
                  <Icon
                    name={openResultsIndex === index ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={24}
                    color="#1a73e8"
                  />
                </TouchableOpacity>
                {openResultsIndex === index && (
                  <View style={styles.accordionBody}>
                    <View style={styles.sessionContainer}>
                      <Text style={styles.sessionTitle}>Session 1</Text>
                      {formatResult(prevResult.session1, 'Previous Session 1')}
                    </View>
                    <View style={styles.sessionContainer}>
                      <Text style={styles.sessionTitle}>Session 2</Text>
                      {formatResult(prevResult.session2, 'Previous Session 2')}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.infoAlert}>
            <Text style={styles.infoText}>No previous results available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 10,
    paddingVertical: 20,
    marginTop:20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1a73e8',
  },
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
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContainer: {
    borderWidth: 1,
    borderColor: '#1a73e8',
    borderRadius: 8,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: {
    color: '#1a73e8',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartButton: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chartButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  chartButtonIcon: {
    marginRight: 8,
  },
  chartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 5,
  },
  refreshButton: {
    marginLeft: 5,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorAlertText: {
    flex: 1,
    color: '#721c24',
    fontSize: 14,
  },
  dateSearchContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#1a73e8',
    textAlign: 'center',
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchResultsSection: {
    marginBottom: 20,
  },
  resultsDateTitle: {
    color: '#1a73e8',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  previousResultsTitle: {
    color: '#666',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  accordionContainer: {
    marginBottom: 10,
  },
  accordionCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  accordionTitle: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  accordionBody: {
    borderWidth: 1,
    borderColor: '#1a73e8',
    backgroundColor: '#fff',
  },
  sessionContainer: {
    marginBottom: 15,
  },
  todayResultsSection: {
    marginBottom: 20,
  },
  previousResultsSection: {
    marginBottom: 20,
  },
  resultCard: {
    marginBottom: 15,
  },
  cardBody: {
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  resultRow: {
    flexDirection: 'column',
  },
  resultColumn: {
    marginBottom: 15,
  },
  openSection: {
    padding: 15,
    borderRadius: 8,
  },
  closeSection: {
    padding: 15,
    borderRadius: 8,
  },
  fullPicturesSection: {
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a73e8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  successText: {
    color: '#28a745',
  },
  infoText: {
    color: '#17a2b8',
  },
  numberSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  panaSection: {
    alignItems: 'center',
  },
  fullPicturesContainer: {
    alignItems: 'center',
    width: '100%',
  },
  mobileLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  resultImages: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 8,
  },
  // New style for pana images in single row
  panaImagesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 8,
  },
  // Styles for 3/2/3 layout
  fullPicturesGrid: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  pictureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    margin: 6,
    overflow: 'hidden',
    borderRadius: 6,
  },
  numberImage: {
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: '#1a73e8',
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  imageLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 3,
  },
  imageLabelText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  noDataAlert: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningAlert: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#856404',
    fontSize: 16,
  },
  infoAlert: {
    backgroundColor: '#d1ecf1',
    borderWidth: 1,
    borderColor: '#bee5eb',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default ResultsDashboard;