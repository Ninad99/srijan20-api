const express = require('express');
const firestore = require('../app').firestore;
const paytmConfig = require('../config/config');
const checksum_lib = require('../paytm/checksum');
const baseURL = require('../app').baseURL;
const router = express.Router();

router.get('/txn', (req, res, next) => {
  const { orderId, amount } = req.query;
  console.log(req.query);
  res.render('txn.ejs', { config: {
      ORDER_ID: orderId,
      TXN_AMOUNT: amount
    },
    title: 'Srijan 20 merchandise payment'
  });
});

router.post('/txn', (req, res, next) => {
  const body = req.body;

  firestore.collection('orders').doc(body['ORDER_ID']).get()
    .then(docSnapshot => {
      const params = {};
      const data = docSnapshot.data();
      params['MID'] = paytmConfig.MID;
      params['ORDER_ID'] = body['ORDER_ID'];
      params['WEBSITE'] = paytmConfig.WEBSITE;
      params['CHANNEL_ID'] = paytmConfig.CHANNEL_ID;
      params['INDUSTRY_TYPE_ID'] = paytmConfig.INDUSTRY_TYPE_ID;
      params['TXN_AMOUNT']	= body['TXN_AMOUNT'];
      params['CUST_ID'] = data.userId;
      params['EMAIL']	= data.email;
      params['MOBILE_NO']	= data.phoneNo;
      params['CALLBACK_URL'] = baseURL + '/merch/response';

      console.log('params: ', params, 'merchant key:', paytmConfig.PAYTM_MERCHANT_KEY);
      checksum_lib.genchecksum(params, paytmConfig.PAYTM_MERCHANT_KEY, (err, checksum) => {
        if (!err) {
          res.render('pageRedirect.ejs', {
            params: params,
            checksum: checksum,
            url: paytmConfig.PAYTM_TRANSACTION_URL
          });
        }
      });
    })
});

router.post('/response', async (req, res, next) => {
  const paramList = req.body;
  console.log(paramList);
  if (checksum_lib.verifychecksum(paramList, paytmConfig.PAYTM_MERCHANT_KEY, paramList.CHECKSUMHASH)) {
    if (paramList.STATUS === 'TXN_SUCCESS') {
      const orderRef = await firestore.collection('orders').doc(paramList.ORDERID).get();
      const orderData = orderRef.data();
      firestore.collection('orders').doc(paramList.ORDERID).update({
        ...orderData,
        paymentStatus: 'paid'
      })
      res.render('response.ejs', { valid: true });
    } else if (paramList.STATUS === 'TXN_FAILURE') {
      const orderRef = await firestore.collection('orders').doc(paramList.ORDERID).get();
      const orderData = orderRef.data();
      firestore.collection('orders').doc(paramList.ORDERID).update({
        ...orderData,
        paymentStatus: 'failed'
      })
      res.render('response.ejs', { valid: false, respMsg: paramList.RESPMSG });
    }
  } else {
    const orderRef = await firestore.collection('orders').doc(paramList.ORDERID).get();
    const orderData = orderRef.data();
    firestore.collection('orders').doc(paramList.ORDERID).update({
      ...orderData,
      paymentStatus: 'failed'
    })
    res.render('response.ejs', { valid: false, respMsg: 'An error occured while verifying the transaction. Please go back and try again.' });
  }
});

module.exports = router;