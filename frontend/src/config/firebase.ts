import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCiYW0DLQwu6VN-BfbXyN6LqgN-u5W8vlA",
  authDomain: "hasatlink-33.firebaseapp.com",
  projectId: "hasatlink-33",
  storageBucket: "hasatlink-33.firebasestorage.app",
  messagingSenderId: "361061612129",
  appId: "1:361061612129:web:c88e45638c9dc84df50820",
  measurementId: "G-WWWCHP1TNM",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
