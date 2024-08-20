// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image, StyleSheet, View } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore, auth } from './src/firebase/firebaseconfig'; 
import SplashScreen from './src/pages/splashscreen';
import Emailverify from './src/pages/emailverify';
import Home1 from './src/pages/Home1';
import Auction from './src/pages/auction';
import User from './src/pages/user';
import Additems from './src/pages/additems';
import Viewandedit from './src/pages/useritems/viewandedit';
import Setting from './src/pages/useritems/settings';
import Help from './src/pages/useritems/help';
import Loginscreen from './src/pages/loginscreen';
import Coin1 from './src/pages/categorieslist/coin1';
import Gewels1 from './src/pages/categorieslist/gewels1';
import Art1 from './src/pages/categorieslist/art1';
import Toy1 from './src/pages/categorieslist/toy';
import Fashion1 from './src/pages/categorieslist/fashion1';
import ProductDetails from './src/pages/productdetails';
import LocationScreen from './src/pages/locationscreen';
import UploaderDetails from './src/pages/uploaderdetails';
import Liked from './src/pages/liked';
import Myads from './src/pages/useritems/myads';
import Selectlanguage from './src/pages/useritems/selectlanguage';
import Chat from './src/chat';
import Chatlist from './src/chatlist';
import Notifications from './src/pages/notifications';
import Friends from './src/pages/chating/friends';
import Antique1 from './src/pages/categorieslist/antique1';
import Book1 from './src/pages/categorieslist/book1';
import Music1 from './src/pages/categorieslist/music1';
import Vehicle1 from './src/pages/categorieslist/vehicle1';
import Tool1 from './src/pages/categorieslist/tool1';
import Scientificitem1 from './src/pages/categorieslist/scientificitem1';
import Other1 from './src/pages/categorieslist/other1';
import CustomTabBar from './src/component/customtabbar';
import Verification from './src/pages/useritems/verifications/verification';
import Idproof from './src/pages/useritems/verifications/idprrof';
import FacialRecognition from './src/pages/useritems/verifications/facerecognition';
import ChangePassword from './src/pages/useritems/settings/changepassword';
import Location from './src/component/location';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = ({ route }) => {
  const { userId ,location} = route.params;
  
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    const chatsRef = collection(firestore, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let hasUnread = false;
      snapshot.forEach((doc) => {
        const messages = doc.data().messages;
        const unreadMessages = messages.some(
          (msg) => msg.recipientId === userId && !msg.isRead
        );
        if (unreadMessages) {
          hasUnread = true;
        }
      });
      setHasUnreadMessages(hasUnread);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}screenOptions={{ headerShown: false }} 
  >
    <Tab.Screen 
      name="Home" 
      component={Home1} 
      initialParams={{ location }}
      options={{ 
        tabBarIcon: ({ color }) => (
          <Image source={require('./src/assets/home.png')} style={{ tintColor: color, width: 24, height: 24 }} />
        ),
      }}
    />
    <Tab.Screen 
      name="Auction" 
      component={Auction} 
      options={{ 
        tabBarIcon: ({ color }) => (
          <Image source={require('./src/assets/auction.png')} style={{ tintColor: 'white', width: 24, height: 24 }} />
        ),
      }}
    />
    <Tab.Screen 
      name="Chats" 
      options={{
        tabBarIcon: ({ color }) => (
          <View>
            <Image source={require('./src/assets/chat.png')} style={{ tintColor: color, width: 24, height: 24 }} />
            {hasUnreadMessages && <View style={styles.redDot} />}
          </View>
        ),
      }}
    >
      {props => <Chatlist {...props} setHasUnreadMessages={setHasUnreadMessages} />}
    </Tab.Screen>
    <Tab.Screen 
      name="Liked" 
      component={Liked} 
      options={{ 
        tabBarIcon: ({ color }) => (
          <Image source={require('./src/assets/heart.png')} style={{ tintColor: color, width: 24, height: 24 }} />
        ),
      }}
    />
    <Tab.Screen 
      name="User" 
      component={User} 
      initialParams={{ userId }} 
      options={{ 
        tabBarIcon: ({ color }) => (
          <Image source={require('./src/assets/user.png')} style={{ tintColor: color, width: 24, height: 24 }} />
        ),
      }}
    />
  </Tab.Navigator>
);
};

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  if (initializing) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>

             
              <Stack.Screen name="Loginscreen" component={Loginscreen} />
              <Stack.Screen name="Emailverify" component={Emailverify}/>
              
            </>
          ) : (
            <>
               

              <Stack.Screen name="MainTabs" component={MainTabs} initialParams={{userId:user.uid}} />
              <Stack.Screen name="LocationScreen">
                {(props) => <LocationScreen {...props} setLocation={setLocation} />}
              </Stack.Screen>
              <Stack.Screen name="Location">
                {(props) => <Location {...props} setLocation={setLocation} />}
              </Stack.Screen>
              <Stack.Screen name="ProductDetails" component={ProductDetails} />
              <Stack.Screen name="UploaderDetails" component={UploaderDetails} />
              <Stack.Screen name="Viewandedit" component={Viewandedit} />
              <Stack.Screen name="Setting" component={Setting} />
              <Stack.Screen name="Help" component={Help} />
              <Stack.Screen name="Additems" component={Additems} />
              <Stack.Screen name="Coin1" component={Coin1} />
              <Stack.Screen name="Gewels1" component={Gewels1} />
              <Stack.Screen name="Art1" component={Art1} />
              <Stack.Screen name="Toy1" component={Toy1} />
              <Stack.Screen name="Fashion1" component={Fashion1} />
              <Stack.Screen name="Myads" component={Myads} />
              <Stack.Screen name="Selectlanguage" component={Selectlanguage} />
              <Stack.Screen name="Chat" component={Chat} />
              <Stack.Screen name="Notifications" component={Notifications} />
              <Stack.Screen name="Friends" component={Friends} />
              <Stack.Screen name="Antique1" component={Antique1} />
              <Stack.Screen name="Book1" component={Book1} />
              <Stack.Screen name="Music1" component={Music1} />
              <Stack.Screen name="Vehicle1" component={Vehicle1} />
              <Stack.Screen name="Tool1" component={Tool1} />
              <Stack.Screen name="Scientificitem1" component={Scientificitem1} />
              <Stack.Screen name="Other1" component={Other1} />
              <Stack.Screen name="Verification" component={Verification} />
              <Stack.Screen name="Idproof" component={Idproof} />
              <Stack.Screen name="FacialRecognition" component={FacialRecognition} />
              <Stack.Screen name="ChangePassword" component={ChangePassword} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  redDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
});

export default App;
