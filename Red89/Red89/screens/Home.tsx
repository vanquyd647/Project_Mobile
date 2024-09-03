import React from 'react';
import { SafeAreaView, View, StyleSheet, TouchableOpacity, Text, FlatList, Image, Pressable } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Product from '../Data/Product';
import { RootStackParamList } from '../components/types';

const Home = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const [products, setProducts] = React.useState<{ product_name: string; price: number; image: string; sale: number; quantity: number; sold: number; star: number; category: string[]; type: string[]; product_id: string; }[]>([]);

    React.useEffect(() => {
        setProducts(Product);
    }, []);

    const Category = [
        { name: "Quần áo", id: 1 },
        { name: "Giày dép", id: 2 },
        { name: "Ba lô", id: 3 },
        { name: "Phụ kiện", id: 4 },
        { name: "Đồng hồ", id: 5 },
        { name: "Mỹ phẩm", id: 6 },
    ];

    const TopSale = [
        { name: "Áo thun nam", id: 1 },
        { name: "Quần jean nam", id: 2 },
        { name: "Giày thể thao", id: 3 },
        { name: "Ba lô thời trang", id: 4 },
        { name: "Đồng hồ nam", id: 5 },
        { name: "Mỹ phẩm nữ", id: 6 },
        { name: "Điện thoại iphone", id: 7 },
        { name: "Máy tính xách tay", id: 8 },
        { name: "Đồ gia dụng", id: 9 },
        { name: "Đồ chơi trẻ em", id: 10 },
    ];

    const handlePressCategory = (id: number) => {
        if (id === 1) {
            navigation.navigate('Clothes' as never);
        }
        if (id === 2) {
            navigation.navigate('Footwear' as never);
        }
        if (id === 3) {
            navigation.navigate('Backpack' as never);
        }
        if (id === 4) {
            navigation.navigate('Accessory' as never);
        }
        if (id === 5) {
            navigation.navigate('Watch' as never);
        }
        if (id === 6) {
            navigation.navigate('Cosmetics' as never);
        }
    };

    const renderCategory = ({ item }: { item: { name: string, id: number } }) => (
        <TouchableOpacity onPress={() => handlePressCategory(item.id)} style={styles.categoryBar}>
            <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderTopSale = ({ item }: { item: { name: string, id: number } }) => (
        <View style={styles.categoryBar}>
            <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
        </View>
    );

    const renderProduct = ({ item }: { item: typeof Product[0] }) => (
        <Pressable style={styles.productItem} onPress={() => navigation.navigate('ProductDetailsScreen', { product: item })}>
            <View>
                <View style={{ alignItems: 'center' }}>
                    <Image source={{ uri: item.image }} style={styles.productImage} />
                </View>
                <Text style={styles.productName}>{item.product_name}</Text>
                <View style={{ flexDirection: "row", alignItems: 'center' }}>
                    <Text style={styles.productPrice}>{item.price.toLocaleString()} VND</Text>
                    <Text style={{ marginLeft: 20, marginTop: 5, color: "red" }}>-{item.sale}%</Text>
                </View>
                <View style={{ flexDirection: "row", marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <AntDesign name="star" size={20} color="#FFD700" />
                        <Text style={styles.productStar}>{item.star}</Text>
                    </View>
                    <Text style={{}}>Đã bán: {item.sold}</Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.bar1}>
                <TouchableOpacity style={styles.SearchContainer}>
                    <View>
                        <AntDesign name="search1" size={24} color="black" />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={{ fontSize: 18 }}>Tìm kiếm</Text>
                    </View>
                </TouchableOpacity>
                <View style={{ margin: 10 }}>
                    <AntDesign name="bars" size={34} color="#006AF5" />
                </View>
            </View>
            <FlatList
                ListHeaderComponent={
                    <>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require("../assets/images/113730587_p0.png")} style={styles.imageBanner} />
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Text style={{ marginLeft: 20, fontSize: 20, fontWeight: 'bold' }}>Danh mục</Text>
                            <View style={styles.bar2}>
                                <FlatList
                                    data={Category}
                                    renderItem={renderCategory}
                                    keyExtractor={(item) => item.id.toString()}
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={false}
                                />
                            </View>
                        </View>
                        <View>
                            <Text style={{ marginLeft: 20, fontSize: 20, fontWeight: 'bold' }}>Top Sale</Text>
                            <View style={styles.bar2}>
                                <FlatList
                                    data={TopSale}
                                    renderItem={renderTopSale}
                                    keyExtractor={(item) => item.id.toString()}
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={false}
                                />
                            </View>
                        </View>
                        <View>
                            <Text style={{ marginLeft: 20, fontSize: 20, fontWeight: 'bold' }}>Sản phẩm gợi ý</Text>
                        </View>
                    </>
                }
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.product_id.toString()}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
            />
        </SafeAreaView>
    );
};

export default Home;

const styles = StyleSheet.create({
    bar1: {
        width: '100%',
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        borderWidth: 2,
        borderColor: '#006AF5',
        borderRadius: 20,
    },
    SearchContainer: {
        width: '80%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 2,
        borderColor: '#006AF5',
        borderRadius: 20,
    },
    bar2: {
        width: '100%',
        height: 100,
        flexDirection: 'column',
    },
    categoryBar: {
        margin: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#006AF5',
        padding: 10,
        width: 100,
    },
    imageBanner: {
        width: "98%",
        height: 216,
        borderRadius: 20,
    },
    body: {
        paddingBottom: 200,
    },
    productItem: {
        flex: 1,
        padding: 10,
        margin: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        justifyContent: 'center',
    },
    productImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'left',
        marginTop: 10,
    },
    productPrice: {
        fontSize: 14,
        color: '#006AF5',
        textAlign: 'left',
        marginTop: 5,
    },
    productStar: {
        fontSize: 16,
        color: '#FFD700',
    },
});
