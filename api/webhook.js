// Vercel Serverless Function — POST /api/webhook
// Receives Stripe webhook events and handles them.
// IMPORTANT: the default body parser must be disabled so we can verify the signature
// against the raw body.

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Disable Vercel's default body parser for signature verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

// Helper: read raw body from request stream
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('[webhook] invoice.payment_succeeded', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_paid,
        });
        // TODO: call the Fuzion Pilot backend to create the agency account
        // and send the welcome email with login credentials.
        break;
      }

      case 'customer.subscription.created': {
        const sub = event.data.object;
        console.log('[webhook] customer.subscription.created', {
          subscriptionId: sub.id,
          customerId: sub.customer,
          status: sub.status,
          plan: sub.metadata && sub.metadata.plan,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        console.log('[webhook] customer.subscription.updated', {
          subscriptionId: sub.id,
          status: sub.status,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log('[webhook] customer.subscription.deleted', {
          subscriptionId: sub.id,
        });
        // TODO: deactivate the agency account in Fuzion Pilot.
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('[webhook] invoice.payment_failed', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        });
        // TODO: notify the customer that the payment failed.
        break;
      }

      default:
        console.log('[webhook] unhandled event:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
