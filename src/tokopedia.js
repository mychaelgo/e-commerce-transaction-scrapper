const axios = require('axios');

const getPreviousDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1); // set date to 1 day before
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month < 10) {
    month = "0" + month;
  }

  if (day < 10) {
    day = "0" + day;
  }

  return year + "-" + month + "-" + day;
};



const getTokopediaTransaction = async (startTime, endTime) => {
  const data = JSON.stringify([{ "operationName": "GetOrderHistory", "variables": { "VerticalCategory": "", "Status": "", "SearchableText": "", "CreateTimeStart": startTime, "CreateTimeEnd": endTime, "Page": 1, "Limit": 100 }, "query": "query GetOrderHistory($VerticalCategory: String!, $Status: String!, $SearchableText: String!, $CreateTimeStart: String!, $CreateTimeEnd: String!, $Page: Int!, $Limit: Int!) {\n  uohOrders(input: {UUID: \"\", VerticalID: \"\", VerticalCategory: $VerticalCategory, Status: $Status, SearchableText: $SearchableText, CreateTime: \"\", CreateTimeStart: $CreateTimeStart, CreateTimeEnd: $CreateTimeEnd, Page: $Page, Limit: $Limit, SortBy: \"\", IsSortAsc: false}) {\n    orders {\n      orderUUID\n      verticalID\n      verticalCategory\n      userID\n      status\n      verticalStatus\n      searchableText\n      metadata {\n        upstream\n        verticalLogo\n        verticalLabel\n        paymentDate\n        paymentDateStr\n        queryParams\n        listProducts\n        detailURL {\n          webURL\n          webTypeLink\n          __typename\n        }\n        status {\n          label\n          textColor\n          bgColor\n          __typename\n        }\n        products {\n          title\n          imageURL\n          inline1 {\n            label\n            textColor\n            bgColor\n            __typename\n          }\n          inline2 {\n            label\n            textColor\n            bgColor\n            __typename\n          }\n          __typename\n        }\n        otherInfo {\n          actionType\n          appURL\n          webURL\n          label\n          textColor\n          bgColor\n          __typename\n        }\n        totalPrice {\n          value\n          label\n          textColor\n          bgColor\n          __typename\n        }\n        tickers {\n          action {\n            actionType\n            appURL\n            webURL\n            label\n            textColor\n            bgColor\n            __typename\n          }\n          title\n          text\n          type\n          isFull\n          __typename\n        }\n        buttons {\n          Label\n          variantColor\n          type\n          actionType\n          appURL\n          webURL\n          __typename\n        }\n        dotMenus {\n          actionType\n          appURL\n          webURL\n          label\n          textColor\n          bgColor\n          __typename\n        }\n        __typename\n      }\n      createTime\n      createBy\n      updateTime\n      updateBy\n      __typename\n    }\n    totalOrders\n    filtersV2 {\n      label\n      value\n      isPrimary\n      __typename\n    }\n    categories {\n      value\n      label\n      description\n      category_group\n      __typename\n    }\n    dateLimit\n    tickers {\n      action {\n        actionType\n        appURL\n        webURL\n        label\n        textColor\n        bgColor\n        __typename\n      }\n      title\n      text\n      type\n      isFull\n      __typename\n    }\n    __typename\n  }\n}\n" }]);
  const config = {
    method: 'post',
    url: 'https://gql.tokopedia.com/graphql/GetOrderHistory',
    headers: {
      'authority': 'gql.tokopedia.com',
      'accept': '*/*',
      'accept-language': 'en,en-US;q=0.9',
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'cookie': process.env.TOKOPEDIA_COOKIE,
      'dnt': '1',
      'origin': 'https://www.tokopedia.com',
      'pragma': 'no-cache',
      'referer': 'https://www.tokopedia.com/order-list',
      'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
      'x-device': 'desktop',
      'x-source': 'tokopedia-lite',
      'x-tkpd-lite-service': 'zeus',
      'x-version': '68ba647'
    },
    data: data
  };

  return await axios(config)
};

const convertToReadable = (data) => {
  const result = [];
  data[0].data.uohOrders.orders.forEach((order) => {
    const invoiceUrl = JSON.parse(order.metadata.queryParams).invoice_url || `https://tokopedia.com${order.metadata.detailURL.webURL}`;
    const paymentDate = order.metadata.paymentDate;
    const products = order.metadata.products.map((product) => {
      const title = product.title;
      const inline1 = product.inline1.label;
      return `${title} (${inline1})`;
    }).join(', ');


    const totalPrice = order.metadata.totalPrice.value;


    result.push({
      invoiceUrl,
      paymentDate,
      products,
      totalPrice
    });
  });

  return result;
};

const convertToTransaction = (data) => {
  const transactions = [];
  data.forEach((order) => {
    const invoiceUrl = order.invoiceUrl;
    // format 2022-03-30T14:17:44.011204331+07:00 to 30/03/2022
    const paymentDate = order.paymentDate.split('T')[0].split('-').reverse().join('/');
    const products = process.env.TOKOPEDIA_SOURCE ? `${process.env.TOKOPEDIA_SOURCE} - ${order.products}` : order.products;
    const totalPrice = order.totalPrice.replace(new RegExp(/(Rp|\.|  )/g), '');

    transactions.push([
      paymentDate,
      Number(totalPrice),
      products,
      invoiceUrl
    ]);
  });

  return transactions;
};

const postToWebhook = async (data) => {
  const config = {
    method: 'post',
    url: process.env.TOKOPEDIA_WEBHOOK,
    data: {
      source: process.env.TOKOPEDIA_SOURCE,
      data
    }
  };

  try {
    return await axios(config)
  } catch (error) {
    console.log('Error ', error.message);
  }

};

function getStartAndEndOfMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Start of the month
  const startDate = new Date(year, month, 1);

  // End of the month
  const endDate = new Date(year, month + 1, 0);

  // Format dates in YYYY-MM-DD format
  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate.toISOString().split('T')[0];

  return {
    startDate: formattedStartDate,
    endDate: formattedEndDate,
  };
}


(async () => {
  const { startDate, endDate } = getStartAndEndOfMonth();
  const startTime = process.env.TOKOPEDIA_TRANSACTION_START_DATE || startDate;
  const endTime = process.env.TOKOPEDIA_TRANSACTION_END_DATE || endDate;
  const { data: tokopediaTransactions } = await getTokopediaTransaction(startTime, endTime);
  const readableData = convertToReadable(tokopediaTransactions);
  const transactions = convertToTransaction(readableData).reverse();
  if (transactions.length > 0) {
    if (process.env.TOKOPEDIA_POST_TO_WEBHOOK === 'true') {
      await postToWebhook(transactions);
    }

    console.log(`Transactions: ${transactions.length}`);
  } else {
    console.log('No transactions');
  }

  console.log('Tokopedia done');
})();