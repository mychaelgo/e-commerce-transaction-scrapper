const data = require('./shopee.json');

const convertToReadable = () => {
  const result = [];
  data.data.order_data.details_list.forEach((order) => {
    const products = order.info_card.order_list_cards[0].items.map(i => {
      return i.name;
    }).join(', ');

    const orderId =  order.info_card.order_id;

    result.push({
        final_total: order.info_card.final_total / 100000,
        link: `https://shopee.co.id/user/purchase/order/${orderId}`,
        products,
    });
  });

  return result;
};

const convertToTransaction = (data) => {
    data.forEach((order) => {
        const invoiceUrl = order.link;
        // format 2022-03-30T14:17:44.011204331+07:00 to 30/03/2022
        // const paymentDate = order.paymentDate.split('T')[0].split('-').reverse().join('/');
        const products = order.products;
        const totalPrice = order.final_total;

        console.log(`;;;Kategori;${totalPrice};${invoiceUrl} ${products}`);
    });
};


const readableData = convertToReadable(data);
const convertedData = convertToTransaction(readableData);
// console.log({ readableData });