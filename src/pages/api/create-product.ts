import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const createProductOnStripe = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method === "POST") {
    try {
      // Create a new product named "Apple"
      const product = await stripe.products.create({
        name: "Apple",
        description: "A delicious fruit.",
      });

      // Create a price for the product, assuming it's a subscription
      const price = await stripe.prices.create({
        unit_amount: 2000, // $20.00 in cents
        currency: "usd",
        recurring: {
          interval: "month", // Change this if appropriate
        },
        product: product.id,
      });

      res.status(200).json({ productId: product.id, priceId: price.id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default createProductOnStripe;
