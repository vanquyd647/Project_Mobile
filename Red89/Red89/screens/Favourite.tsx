import { StyleSheet, Text, View, Image, Dimensions } from 'react-native'
import React from 'react'

const Favourite = () => {
    const screenWidth = Dimensions.get('window').width;
    const imageWidth = (screenWidth - 40) / 2; // Chừa 20 px cho mỗi bên và 20 px cho khoảng cách giữa hai ảnh

    return (
        <View style={styles.container}>
            <Text>Favourite</Text>
            <View style={styles.imageContainer}>
                <Image style={[styles.image, { width: imageWidth }]} source={require('../assets/images/vn2.jpg')} />
                <Image style={[styles.image, { width: imageWidth }]} source={require('../assets/images/vn2.jpg')} />
            </View>
        </View>
    )
}

export default Favourite

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    imageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    image: {
        height: 200,
    },
})
