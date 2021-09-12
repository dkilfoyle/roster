import { boot } from 'quasar/wrappers';
import VueGapiPlugin from 'vue-gapi';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }) => {
  // something to do
  app.use(VueGapiPlugin, {
    clientId:
      '1011161498080-n0mgi39ejq7e2i5aj1u9rv7jmvdb2fgn.apps.googleusercontent.com',
    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  });
  console.log('Boot VueGapi');
  app.provide('gapi', app.config.globalProperties.$gapi);
});
