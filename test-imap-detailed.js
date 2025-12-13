// Detailed IMAP test
const Imap = require('imap');

const imap = new Imap({
  user: 'team@vibrationfit.com',
  password: 'eikpjpskmhqpmsug',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  authTimeout: 30000,
  connTimeout: 30000,
  debug: console.log // Show ALL debug info
});

console.log('🔄 Attempting to connect to Gmail IMAP...');
console.log('📧 User:', 'team@vibrationfit.com');
console.log('🔐 Password:', 'waos****udi');
console.log('🖥️  Host:', 'imap.gmail.com:993');
console.log('');

imap.once('ready', () => {
  console.log('✅ SUCCESS! IMAP connection works!');
  imap.end();
});

imap.once('error', (err) => {
  console.error('❌ ERROR:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});

imap.connect();

