import {initializeApp,getApps} from "firebase/app";
import {getDatabase} from "firebase/database";
import {getAuth} from "firebase/auth";

const config={
  apiKey:"AIzaSyDlowz8JwEwKFSb0gAjwLGHLo3P70_q4YA",
  authDomain:"parktags-a9582.firebaseapp.com",
  databaseURL:"https://parktags-a9582-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"parktags-a9582",
  storageBucket:"parktags-a9582.firebasestorage.app",
  messagingSenderId:"89730867013",
  appId:"1:89730867013:web:892093a538dba9bebf682c"
};
const app=initializeApp(config);
export const db=getDatabase(app),auth=getAuth(app);
// Second app instance so an admin can create accounts without being signed out.
export const auxAuth=()=>getAuth(getApps().find(a=>a.name==="aux")||initializeApp(config,"aux"));
