
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize with a publishable key placeholder (will be replaced with actual key)
const stripePromise = loadStripe('pk_test_placeholder');

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Configure Stripe Elements with CSP-compatible options
  const options = {
    mode: 'payment' as const,
    amount: 1000,
    currency: 'usd',
    // Use class-based styling instead of inline styles for CSP compatibility
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#33C3F0',
        colorBackground: '#121223',
        colorText: '#FFFFFF',
        colorDanger: '#F43F5E',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '4px',
      },
      rules: {
        '.Input': {
          backgroundColor: 'var(--colorBackground)',
          borderColor: 'var(--colorPrimary)',
        },
        '.Input:focus': {
          borderColor: 'var(--colorPrimary)',
          boxShadow: '0 0 0 1px var(--colorPrimary)'
        },
        '.Label': {
          color: 'var(--colorText)'
        },
        '.Error': {
          color: 'var(--colorDanger)'
        }
      }
    },
    // Set loader to 'never' to avoid additional network requests
    loader: 'never' as const
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};
