import { boot } from 'quasar/wrappers';
import { useStore } from '../stores/store'; // this boot must occur after pinia
import { initializeApp } from 'firebase/app';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(
  ({
    /*app*/
    router,
  }) => {
    // Your web app's Firebase configuration
    const store = useStore();

    const firebaseConfig = {
      apiKey: 'AIzaSyBD2Yxv8_UcF5TZE5GZgDQPwwef30MH23o',
      authDomain: 'neuro-roster-7620d.firebaseapp.com',
      projectId: 'neuro-roster-7620d',
      storageBucket: 'neuro-roster-7620d.appspot.com',
      messagingSenderId: '667087864824',
      appId: '1:667087864824:web:5f50b4f2a45800254d8c0d',
    };

    // Initialize Firebase
    const firebaseApp = initializeApp(firebaseConfig);
    store.firebaseApp = firebaseApp;

    void enableIndexedDbPersistence(getFirestore());

    // Init auth
    onAuthStateChanged(getAuth(), (u) => {
      void store.setUser(u);
      void router.push('smoPage');
    });
  }
);
