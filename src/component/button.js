import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler'

const button = () => {
  return (
   <TouchableOpacity style={{   borderRadius:100, alignItems:'center', width:250, paddingVertical:5 , marginVertical:10}} onPress={Pressable}>
<Text style={{  fontWeight:'bold' }}>btnlabel</Text>
   </TouchableOpacity>
  )
}

export default button
const MainTabs = ({ route }) => {
  const { userId } = route.params;
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
    <LinearGradient colors={['black', 'pink']} style={styles.gradient}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = require('./src/assets/home.png');
            } else if (route.name === 'Chats') {
              iconName = require('./src/assets/chat.png');
            } else if (route.name === 'User') {
              iconName = require('./src/assets/user.png');
            } else if (route.name === 'Auction') {
              iconName = require('./src/assets/auction.png');
            } else if (route.name === 'Liked') {
              iconName = require('./src/assets/heart.png');
            }

            return (
              <View>
                <Image source={iconName} style={[styles.icon, focused && styles.focusedIcon]} />
                {route.name === 'Chats' && hasUnreadMessages && (
                  <View style={styles.redDot} />
                )}
              </View>
            );
          },
        })}
        tabBarOptions={{
          showIcon: true,
          showLabel: false, // Hide the labels
          style: {
            backgroundColor: 'black',
            borderTopWidth: 0,
          },
        }}
      >
        <Tab.Screen name="Home" component={Home1} />
        <Tab.Screen name="Auction" component={Auction} />
        <Tab.Screen name="Chats">
          {(props) => <Chatlist {...props} setHasUnreadMessages={setHasUnreadMessages} />}
        </Tab.Screen>
        <Tab.Screen name="Liked" component={Liked} />
        <Tab.Screen name="User" component={User} initialParams={{ userId }} />
      </Tab.Navigator>
    </LinearGradient>
  );
};
