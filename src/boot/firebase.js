import { boot } from 'quasar/wrappers';
import { useStore } from '../stores/store'; // this boot must occur after pinia
import { initializeApp } from 'firebase/app';
import { onAuthStateChanged, getAuth } from 'firebase/auth';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(
  (
    {
      /*app*/
    }
  ) => {
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
    store.setFirebase(firebaseApp);

    // Init auth
    onAuthStateChanged(getAuth(), (u) => store.setUser(u));
  }
);
