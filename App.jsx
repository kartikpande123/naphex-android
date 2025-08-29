import React from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignupPage from './components/Signup';
import Login from './components/Login';
import UserKyc from './components/userKyc';
import Home from './components/Home';
import ForgotPassword from './components/ForgotPassword';
import StatusCheck from './components/StatusCheck';
import About from './components/AboutUs';
import Help from './components/Help';
import UserGameHistory from './components/History';
import FriendsEarnings from './components/FriendsEarning';
import WelcomePopup from './components/WelcomPopup';
import TermsAndConditions from './components/TermsConditions';
import KycPolicy from './components/KYCPolicy.';
import PrivacyPolicy from './components/PrivacyPolicy';
import ResponsibleGaming from './components/Faq.';
import RulesAndRegulations from './components/GameRules';
import MyAccount from './components/MyAccount';
import OpenCloseGame from './components/Game1';
import ResultsDashboard from './components/Results';
import UserBinaryTreeMobile from './components/UserBinary';
import EntryFees from './components/EntryFees';
import NetworkChecker from './components/NetworkChecker';
import BankDetails from './components/BankDetails';
import AddTokens from './components/AddTokens';
import Withdraw from './components/Withdraw';
import TransactionHistory from './components/TransactionHistory';
import HowToPlay from './components/HowToPlay';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false // Hide header if you don't want it
        }}
      >
        <Stack.Screen name="Signup" component={SignupPage} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="UserKyc" component={UserKyc} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="StatusCheck" component={StatusCheck} />
        <Stack.Screen name="About" component={About} />
        <Stack.Screen name="Help" component={Help} />
        <Stack.Screen name="History" component={UserGameHistory} />
        <Stack.Screen name="Earnings" component={FriendsEarnings} />
        <Stack.Screen name="WelcomePopup" component={WelcomePopup} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
        <Stack.Screen name="KycPolicy" component={KycPolicy} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="Faqs" component={ResponsibleGaming} />
        <Stack.Screen name="MyAccount" component={MyAccount} />
        <Stack.Screen name="GameRules" component={RulesAndRegulations} />
        <Stack.Screen name="Game1" component={OpenCloseGame} />
        <Stack.Screen name="Results" component={ResultsDashboard} />
        <Stack.Screen name="EntryFees" component={EntryFees} />
        <Stack.Screen name="NetworkChecker" component={NetworkChecker} />
        <Stack.Screen name="BankDetails" component={BankDetails} />
        <Stack.Screen name="AddTokens" component={AddTokens} />
        <Stack.Screen name="Withdraw" component={Withdraw} />
        <Stack.Screen name="HowToPlay" component={HowToPlay} />
        <Stack.Screen name="UserBinaryTreeMobile" component={UserBinaryTreeMobile} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;