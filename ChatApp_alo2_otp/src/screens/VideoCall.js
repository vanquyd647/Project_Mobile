// import React from 'react';
// import { View, StyleSheet } from 'react-native';
// import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';

// const VideoCall = () => {
//     const { callerUid, recipientUid, name } = route.params;
//     const appID = 645083743; // ZEGOCLOUD AppID
//     const appSign = '94fe5488187b65d890162a351c348bc530302979a906a8f997a5d48f6d348fa2'; // ZEGOCLOUD AppSign
//     const userID = callerUid // Replace with actual user ID
//     const userName = name; // Replace with actual user name
//     const callID = recipientUid; // Replace with actual unique call ID

//     return (
//         <View style={styles.container}>
//             <ZegoUIKitPrebuiltCall
//                 appID={appID}
//                 appSign={appSign}
//                 userID={userID}
//                 userName={userName}
//                 callID={callID}
//                 config={{
//                     ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
//                     onOnlySelfInRoom: () => { navigation.goBack() },
//                     onHangUp: () => { navigation.goBack() },
//                 }}
//             />
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 0,
//     },
// });

// export default VideoCall

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const VideoCall = () => {
  return (
    <View>
      <Text>VideoCall</Text>
    </View>
  )
}

export default VideoCall

const styles = StyleSheet.create({})