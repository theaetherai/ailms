// Stripe configuration helper
// This file helps ensure that Stripe client gets the right configuration

export const getStripeConfig = () => {
  // Get the Stripe secret key
  const stripeKey = process.env.STRIPE_CLIENT_SECRET;
  
  if (!stripeKey) {
    console.warn('Stripe client secret not found in environment variables. Payment features may not work correctly.');
  }
  
  return {
    apiKey: stripeKey,
  };
};

// Utility function to check if we're in a server context
export const isServerSide = () => {
  return typeof window === 'undefined';
}; 