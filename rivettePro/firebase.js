// Import the functions you need from the SDKs you need
require('dotenv').config();
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where } = require("firebase/firestore");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Function to save order to Firestore
async function saveOrder(orderData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      timestamp: new Date(),
    });
    console.log("Order saved with ID: ", docRef.id);
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Error saving order: ", error);
    return { success: false, error: error.message };
  }
}

// Function to get orders by customer phone
async function getOrdersByPhone(phone) {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error("Error getting orders: ", error);
    throw error;
  }
}

module.exports = { 
  db,
  saveOrder,
  getOrdersByPhone
};