import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const BottomNavigation = ({ activeTab }) => {
  const navigation = useNavigation();
  const [pressedTab, setPressedTab] = useState(null);

  const handleBottomNavigation = (tab) => {
    if (tab === 'Home') {
      navigation.navigate('Home');
    } else if (tab === 'MyAccount') {
      navigation.navigate('MyAccount');
    } else if (tab === 'History') {
      navigation.navigate('History');
    } else if (tab === 'About') {
      navigation.navigate('About');
    }
  };

  const navigationItems = [
    { name: 'Home', icon: 'home', key: 'Home' },
    { name: 'My Account', icon: 'account', key: 'MyAccount' },
    { name: 'History', icon: 'clock', key: 'History' },
    { name: 'About Us', icon: 'information', key: 'About' },
  ];

  return (
    <View style={styles.bottomNavigation}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.bottomNavGradient}
      >
        {navigationItems.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.bottomNavItem}
            onPress={() => handleBottomNavigation(tab.key)}
            onPressIn={() => setPressedTab(tab.key)}
            onPressOut={() => setPressedTab(null)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.navIconContainer,
              activeTab === tab.key && styles.activeNavIconContainer,
              pressedTab === tab.key && styles.pressedNavIconContainer
            ]}>
              <Icon
                name={tab.icon}
                size={24}
                color={
                  activeTab === tab.key || pressedTab === tab.key 
                    ? '#ffffff' 
                    : 'rgb(42, 82, 152)'
                }
              />
            </View>
            <Text
              style={[
                styles.bottomNavText,
                activeTab === tab.key && styles.activeBottomNavText,
                pressedTab === tab.key && styles.pressedBottomNavText,
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    position: 'absolute',
    bottom: 25,
    left: 15,
    right: 15,
    borderRadius: 25,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  bottomNavGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    transition: 'all 0.2s ease',
  },
  activeNavIconContainer: {
    backgroundColor: 'rgb(42, 82, 152)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pressedNavIconContainer: {
    backgroundColor: 'rgb(42, 82, 152)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    transform: [{ scale: 0.95 }],
  },
  bottomNavText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeBottomNavText: {
    color: 'rgb(42, 82, 152)',
    fontWeight: 'bold',
  },
  pressedBottomNavText: {
    color: 'rgb(42, 82, 152)',
    fontWeight: 'bold',
  },
});

export default BottomNavigation;