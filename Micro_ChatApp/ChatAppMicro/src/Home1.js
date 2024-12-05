import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

const Home1 = () => {
    const navigation = useNavigation()
    return (
        <View>
            <Text>Home1</Text>
            <Pressable onPress={() => navigation.navigate('Home2')}>
                <Text>Go to Home2</Text>
            </Pressable>
        </View>
    )
}

export default Home1

const styles = StyleSheet.create({})