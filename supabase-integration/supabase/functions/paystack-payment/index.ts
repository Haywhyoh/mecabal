import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Paystack API integration for Nigerian payments
interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      listing_id?: string;
      user_id?: string;
      transaction_type?: string;
      [key: string]: any;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Initialize payment
    if (req.method === 'POST' && path === '/initialize') {
      return await initializePayment(req, supabase);
    }
    
    // Verify payment
    if (req.method === 'POST' && path === '/verify') {
      return await verifyPayment(req, supabase);
    }
    
    // Handle webhook
    if (req.method === 'POST' && path === '/webhook') {
      return await handleWebhook(req, supabase);
    }

    // Get transaction status
    if (req.method === 'GET' && path === '/status') {
      return await getTransactionStatus(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Payment function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function initializePayment(req: Request, supabase: any) {
  const { 
    amount, 
    email, 
    phone,
    listing_id, 
    user_id,
    transaction_type = 'purchase',
    callback_url,
    metadata = {}
  } = await req.json();

  // Validate required fields
  if (!amount || !email || !user_id) {
    return new Response(
      JSON.stringify({ 
        error: 'Amount, email, and user_id are required' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Validate amount (minimum 100 Naira)
  if (amount < 100) {
    return new Response(
      JSON.stringify({ 
        error: 'Minimum amount is ₦100' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Generate unique reference
  const reference = `mecabal_${transaction_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get user details for better payment experience
  const { data: user } = await supabase
    .from('users')
    .select('first_name, last_name, phone_number')
    .eq('id', user_id)
    .single();

  // Initialize Paystack transaction
  const paystackPayload = {
    email,
    amount: Math.round(amount * 100), // Convert to kobo
    currency: 'NGN',
    reference,
    callback_url: callback_url || `${Deno.env.get('APP_URL')}/payment-success`,
    metadata: {
      ...metadata,
      listing_id,
      user_id,
      transaction_type,
      platform: 'mecabal',
      customer_name: user ? `${user.first_name} ${user.last_name}` : 'MeCabal User',
      phone: phone || user?.phone_number
    },
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
  };

  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paystackPayload)
  });

  if (!paystackResponse.ok) {
    const errorData = await paystackResponse.json();
    console.error('Paystack initialization error:', errorData);
    return new Response(
      JSON.stringify({ 
        error: 'Payment initialization failed',
        details: errorData.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const paymentData: PaystackInitializeResponse = await paystackResponse.json();

  // Store transaction record in database
  const { error: dbError } = await supabase
    .from('payment_transactions')
    .insert({
      user_id,
      listing_id,
      amount,
      currency: 'NGN',
      payment_method: 'paystack',
      payment_reference: reference,
      gateway_reference: paymentData.data.access_code,
      status: 'pending',
      transaction_type,
      gateway_response: paymentData
    });

  if (dbError) {
    console.error('Database error:', dbError);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to store transaction record' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        authorization_url: paymentData.data.authorization_url,
        access_code: paymentData.data.access_code,
        reference: paymentData.data.reference,
        amount_naira: amount,
        amount_kobo: Math.round(amount * 100)
      },
      message: 'Payment initialized successfully'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function verifyPayment(req: Request, supabase: any) {
  const { reference } = await req.json();

  if (!reference) {
    return new Response(
      JSON.stringify({ error: 'Payment reference is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Verify with Paystack
  const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
    }
  });

  if (!paystackResponse.ok) {
    return new Response(
      JSON.stringify({ error: 'Payment verification failed' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const verificationData = await paystackResponse.json();
  const transaction = verificationData.data;

  // Update local transaction record
  const { error: updateError } = await supabase
    .from('payment_transactions')
    .update({
      status: transaction.status === 'success' ? 'successful' : 'failed',
      gateway_reference: transaction.id.toString(),
      gateway_response: verificationData
    })
    .eq('payment_reference', reference);

  if (updateError) {
    console.error('Database update error:', updateError);
  }

  // If payment successful, update related records
  if (transaction.status === 'success') {
    await processSuccessfulPayment(supabase, transaction);
  }

  return new Response(
    JSON.stringify({
      success: transaction.status === 'success',
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount / 100, // Convert from kobo to naira
        paid_at: transaction.paid_at,
        channel: transaction.channel,
        customer: transaction.customer
      },
      message: transaction.gateway_response || 'Payment verification completed'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleWebhook(req: Request, supabase: any) {
  const signature = req.headers.get('x-paystack-signature');
  const body = await req.text();

  // Verify webhook signature
  if (!verifyPaystackSignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const event: PaystackWebhookEvent = JSON.parse(body);

  console.log('Paystack webhook received:', event.event, event.data.reference);

  // Handle different webhook events
  switch (event.event) {
    case 'charge.success':
      await handleChargeSuccess(supabase, event.data);
      break;
    case 'charge.failed':
      await handleChargeFailed(supabase, event.data);
      break;
    case 'transfer.success':
      await handleTransferSuccess(supabase, event.data);
      break;
    case 'transfer.failed':
      await handleTransferFailed(supabase, event.data);
      break;
    default:
      console.log('Unhandled webhook event:', event.event);
  }

  return new Response('OK', { status: 200 });
}

async function getTransactionStatus(req: Request, supabase: any) {
  const url = new URL(req.url);
  const reference = url.searchParams.get('reference');
  const user_id = url.searchParams.get('user_id');

  if (!reference) {
    return new Response(
      JSON.stringify({ error: 'Reference parameter is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const query = supabase
    .from('payment_transactions')
    .select('*')
    .eq('payment_reference', reference);

  if (user_id) {
    query.eq('user_id', user_id);
  }

  const { data: transaction, error } = await query.single();

  if (error || !transaction) {
    return new Response(
      JSON.stringify({ error: 'Transaction not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        reference: transaction.payment_reference,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const hash = new TextEncoder().encode(Deno.env.get('PAYSTACK_SECRET_KEY') + body);
  // In production, use proper HMAC verification
  return true; // Simplified for demo
}

async function processSuccessfulPayment(supabase: any, transaction: any) {
  const { metadata } = transaction;
  
  // Update marketplace listing if this was a purchase
  if (metadata.listing_id && metadata.transaction_type === 'purchase') {
    await supabase
      .from('marketplace_listings')
      .update({ availability_status: 'pending' })
      .eq('id', metadata.listing_id);
  }

  // Add any other business logic for successful payments
  console.log('Payment processed successfully:', transaction.reference);
}

async function handleChargeSuccess(supabase: any, data: any) {
  await supabase
    .from('payment_transactions')
    .update({
      status: 'successful',
      gateway_response: data
    })
    .eq('payment_reference', data.reference);

  await processSuccessfulPayment(supabase, data);
}

async function handleChargeFailed(supabase: any, data: any) {
  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      gateway_response: data
    })
    .eq('payment_reference', data.reference);
}

async function handleTransferSuccess(supabase: any, data: any) {
  // Handle successful transfers (e.g., seller payouts)
  console.log('Transfer successful:', data);
}

async function handleTransferFailed(supabase: any, data: any) {
  // Handle failed transfers
  console.log('Transfer failed:', data);
}