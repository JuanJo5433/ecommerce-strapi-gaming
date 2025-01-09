// src/api/order/routes/custom-order.js
module.exports = {
    routes: [
      {
        method: "POST",
        path: "/payment-order",  // Ruta de la API
        handler: "order.paymentOrder",  // Llamada al controlador de pago
        config: {
          policies: [],
        },
      },
    ],
  };
  