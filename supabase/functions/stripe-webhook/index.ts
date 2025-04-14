
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// This function needs to be public (no JWT verification)
serve(async (req) => {
  try {
    const stripeSignature = req.headers.get("stripe-signature");
    if (!stripeSignature) {
      return new Response(JSON.stringify({ error: "Stripe signature missing" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Get the raw request body for verification
    const body = await req.text();
    
    // Verify the event came from Stripe
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        endpointSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        
        if (!userId) {
          console.error('No user ID in session metadata');
          break;
        }
        
        // Get current date and add 1 month for next reset
        const now = new Date();
        const resetDate = new Date(now);
        resetDate.setDate(resetDate.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        
        // Update the user's subscription status
        await supabaseAdmin
          .from('apl_user_credits')
          .update({ 
            is_pro: true,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);
          
        console.log(`User ${userId} is now a pro subscriber`);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        if (!customer || customer.deleted) {
          console.error('Customer not found or deleted');
          break;
        }
        
        const userId = customer.metadata?.user_id;
        if (!userId) {
          console.error('No user ID in customer metadata');
          break;
        }
        
        // Update the user's subscription status based on status
        const isActive = subscription.status === 'active';
        
        // Get current date and add 1 month for next reset
        const now = new Date();
        const resetDate = new Date(now);
        resetDate.setDate(resetDate.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        
        // Update the user's subscription status
        const { error } = await supabaseAdmin
          .from('apl_user_credits')
          .update({ 
            is_pro: isActive,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error updating user credits:', error);
        } else {
          console.log(`User ${userId} subscription status updated to ${isActive}`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        if (!customer || customer.deleted) {
          console.error('Customer not found or deleted');
          break;
        }
        
        const userId = customer.metadata?.user_id;
        if (!userId) {
          console.error('No user ID in customer metadata');
          break;
        }
        
        // Update the user's subscription status to false
        const { error } = await supabaseAdmin
          .from('apl_user_credits')
          .update({ 
            is_pro: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error updating user credits:', error);
        } else {
          console.log(`User ${userId} subscription deleted`);
        }
        break;
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
