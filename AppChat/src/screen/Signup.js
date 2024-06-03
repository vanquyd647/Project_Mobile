import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, StatusBar, Alert, Modal, Pressable } from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';



export default function Signup({ navigation, setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2000');
  const [photoURL, setPhotoURL] = useState('');
  const db = getFirestore();

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 120 }, (_, i) => (2024 - i).toString());

 

  const validateEmail = (email) => {
    // Regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isPasswordValid = () => {
    if (password !== confirmPassword) {
      Alert.alert("Signup error", "Mật khẩu xác nhận không khớp");
      return false;
    }
    return true;
  };


  const onHandleSignup = () => {
    if (email.trim() === "" && password.trim() === "" && confirmPassword.trim() === "" && name.trim() === "") {
      Alert.alert("Thông tin không được để trống");
    } else if (email.trim() === "") {
      Alert.alert("Email không được để trống");
    } else if (!validateEmail(email)) {
      Alert.alert("Email không đúng định dạng");
    } else if (password.trim() === "") {
      Alert.alert("Mật khẩu không được để trống")
    } else if (confirmPassword.trim() === "") {
      Alert.alert("Mật khẩu xác nhận không được để trống")
    } else if (name.trim() === "") {
      Alert.alert("Tên không được để trống")
    } else if (password.trim() === "") {
      Alert.alert("Mật khẩu không được để trống");
    } else if (password.length < 6) {
      Alert.alert("Mật khẩu phải có ít nhất 6 kí tự");
    } else if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      Alert.alert("Mật khẩu phải chứa ít nhất 1 chữ số và 1 chữ cái");
    } else {
      if (!isPasswordValid()) {
        return;
      }

      
      verify();
    }
  };


  const verify = () => {
    
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        updateProfile(userCredential.user, {
          displayName: name
        }).then(() => {
          setDoc(doc(db, "users", userCredential.user.uid), {
            name: name,
            UID: userCredential.user.uid,
            email: email,
            birthdate: `${day}/${month}/${year}`,
            photoURL: 'https://firebasestorage.googleapis.com/v0/b/demo1-sub.appspot.com/o/avatar.png?alt=media&token=6a858af1-78f4-4ef3-b935-7561c91e680d'
          }).then(() => {
            setIsLoggedIn(true);
            Alert.alert(
              'Đăng ký thành công',
              'Bạn đã đăng kí thành công!',
              [{ text: 'OK' }]
            );
          }).catch((error) => {
            console.log("Error adding document: ", error);
          });
        }).catch((error) => {
          console.log("Update profile error: ", error);
        });

      })
      .catch((err) => Alert.alert("Signup error", err.message));



  };



  return (
    <View style={styles.container}>
      <View style={styles.whiteSheet} />
      <View style={styles.form}>
        <Text style={styles.title}>Đăng Ký</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoFocus={true}
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <View style={[styles.input, styles.passwordInputContainer]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mật khẩu"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
            textContentType="password"
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="gray" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Xác nhận mật khẩu"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!showPassword}
          textContentType="password"
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Tên"
          autoCapitalize="words"
          value={name}
          onChangeText={(text) => setName(text)}
        />
        <View>
          <Text style={styles.radioLabel}>Ngày sinh</Text>
          <View style={styles.datePickerContainer}>
            <Picker
              style={styles.datePicker}
              selectedValue={day}
              onValueChange={(itemValue, itemIndex) => setDay(itemValue)}
            >
              {days.map((day) => (
                <Picker.Item label={day} value={day} key={day} />
              ))}
            </Picker>
            <Picker
              style={styles.datePicker}
              selectedValue={month}
              onValueChange={(itemValue, itemIndex) => setMonth(itemValue)}
            >
              {months.map((month) => (
                <Picker.Item label={month} value={month} key={month} />
              ))}
            </Picker>
            <Picker
              style={styles.datePicker}
              selectedValue={year}
              onValueChange={(itemValue, itemIndex) => setYear(itemValue)}
            >
              {years.map((year) => (
                <Picker.Item label={year} value={year} key={year} />
              ))}
            </Picker>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={onHandleSignup}>
          <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 18 }}>Đăng Ký</Text>
        </TouchableOpacity>
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'center' }}>
          <Text style={{ color: 'gray', fontWeight: '600', fontSize: 14 }}>Bạn đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={{ color: '#006AF5', fontWeight: '600', fontSize: 14 }}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>


      <StatusBar barStyle="light-content" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: "#006AF5",
    paddingBottom: 24,
  },
  input: {
    backgroundColor: "#F6F7FB",
    height: 58,
    marginBottom: 20,
    fontSize: 16,
    borderRadius: 10,
    padding: 12,
  },
  whiteSheet: {
    width: '100%',
    height: '75%',
    position: "absolute",
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 60,
  },
  form: {
    flex: 1,
    marginTop: 50,
    marginHorizontal: 30,
  },
  button: {
    backgroundColor: '#006AF5',
    height: 58,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    fontSize: 16,
    flex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
  },
  radioContainer: {
    marginTop: 20,
  },
  radioLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  radioOptions: {
    flexDirection: 'row',
  },
  radioButtonMale: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 5,
  },
  radioButtonFMale: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 5,
  },
  selectedRadioButton: {
    backgroundColor: '#006AF5',
    borderColor: '#006AF5',
  },
  radioText: {
    color: 'black',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePicker: {
    flex: 1,
    height: 58,
    backgroundColor: "#F6F7FB",
    borderRadius: 10,
    marginRight: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#006AF5',
    marginTop: 20,
    width: '100%',
    height: 58,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});