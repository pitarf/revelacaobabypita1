const accessToken = "APP_USR-13888055785530-062920-e18e15a14ec73a0e987cb3c36de03617-263369008"; // do seu .env
const opId = "166470683864";

async function check() {
  console.log("Checando pagamentos...");
  try {
    const resPayment = await fetch(`https://api.mercadopago.com/v1/payments/${opId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (resPayment.ok) {
      const data = await resPayment.json();
      console.log("PAYMENT ENCONTRADO:");
      console.log(`Status: ${data.status} | Detalhe: ${data.status_detail}`);
      console.log(JSON.stringify(data, null, 2));
      return;
    } else {
      console.log(`Payment fetch error: ${resPayment.status}`);
    }
  } catch(e) {
    console.error(e);
  }

  console.log("\nChecando merchant_orders...");
  try {
    const resOrder = await fetch(`https://api.mercadopago.com/merchant_orders/${opId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (resOrder.ok) {
      const data = await resOrder.json();
      console.log("MERCHANT ORDER ENCONTRADA:");
      console.log(`Status: ${data.status} | Order Status: ${data.order_status}`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`Merchant Order fetch error: ${resOrder.status}`);
    }
  } catch(e) {
    console.error(e);
  }
}

check();
