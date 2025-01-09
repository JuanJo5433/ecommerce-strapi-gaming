// src/api/order/controllers/order.js
"use strict";
const stripe = require("stripe")("sk_test_51Qf8HSR8UW5q4Lv6kPi8DN2baJUS7OtZYfCqCbp2DtAdzbaxGJLNk7ddveBk3k3uXijIY38kvr6FFbcBS0fBxFpc00nu4UaOzr");

function calcDiscountPrice(price, discount) {
  if (!discount) return price;

  const discountAmount = (price * discount) / 100;
  const result = price - discountAmount;

  return result.toFixed(2); // Aseguramos que siempre se devuelvan dos decimales
}

/**
 * Controlador de pedidos
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {
    try {
      const { token, products, idUser, addressShipping } = ctx.request.body;

      // Validación de datos de entrada
      if (!token || !products || !idUser || !addressShipping) {
        return ctx.badRequest("Missing required fields.");
      }

      let totalPayment = 0;

      // Calculando el total del pedido
      products.forEach((product) => {
        const priceTemp = calcDiscountPrice(product.attributes.price, product.attributes.discount);
        totalPayment += parseFloat(priceTemp) * product.quantity; // Aseguramos que sea un número flotante
      });

      // Redondeamos el total para evitar problemas con decimales
      totalPayment = parseFloat(totalPayment.toFixed(2));

      // Creación del cargo en Stripe
      const charge = await stripe.charges.create({
        amount: Math.round(totalPayment * 100), // Stripe requiere la cantidad en centavos
        currency: "eur",
        source: token.id,
        description: `User ID: ${idUser}`,
      });

      // Datos del pedido a guardar
      const data = {
        products,
        user: idUser,
        totalPayment,
        idPayment: charge.id,
        addressShipping,
      };

      // Validación de los datos antes de guardar
      const model = strapi.contentTypes["api::order.order"];
      const validData = await strapi.entityValidator.validateEntityCreation(model, data);

      // Creación de la entidad de pedido en la base de datos
      const entry = await strapi.db.query("api::order.order").create({ data: validData });

      return entry; // Devolvemos el pedido creado
    } catch (error) {
      console.error("Error processing payment:", error);
      return ctx.internalServerError("An error occurred while processing the payment.");
    }
  },
}));
