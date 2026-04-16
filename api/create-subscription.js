// Vercel Serverless Function — POST /api/create-subscription
// Creates a Stripe Customer + incomplete Subscription and returns the PaymentIntent client secret
// so the frontend (Stripe Elements) can confirm the card payment.

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, email, name, plan, cycle } = req.body || {};

    if (!priceId || !email) {
      return res.status(400).json({ error: 'Missing priceId or email' });
    }

    // 1. Create (or reuse) a Stripe Customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        source: 'fuzionpilot.com',
        plan: plan || 'unknown',
        cycle: cycle || 'unknown',
      },
    });

    // 2. Create an incomplete subscription — the card is confirmed client-side
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan: plan || 'unknown',
        cycle: cycle || 'unknown',
      },
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    return res.status(200).json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('[create-subscription] error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
