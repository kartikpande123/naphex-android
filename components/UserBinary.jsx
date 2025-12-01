import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// If you don't have react-native-vector-icons, replace with Text
const Icon = ({ name, size, color, style }) => {
  const iconMap = {
    info: 'ℹ️',
    schedule: '⏰',
    search: '🔍',
    'expand-more': '⬇️',
    'expand-less': '⬆️',
    'add-box': '📦',
    close: '❌',
    'arrow-drop-down': '⬇️',
    warning: '⚠️',
    'account-tree': '🌳',
    link: '🔗',
    copy: '📋',
  };

  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const UserBinaryTreeMobile = () => {
  const [treeData, setTreeData] = useState(null);
  const [originalTreeData, setOriginalTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [viewMode, setViewMode] = useState('default');
  const [maxLevel, setMaxLevel] = useState(2);
  const [searchPaths, setSearchPaths] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilteredView, setIsFilteredView] = useState(false);
  const [currentFocusNode, setCurrentFocusNode] = useState(null); // For focused mobile view
  const [allUsers, setAllUsers] = useState([]); // Store all users for suggestions

  // Empty slots feature states
  const [showEmptySlots, setShowEmptySlots] = useState(false);
  const [emptySlots, setEmptySlots] = useState([]);
  const [emptySlotsSort, setEmptySlotsSort] = useState('level');

  // Website URL
  const WEBSITE_URL = 'https://www.naphex.com/';

  const scrollViewRef = useRef(null);

  useEffect(() => {
    fetchTreeData();
  }, []);

  // Extract all users from tree for search suggestions
  const extractAllUsers = (node, users = []) => {
    if (!node) return users;

    users.push({
      name: node.name,
      userId: node.userId,
      fullData: node,
    });

    if (node.children) {
      node.children.forEach(child => extractAllUsers(child, users));
    }

    return users;
  };

  const fetchTreeData = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      const userDataParsed = userData ? JSON.parse(userData) : {};
      const userId = userDataParsed.userids?.myuserid;

      if (!userId) {
        setError('User ID not found in storage');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/user-downline?userId=${userId}`,
      );
      setTreeData(response.data);
      setOriginalTreeData(response.data);
      setIsFilteredView(false);

      // Extract all users for search suggestions
      const users = extractAllUsers(response.data);
      setAllUsers(users);

      // Set initial focus to root node for mobile view
      setCurrentFocusNode(response.data);

      // Initialize default expanded nodes (only root level)
      const defaultExpanded = {};
      defaultExpanded[response.data.userId] = true;
      setExpandedNodes(defaultExpanded);

      calculateEmptySlots(response.data);
    } catch (err) {
      console.error('Error fetching tree data:', err);
      setError('No Binary Tree Found!!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTreeData();
  };

  // Handle search input change with suggestions
  const handleSearchInputChange = text => {
    setSearchTerm(text);

    if (text.trim().length > 0) {
      const suggestions = allUsers
        .filter(
          user =>
            user.name.toLowerCase().includes(text.toLowerCase()) ||
            user.userId.toLowerCase().includes(text.toLowerCase()),
        )
        .slice(0, 5); // Limit to 5 suggestions

      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = suggestion => {
    setSearchTerm(suggestion.name);
    setShowSuggestions(false);
    // Focus on the selected node
    focusOnNode(suggestion.fullData);
  };

  // Focus on a specific node (mobile-friendly view)
  const focusOnNode = node => {
    setCurrentFocusNode(node);

    // Expand only this node and its immediate children
    const newExpanded = {};
    newExpanded[node.userId] = true;
    setExpandedNodes(newExpanded);

    setViewMode('focused');
  };

  // Calculate empty slots in the tree
  const calculateEmptySlots = rootNode => {
    const slots = [];

    const findEmptySlots = (node, level = 0) => {
      if (!node) return;

      if (!node.children || node.children.length === 0) {
        slots.push({
          parentName: node.name,
          parentId: node.userId,
          level: level + 1,
          availablePositions: ['left', 'right'],
          parentNode: node,
        });
      } else if (node.children.length === 1) {
        const existingChild = node.children[0];
        const existingPosition = existingChild.position || 'left';
        const emptyPosition = existingPosition === 'left' ? 'right' : 'left';

        slots.push({
          parentName: node.name,
          parentId: node.userId,
          level: level + 1,
          availablePositions: [emptyPosition],
          parentNode: node,
        });
      }

      if (node.children) {
        node.children.forEach(child => findEmptySlots(child, level + 1));
      }
    };

    findEmptySlots(rootNode);
    setEmptySlots(slots);
  };

  const getSortedEmptySlots = () => {
    const sorted = [...emptySlots];

    if (emptySlotsSort === 'level') {
      sorted.sort((a, b) => a.level - b.level);
    } else if (emptySlotsSort === 'name') {
      sorted.sort((a, b) => a.parentName.localeCompare(b.parentName));
    }

    return sorted;
  };

  const extractUserSubtree = (rootNode, targetUserId) => {
    const findUserAndExtractSubtree = node => {
      if (!node) return null;

      if (node.userId === targetUserId) {
        return node;
      }

      if (node.children) {
        for (const child of node.children) {
          const result = findUserAndExtractSubtree(child);
          if (result) return result;
        }
      }

      return null;
    };

    return findUserAndExtractSubtree(rootNode);
  };

  // Navigate to user (focus on them in mobile view)
  const navigateToUser = userId => {
    const userSubtree = extractUserSubtree(originalTreeData, userId);

    if (userSubtree) {
      focusOnNode(userSubtree);
      setShowEmptySlots(false);
      Alert.alert('Success', `Now viewing: ${userSubtree.name}`);
    } else {
      Alert.alert('Error', 'User not found in the tree');
    }
  };

  // Show full tree (restore original view)
  const showFullTree = () => {
    if (isFilteredView) {
      setTreeData(originalTreeData);
      setIsFilteredView(false);
    }

    setCurrentFocusNode(originalTreeData);
    setViewMode('full');

    const newExpandedNodes = {};
    newExpandedNodes[originalTreeData.userId] = true;
    setExpandedNodes(newExpandedNodes);
  };

  // Copy website URL
  const copyWebsiteURL = async () => {
    try {
      await Clipboard.setString(WEBSITE_URL);
      Alert.alert('Copied!', 'Website URL copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy URL to clipboard');
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchPaths([]);
      return;
    }

    const matchingUser = allUsers.find(
      user =>
        user.name.toLowerCase() === searchTerm.toLowerCase() ||
        user.userId.toLowerCase() === searchTerm.toLowerCase(),
    );

    if (matchingUser) {
      focusOnNode(matchingUser.fullData);
      setShowSuggestions(false);
    } else {
      Alert.alert('No Results', 'No users found matching your search term.');
    }
  };

  // Toggle node expansion (mobile-friendly)
  const toggleNode = userId => {
    const node = allUsers.find(user => user.userId === userId)?.fullData;
    if (node) {
      // When expanding a node, focus on it and show only its children
      if (!expandedNodes[userId]) {
        focusOnNode(node);
      } else {
        // If collapsing, go back to parent or root
        const newExpanded = { ...expandedNodes };
        delete newExpanded[userId];
        setExpandedNodes(newExpanded);
      }
    }
  };

  // Check if a node is highlighted
  const isHighlighted = node => {
    return searchResults.some(path =>
      path.some(pathNode => pathNode.userId === node.userId),
    );
  };

  // Check if node is in a search path
  const isInSearchPath = nodeId => {
    return searchPaths.some(path => path.includes(nodeId));
  };

  // Format number with commas
  const formatNumber = num => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Mobile-optimized tree rendering (show only focused node and its children)
  // Replace your renderMobileTree function with this updated version:

  const renderMobileTree = () => {
    if (!currentFocusNode) return null;

    const node = currentFocusNode;
    const isExpanded = expandedNodes[node.userId];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <View style={styles.mobileTreeContainer}>
        {/* Parent/Main Node */}
        <View style={styles.mobileNodeContainer}>
          {renderMobileNode(node, 0, 'root')}
        </View>

        {/* Children Nodes with Horizontal Scroll Support */}
        {isExpanded && hasChildren && (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.mobileChildrenContainer}
            style={styles.horizontalScrollContainer}
          >
            <View style={styles.mobileChildrenRow}>
              {node.children.map((child, index) => (
                <View key={child.userId} style={styles.mobileChildNode}>
                  {renderMobileNode(child, 1, index === 0 ? 'left' : 'right')}
                </View>
              ))}

              {/* If only one child, show empty slot */}
              {node.children.length === 1 && (
                <View style={styles.mobileChildNode}>
                  <View style={[styles.emptySlotNode, styles.mobileEmptySlot]}>
                    <Text style={styles.emptySlotText}>Empty Slot</Text>
                    <Text style={styles.emptySlotPosition}>
                      {node.children[0].position === 'left' ? 'Right' : 'Left'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Navigation buttons */}
        {hasChildren && (
          <View style={styles.mobileNavigation}>
            {node.children.map(child => (
              <TouchableOpacity
                key={child.userId}
                style={styles.mobileNavButton}
                onPress={() => focusOnNode(child)}
              >
                <Text style={styles.mobileNavButtonText}>
                  View {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render individual mobile node
  // Render individual mobile node
const renderMobileNode = (node, level, position) => {
  const isExpanded = expandedNodes[node.userId];
  const isNodeHighlighted = isHighlighted(node);
  const isPathNode = isInSearchPath(node.userId);
  const hasChildren = node.children && node.children.length > 0;

  // Use different style for children to ensure same dimensions
  let nodeStyle = level === 0 ? [styles.mobileUserBox] : [styles.mobileChildUserBox];
  
  if (level === 0) nodeStyle.push(styles.rootNode);
  else if (position === 'left') nodeStyle.push(styles.leftNode);
  else if (position === 'right') nodeStyle.push(styles.rightNode);
  if (isNodeHighlighted) nodeStyle.push(styles.highlighted);
  if (isPathNode && !isNodeHighlighted) nodeStyle.push(styles.pathNode);

  return (
    <View style={nodeStyle}>
      <View style={styles.userDetails}>
        <Text style={[styles.userName, level === 0 && { color: 'white' }]}>
          {node.name}
        </Text>
        <Text style={[styles.userId, level === 0 && { color: 'rgba(255,255,255,0.8)' }]}>
          ID: {node.userId}
        </Text>

        <View style={styles.userMetrics}>
          {/* PERFECT: Each metric in a centered row */}
          <View style={styles.metric}>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, level === 0 && { color: 'rgba(255,255,255,0.8)' }]}>
                Played Yesterday:
              </Text>
              <Text style={[styles.metricValue, level === 0 && { color: 'white' }]}>
                ₹{formatNumber(node.totalPlayedAmount || 0)}
              </Text>
            </View>
          </View>
          
          {/* Removed Bonus After Tax(tdy) metric */}
          
          <View style={styles.metric}>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, level === 0 && { color: 'rgba(255,255,255,0.8)' }]}>
                Total Bonus Received:
              </Text>
              <Text style={[styles.metricValue, level === 0 && { color: 'white' }]}>
                ₹{formatNumber(node.totalBonusReceivedTillDate || 0)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* PERFECT: Toggle button - EXACT CENTER of parent node */}
      {hasChildren && level === 0 && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => toggleNode(node.userId)}
        >
          <Text style={styles.toggleButtonText}>
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

  const renderEmptySlotItem = ({ item, index }) => (
    <View style={styles.emptySlotItem}>
      <View style={styles.slotInfo}>
        <View style={styles.slotParent}>
          <Text style={styles.parentName}>{item.parentName}</Text>
          <Text style={styles.parentId}>ID: {item.parentId}</Text>
        </View>
        <View style={styles.slotDetails}>
          <View style={styles.slotLevel}>
            <Text style={styles.slotLevelText}>Level {item.level}</Text>
          </View>
          <View style={styles.availablePositions}>
            {item.availablePositions.map(position => (
              <View
                key={position}
                style={[
                  styles.positionBadge,
                  position === 'left' ? styles.leftBadge : styles.rightBadge,
                ]}
              >
                <Text
                  style={[
                    styles.positionBadgeText,
                    position === 'left'
                      ? { color: '#2e7d32' }
                      : { color: '#f57c00' },
                  ]}
                >
                  {position.charAt(0).toUpperCase() + position.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.goToUserButton}
        onPress={() => navigateToUser(item.parentId)}
      >
        <Text style={styles.goToUserButtonText}>View User</Text>
      </TouchableOpacity>
    </View>
  );

  // Render search suggestions
  const renderSearchSuggestions = () => {
    if (!showSuggestions || searchSuggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        {searchSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`${suggestion.userId}-${index}`}
            style={styles.suggestionItem}
            onPress={() => handleSuggestionSelect(suggestion)}
          >
            <Text style={styles.suggestionName}>{suggestion.name}</Text>
            <Text style={styles.suggestionId}>ID: {suggestion.userId}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text style={styles.loadingText}>
          Loading your network structure...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="warning" size={48} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTreeData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!treeData) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Icon name="account-tree" size={48} color="#9e9e9e" />
        <Text style={styles.emptyText}>
          No network structure data available
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Note */}
      <View style={styles.noteContainer}>
        <View style={styles.noteTextContainer}>
          <Text style={styles.noteText}>
            For the best experience viewing the complete binary tree
            visualization, please open this website on a larger screen (like a
            laptop, desktop, or tablet).
          </Text>
          <View style={styles.websiteContainer}>
            <TouchableOpacity style={styles.urlButton} onPress={copyWebsiteURL}>
              <Icon name="link" size={14} color="#1976d2" />
              <Text style={styles.urlText}>{WEBSITE_URL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyWebsiteURL}
            >
              <Icon name="copy" size={12} color="white" />
              <Text style={styles.copyButtonText}>Copy URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          {currentFocusNode?.name
            ? `Viewing: ${currentFocusNode.name}`
            : 'Network Structure'}
        </Text>
        {currentFocusNode !== originalTreeData && (
          <TouchableOpacity style={styles.backButton} onPress={showFullTree}>
            <Text style={styles.backButtonText}>← Back to Root</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Data Note */}
      <View style={styles.dataNote}>
        <Icon name="schedule" size={14} color="#ff9800" />
        <Text style={styles.dataNoteText}>
          Note: Earnings data reflects the most recent day's earnings and
          refreshes daily.
        </Text>
      </View>

      {/* Search Section with Suggestions */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChangeText={handleSearchInputChange}
            placeholderTextColor="#999"
            onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Icon name="search" size={18} color="white" />
          </TouchableOpacity>
        </View>
        {renderSearchSuggestions()}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={showFullTree}>
          <Icon name="expand-more" size={14} color="#3f51b5" />
          <Text style={styles.controlButtonText}>Root View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.emptySlotsButton]}
          onPress={() => setShowEmptySlots(true)}
        >
          <Icon name="add-box" size={14} color="white" />
          <Text style={[styles.controlButtonText, { color: 'white' }]}>
            Empty Slots ({emptySlots.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mobile Tree Display */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.treeContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderMobileTree()}
      </ScrollView>

      {/* Empty Slots Modal */}
      <Modal
        visible={showEmptySlots}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmptySlots(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.emptySlotsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Empty Slots</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEmptySlots(false)}
              >
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalControls}>
              <View style={styles.sortControl}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() =>
                    setEmptySlotsSort(
                      emptySlotsSort === 'level' ? 'name' : 'level',
                    )
                  }
                >
                  <Text style={styles.sortButtonText}>
                    {emptySlotsSort === 'level' ? 'Level' : 'Name (A-Z)'}
                  </Text>
                  <Icon name="arrow-drop-down" size={14} color="#3f51b5" />
                </TouchableOpacity>
              </View>
              <View style={styles.slotsCount}>
                <Text style={styles.slotsCountText}>
                  Total: {emptySlots.length}
                </Text>
              </View>
            </View>

            <FlatList
              data={getSortedEmptySlots()}
              renderItem={renderEmptySlotItem}
              keyExtractor={(item, index) => `${item.parentId}-${index}`}
              style={styles.emptySlotsList}
              ListEmptyComponent={
                <View style={styles.noEmptySlots}>
                  <Text style={styles.noEmptySlotsText}>
                    No empty slots available in your network.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Updated StyleSheet with fixes for text overflow and horizontal scroll
// Complete Updated StyleSheet with Mobile Binary Tree fixes
// Complete Updated StyleSheet with Perfect Mobile Binary Tree
// Complete Updated StyleSheet with Mobile Binary Tree fixes
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
    paddingBottom: 80, // Add bottom padding for navigation
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e0',
    padding: 14,
    margin: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 35,
  },
  noteTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  noteText: {
    fontSize: 13,
    color: '#e65100',
    fontWeight: '500',
    lineHeight: 19,
    marginBottom: 10,
  },
  websiteContainer: {
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#90caf9',
    marginBottom: 8,
    width: '100%',
    justifyContent: 'center',
  },
  urlText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
    minWidth: 100,
  },
  copyButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3f51b5',
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  backButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  dataNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  dataNoteText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3f51b5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  // Search Suggestions Styles
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  suggestionId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbe1fd',
    minWidth: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlButtonText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#3f51b5',
    fontWeight: '500',
  },
  emptySlotsButton: {
    backgroundColor: '#ff5722',
    borderColor: '#e64a19',
  },
  treeContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    showsVerticalScrollIndicator: true,
    showsHorizontalScrollIndicator: false,
  },

  // ========== UPDATED MOBILE TREE STYLES ==========
  mobileTreeContainer: {
    padding: 16,
    alignItems: 'center',
    minHeight: screenHeight * 0.6,
  },

  mobileNodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },

  horizontalScrollContainer: {
    width: '100%',
    marginBottom: 20,
  },

  mobileChildrenContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Allow natural width
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },

  mobileChildrenRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Allow natural width
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },

  mobileChildNode: {
    // Give more width to child nodes
    width: screenWidth * 0.7, // 70% of screen width for each child
    marginHorizontal: 12, // More spacing between children
    alignItems: 'center',
  },

  // Parent node - full width
  mobileUserBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',

    // Parent takes full available width
    width: screenWidth - 80,
    minHeight: 200, // Use minHeight instead of fixed height

    // Perfect centering of ALL content
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  // Children nodes - wider for more details
  mobileChildUserBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',

    // Much wider for child nodes
    width: '100%', // Take full width of mobileChildNode container
    minHeight: 220, // Slightly taller for more content

    // Perfect centering
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  mobileEmptySlot: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    // Same width as other child nodes
    width: '100%',
    minHeight: 220,
  },

  emptySlotNode: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: 220,
  },

  emptySlotText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },

  emptySlotPosition: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },

  // Content container - perfectly centered
  userDetails: {
    width: '100%',
    flex: 1, // Take available space
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30, // More space for toggle button
  },

  // User name - centered
  userName: {
    fontSize: 15, // Slightly larger
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    numberOfLines: 2,
    ellipsizeMode: 'tail',
    width: '100%',
  },

  // User ID - centered
  userId: {
    fontSize: 12, // Slightly larger
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'monospace',
    numberOfLines: 1,
    ellipsizeMode: 'middle',
    width: '100%',
  },

  // Metrics container - more space
  userMetrics: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Each metric row
  metric: {
    width: '100%',
    marginBottom: 10, // More spacing
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Metric label and value - better spacing
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },

  metricLabel: {
    fontSize: 11, // Larger text
    color: '#666',
    flex: 1,
    textAlign: 'left',
    numberOfLines: 2, // Allow 2 lines for longer labels
    ellipsizeMode: 'tail',
  },

  metricValue: {
    fontSize: 12, // Larger text
    fontWeight: '600',
    color: '#3f51b5',
    textAlign: 'right',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
    minWidth: 70, // More space for larger values
  },

  // PERFECTLY CENTERED TOGGLE BUTTON
  toggleButton: {
    position: 'absolute',
    bottom: -18, // Slightly lower
    left: '55%',
    transform: [{ translateX: -18 }], // Perfect center using transform
    width: 36, // Larger button
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#3f51b5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },

  toggleButtonText: {
    fontSize: 20, // Larger icon
    color: '#3f51b5',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Node styling variants - enhanced colors
  rootNode: {
    backgroundColor: '#3f51b5',
    borderColor: '#2c3e97',
    shadowColor: '#3f51b5',
    shadowOpacity: 0.3,
  },

  leftNode: {
    borderColor: '#4caf50',
    backgroundColor: '#f1f8e9',
    shadowColor: '#4caf50',
    shadowOpacity: 0.2,
  },

  rightNode: {
    borderColor: '#03a9f4',
    backgroundColor: '#e3f2fd',
    shadowColor: '#03a9f4',
    shadowOpacity: 0.2,
  },

  highlighted: {
    borderColor: '#ff9800',
    backgroundColor: '#fff3e0',
    shadowColor: '#ff9800',
    shadowOpacity: 0.3,
  },

  pathNode: {
    borderColor: '#90caf9',
    backgroundColor: '#e3f2fd',
  },

  // Navigation buttons - wider for better touch
  mobileNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 25,
    paddingHorizontal: 20,
  },

  mobileNavButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },

  mobileNavButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    numberOfLines: 2,
    ellipsizeMode: 'tail',
  },

  // ========== END UPDATED MOBILE TREE STYLES ==========

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotsModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8faff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3f51b5',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 4,
  },
  modalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#3f51b5',
    marginRight: 4,
  },
  slotsCount: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotsCountText: {
    fontSize: 12,
    color: '#3f51b5',
    fontWeight: '600',
  },
  emptySlotsList: {
    maxHeight: screenHeight * 0.5,
    padding: 16,
  },
  emptySlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  slotInfo: {
    flex: 1,
    marginRight: 12,
  },
  slotParent: {
    marginBottom: 6,
  },
  parentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  parentId: {
    fontSize: 11,
    color: '#7f8c8d',
    fontFamily: 'monospace',
  },
  slotDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  slotLevel: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  slotLevelText: {
    fontSize: 10,
    color: '#3f51b5',
    fontWeight: '500',
  },
  availablePositions: {
    flexDirection: 'row',
  },
  positionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    borderWidth: 1,
  },
  leftBadge: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  rightBadge: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  positionBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  goToUserButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    minWidth: 70,
    alignItems: 'center',
  },
  goToUserButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  noEmptySlots: {
    alignItems: 'center',
    padding: 32,
  },
  noEmptySlotsText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Loading, Error, Empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#3f51b5',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9e9e9e',
    textAlign: 'center',
  },
});

export default UserBinaryTreeMobile;
