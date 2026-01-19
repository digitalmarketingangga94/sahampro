const emiten = 'SOCI';
const fromDate = '2026-01-01';
const toDate = '2026-01-02';
const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU3MDc0NjI3LTg4MWItNDQzZC04OTcyLTdmMmMzOTNlMzYyOSIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InVzZSI6ImJoYWt0aXV0YW1hIiwiZW1hIjoiYmhha3RpLnV0YW1hQGdtYWlsLmNvbSIsImZ1bCI6IkJoYWt0aSBVdGFtYSIsInNlcyI6IlBDbEpBdk9ocUNLc3RXeU0iLCJkdmMiOiI3NGU0OTZkNzY2NmRhZTUyZDJkZDI1MWY5NThkMjRkMCIsInVpZCI6MTAyNjU1MywiY291IjoiU0cifSwiZXhwIjoxNzY3NjA1NjIxLCJpYXQiOjE3Njc1MTkyMjEsImlzcyI6IlNUT0NLQklUIiwianRpIjoiNjM2NGM1YjgtZGJiZS00NjgyLWI3OTEtNGU1ZjFiNmQ4M2E4IiwibmJmIjoxNzY3NTE5MjIxLCJ2ZXIiOiJ2MSJ9.Ptji6JuS34YADdoQw_nSArK50Tx5YKCqDMpt9iwP6v3CeC4vqJVzoj6epGiujWH8spAyoaxx3JwxPbhWSZf8upwKCBH3uQSArd4C5XX2i2jjkBizCsaxOcjC52pQvjrrk-UOIT78700Z2Cgt9Zeq9-gze745lBWZyEvC0y2xH2cq3YZgYlW6h7Oy0SQLCAo3Klbsfg89vOqJ1_DdX9wfuh9zAqnqapK7ozM87zOFpWEvQoNp7Uip4UTaIpzE9Sk4ikzkXg8e87LmvsjxvleUAV7hxMmvgqOKSCsd9uRWPz6-Pm22rb4NezijLtIN_MT-TlXovDkS2TPXnThruPwkUA';

async function test() {
  const url = `https://exodus.stockbit.com/marketdetectors/${emiten}?from=${fromDate}&to=${toDate}&transaction_type=TRANSACTION_TYPE_NET&market_board=MARKET_BOARD_REGULER&investor_type=INVESTOR_TYPE_ALL&limit=25`;
  
  console.log('Testing URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`,
        'origin': 'https://stockbit.com',
        'referer': 'https://stockbit.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
