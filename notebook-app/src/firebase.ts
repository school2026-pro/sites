import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
export const app=initializeApp({
 apiKey:'AIzaSyCDro4r49slq0S6nMT9olFpO85vnVJHgG8',
 authDomain:'school-pro-a9d2a.firebaseapp.com',
 projectId:'school-pro-a9d2a',
 storageBucket:'school-pro-a9d2a.firebasestorage.app',
 messagingSenderId:'838111995442',
 appId:'1:838111995442:web:ac24781047c3f61873fe2b'
});
export const auth=getAuth(app);
auth.languageCode='ja';
