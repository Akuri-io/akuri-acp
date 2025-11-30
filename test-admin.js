const http = require('http');

const baseUrl = 'http://localhost:3001';

const tests = [
  { path: '/admin', description: 'Dashboard principal' },
  { path: '/admin/extensiones', description: 'Página de extensiones' },
  { path: '/admin/install', description: 'Página de instalación' },
  { path: '/admin/rutas', description: 'Página de rutas' },
  { path: '/', description: 'Ruta raíz (información del sistema)' },
  { path: '/index.html', description: 'Archivo estático directo (debe dar 404)' },
];

console.log('🧪 Probando rutas de administración...\n');

let completedTests = 0;

tests.forEach((test, index) => {
  setTimeout(() => {
    const url = baseUrl + test.path;

    http.get(url, (res) => {
      const statusCode = res.statusCode;
      const isSuccess = (test.path === '/index.html') ?
        statusCode === 404 : statusCode === 200;

      console.log(`${isSuccess ? '✅' : '❌'} ${test.description}: ${statusCode} - ${url}`);

      if (++completedTests === tests.length) {
        console.log('\n🎉 Pruebas completadas!');
        process.exit(0);
      }
    }).on('error', (err) => {
      console.log(`❌ ${test.description}: ERROR - ${err.message}`);
      if (++completedTests === tests.length) {
        console.log('\n🎉 Pruebas completadas!');
        process.exit(0);
      }
    });
  }, index * 200); // Espaciar las pruebas
});