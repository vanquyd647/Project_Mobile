import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useContext, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SongItem from "../components/SongItem";
import { Player } from "../PlayerContext";
import { BottomModal } from "react-native-modals";
import { ModalContent } from "react-native-modals";
import { Audio } from "expo-av";
import { debounce } from "lodash";

const SearchScreen = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [input, setInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedTracks, setSavedTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const { currentTrack, setCurrentTrack } = useContext(Player);
  const [modalVisible, setModalVisible] = useState(false);
  const [progress, setProgress] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentSound, setCurrentSound] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState("#0A2647");
  const colors = [
    "#27374D",
    "#1D267D",
    "#BE5A83",
    "#212A3E",
    "#917FB3",
    "#37306B",
    "#443C68",
    "#5B8FB9",
    "#144272",
  ];
  

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    console.log("hi");
    const accessToken = await AsyncStorage.getItem("token");
    console.log("accesssssed token", accessToken);
    try {
      const accessToken = await AsyncStorage.getItem("token");
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.log("Error fetching profile:", error.message);
    }
  };
 
  const handleSearch = async (text) => {
    try {
      setLoading(true);
      
      const accessToken = await AsyncStorage.getItem("token");
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${text}&type=track`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      console.log(data)
      setSearchResults(data.tracks.items);
      setSavedTracks(data.tracks.items);
      console.log(data.tracks.items)
      setLoading(false);
    } catch (error) {
      console.log("Error occurred while searching:", error.message);
      setLoading(false);
    }
  };



  const debouncedSearch = debounce(handleSearch, 800);

  const handleInputChange = (text) => {
    setInput(text);
    if (text.trim() !== '') {
      debouncedSearch(text);
    }
  };

  // useEffect(() => {
  //   getSavedTracks();
  // }, []);


  const play = async (nextTrack) => {
    console.log(nextTrack);
    const preview_url = nextTrack?.preview_url;
    try {
      if (currentSound) {
        await currentSound.stopAsync();
      }
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      const { sound, status } = await Audio.Sound.createAsync(
        {
          uri: preview_url,
        },
        {
          shouldPlay: true,
          isLooping: false,
        },
        onPlaybackStatusUpdate
      );
      onPlaybackStatusUpdate(status);
      setCurrentSound(sound);
      setIsPlaying(status.isLoaded);
      await sound.playAsync();
    } catch (err) {
      console.log(err.message);
    }
  };
  const onPlaybackStatusUpdate = async (status) => {
    console.log(status);
    if (status.isLoaded && status.isPlaying) {
      const progress = status.positionMillis / status.durationMillis;
      console.log("progresss", progress);
      setProgress(progress);
      setCurrentTime(status.positionMillis);
      setTotalDuration(status.durationMillis);
    }

    if (status.didJustFinish === true) {
      setCurrentSound(null);
      playNextTrack();
    }
  };

  const circleSize = 12;
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayPause = async () => {
    if (currentSound) {
      if (isPlaying) {
        await currentSound.pauseAsync();
      } else {
        await currentSound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };
  const extractColors = async () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    const randomColor = colors[randomIndex];
    setBackgroundColor(randomColor);
  };

  const value = useRef(0);
  const playNextTrack = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      setCurrentSound(null);
    }
    value.current += 1;
    if (value.current < savedTracks.length) {
      const nextTrack = savedTracks[value.current];
      setCurrentTrack(nextTrack);
      extractColors();
      await play(nextTrack);
    } else {
      console.log("end of playlist");
    }
  };

  const playPreviousTrack = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      setCurrentSound(null);
    }
    value.current -= 1;
    if (value.current < savedTracks.length) {
      const nextTrack = savedTracks[value.current];
      setCurrentTrack(nextTrack);

      await play(nextTrack);
    } else {
      console.log("end of playlist");
    }
  };
  const handlePress = () => {
    setCurrentTrack(item);
    onPress(item)
  }

  return (
   <>
    <LinearGradient colors={["#040306", "#131624"]} style={{flex:1}}>
      
        <View style={{
                marginTop:50,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,}}>
          <Image
            style={{width: 40,
              height: 40,
              borderRadius: 20,
              resizeMode: "cover",}}
            source={{ uri: userProfile?.images[0].url }}
          />
          <Text style={{color: "white",
              fontSize: 16,
              fontWeight: "bold",}}
              >Tìm Kiếm</Text>
        </View>
        <View style={{padding: 10,}}>
          <Pressable style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: "white",
              padding: 9,
              borderRadius: 3,
              height: 38,
              width: '100%',
            }}>
            <AntDesign name="search1" size={20} color="black" />
            <TextInput
              value={input}
              onChangeText={(text) => handleInputChange(text)}
              placeholder="Bạn muốn nghe gì?"
              placeholderTextColor={"black"}
              style={{
                flex: 1,
                marginLeft: 10,
                fontWeight: '500',
                color: 'black',
                width: '100%',
              }}
            />
          </Pressable>
          
        </View>
        <ScrollView style={{marginBottom:50}}>
        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" style={{marginTop:20}} />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <Pressable 
              
              onPress={() => {
                setCurrentTrack(item);
                play(item);
                setCurrentlyPlayingId(item.id); // Set the currently playing item ID

              }} isPlaying={item === currentTrack} style={{ flexDirection: "row", alignItems: "center", padding: 10, }}>
                <Image
                  style={{ width: 50, height: 50, marginRight: 10 }}
                  source={{ uri: item?.album?.images[0].url }}
                />
                <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={
                    currentlyPlayingId === item.id // Check if this item is currently playing
                      ? {
                          fontWeight: "bold",
                          fontSize: 14,
                          color: "#3FFF00",
                        }
                      : { fontWeight: "bold", fontSize: 14, color: "white" }
                  }
                >
                  {item?.name}
                </Text>
                <Text style={{ marginTop: 4, color: "#989898" }}>
                  {item?.artists[0].name}
                </Text>
                </View>
              </Pressable>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        )}
      </ScrollView>
    </LinearGradient>
    {currentTrack && (
        <Pressable
          onPress={() => setModalVisible(!modalVisible)}
          style={{
            backgroundColor: "#020024",
            width: "90%",
            padding: 10,
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: 15,
            position: "absolute",
            borderRadius: 6,
            left: 20,
            bottom: 40,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              style={{ width: 40, height: 40 }}
              source={{ uri: currentTrack?.album?.images[0].url }}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                width: 220,
                color: "white",
                fontWeight: "bold",
              }}
            >
              {currentTrack?.name} •{" "}
              {currentTrack?.artists[0].name}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AntDesign name="heart" size={24} color="#1DB954" />
            <Pressable>
              <AntDesign name="pausecircle" size={24} color="white" />
            </Pressable>
          </View>
        </Pressable>
      )}

    <BottomModal
        visible={modalVisible}
        onHardwareBackPress={() => setModalVisible(false)}
        swipeDirection={["up", "down"]}
        swipeThreshold={200}
      >
        <ModalContent
          style={{ height: "100%", width: "100%", backgroundColor: "#020024" }}
        >
          <View style={{ height: "100%", width: "100%",  }}>
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <AntDesign
                onPress={() => setModalVisible(!modalVisible)}
                name="down"
                size={24}
                color="white"
              />

              <Text
                style={{ fontSize: 14, fontWeight: "bold", color: "white" }}
              >
                {currentTrack?.name}
              </Text>

              <Entypo name="dots-three-vertical" size={24} color="white" />
            </Pressable>

            <View style={{ height: 70 }} />

            <View style={{ padding: 10 }}>
              <Image
                style={{ width: "100%", height: 330, borderRadius: 4 }}
                source={{ uri: currentTrack?.album?.images[0].url }}
              />
              <View
                style={{
                  marginTop: 20,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text
                    style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
                  >
                    {currentTrack?.name}
                  </Text>
                  <Text style={{ color: "#D3D3D3", marginTop: 4 }}>
                    {currentTrack?.artists[0].name}
                  </Text>
                </View>

                <AntDesign name="heart" size={24} color="#1DB954" />
              </View>

              <View style={{ marginTop: 10 }}>
                <View
                  style={{
                    width: "100%",
                    marginTop: 10,
                    height: 3,
                    backgroundColor: "gray",
                    borderRadius: 5,
                  }}
                >
                  <View
                    style={[
                      styles.progressbar,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      {
                        position: "absolute",
                        top: -5,
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize / 2,
                        backgroundColor: "white",
                      },
                      {
                        left: `${progress * 100}%`,
                        marginLeft: -circleSize / 2,
                      },
                    ]}
                  />
                </View>
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 15, color: "#D3D3D3" }}
                  >
                    {formatTime(currentTime)}
                  </Text>

                  <Text
                    style={{ color: "white", fontSize: 15, color: "#D3D3D3" }}
                  >
                    {formatTime(totalDuration)}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 17,
                }}
              >
                <Pressable>
                  <FontAwesome name="arrows" size={30} color="#03C03C" />
                </Pressable>
                <Pressable onPress={playPreviousTrack}>
                  <Ionicons name="play-skip-back" size={30} color="white" />
                </Pressable>
                <Pressable onPress={handlePlayPause}>
                  {isPlaying ? (
                    <AntDesign name="pausecircle" size={60} color="white" />
                  ) : (
                    <Pressable
                      onPress={handlePlayPause}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: "white",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Entypo name="controller-play" size={26} color="black" />
                    </Pressable>
                  )}
                </Pressable>
                <Pressable onPress={playNextTrack}>
                  <Ionicons name="play-skip-forward" size={30} color="white" />
                </Pressable>
                <Pressable>
                  <Feather name="repeat" size={30} color="#03C03C" />
                </Pressable>
              </View>
            </View>
          </View>
        </ModalContent>
      </BottomModal>
    </> 
  );
};

const styles = StyleSheet.create({
});

export default SearchScreen;
