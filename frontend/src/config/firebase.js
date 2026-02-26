// Firebase configuration for Croply AI
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAbar02wUJiIKbCObtJkh1sUa1Pd7gRQGs",
  authDomain: "auth-plant-disease-detection.firebaseapp.com",
  projectId: "auth-plant-disease-detection",
  storageBucket: "auth-plant-disease-detection.firebasestorage.app",
  messagingSenderId: "246270710518",
  appId: "1:246270710518:web:a262f9c85f878616e012d7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
