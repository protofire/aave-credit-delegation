// import { useEffect, useState } from 'react';

// const apiKey = 'eb39ea1e-bfb0-479b-b225-70ff3da5c1ba';
// const address = '0x31C2cb2cd72a0a35Bf1839a2e0d383566bf904b0';

// const Authorization = `Basic ${Buffer.from(`${apiKey}:`, 'binary').toString('base64')}`;

// // {
// //     "statusCode": 400,
// //     "code": "FST_ERR_CTP_EMPTY_JSON_BODY",
// //     "error": "Bad Request",
// //     "message": "Body cannot be empty when content-type is set to 'application/json'"
// // }

// const getBalances = async () => {
//   const response = await fetch(
//     `https://api.zapper.xyz/v2/balances/tokens?addresses%5B%5D=${address}`,
//     {
//       method: 'POST',
//       headers: {
//         accept: '*/*',
//         Authorization,
//       },
//     }
//   );

//   const data = await response.json();

//   const jobId = data.jobId;

//   let jobStatus;

//   do {
//     const jobStatusResponse = await fetch(
//       `https://api.zapper.xyz/v2/balances/job-status?jobId=${jobId}`,
//       {
//         method: 'GET',
//         headers: {
//           accept: '*/*',
//           Authorization,
//         },
//       }
//     );
//     const jobData = await jobStatusResponse.json();

//     jobStatus = jobData.status;
//     // add delay to avoid overloading the server
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//   } while (jobStatus !== 'completed');
//   {
//     const balancesResponse = await fetch(
//       `https://api.zapper.xyz/v2/balances/tokens?addresses%5B%5D=${address}`,
//       {
//         method: 'GET',
//         headers: {
//           accept: '*/*',
//           Authorization,
//         },
//       }
//     );
//     const balances = await balancesResponse.json();
//     console.log('ZAPPER', balances);
//     return balances;
//   }
// };

// export const useZapper = () => {
//   //   const [zapper, setZapper] = useState<any>();

//   useEffect(() => {
//     getBalances().then((data) => setZapper(data));
//   }, []);

//   return zapper;
// };
