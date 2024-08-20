import { View, Text, ImageBackground } from 'react-native'
import React from 'react'

const background = ({children}) => {
  return (<>
    <View>
    <ImageBackground source={require("../assets/c.jpg")} style={{ height:"100%"}}/>
    </View>
    <View style={{position:"absolute"}}>
        {children}
    </View></>
  )
}

export default background