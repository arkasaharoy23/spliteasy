import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBy4N45u7jBxljLlbcFAI0t7JzTqo4nYao",
  authDomain: "campusplit-fb911.firebaseapp.com",
  projectId: "campusplit-fb911",
  storageBucket: "campusplit-fb911.firebasestorage.app",
  messagingSenderId: "576717833488",
  appId: "1:576717833488:web:2238416f1c343a809a9195",
  measurementId: "G-C701STME19"
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();