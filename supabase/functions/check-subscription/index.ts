
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client using the service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Authorize the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Invalid user token");
    }
    
    const user = userData.user;
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if user already has a subscription record
    const { data: existingSubscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    let subscriptionData = {
      plan_type: "basic", // Default to basic
      current_period_end: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    };
    
    // If there's no subscription record or it's basic, check if a Stripe customer exists
    if (!existingSubscription || existingSubscription.plan_type === "basic") {
      // Look up by email to see if user has a Stripe account
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        
        // Check if customer has an active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });
        
        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          
          // Determine plan type from the price
          const priceId = subscription.items.data[0].price.id;
          let planType = "basic";
          
          // This is an example - you'd map the price IDs to plan types
          if (priceId.includes("pro")) {
            planType = "pro";
          } else if (priceId.includes("yearly")) {
            planType = "yearly";
          }
          
          subscriptionData = {
            plan_type: planType,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
          };
        }
      }
    } else {
      // User already has a non-basic subscription record
      // If they have a stripe_subscription_id, verify it's still active
      if (existingSubscription.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            existingSubscription.stripe_subscription_id
          );
          
          if (subscription.status === "active") {
            subscriptionData = {
              plan_type: existingSubscription.plan_type,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
            };
          } else {
            // Subscription is no longer active, downgrade to basic
            subscriptionData = {
              plan_type: "basic",
              current_period_end: null,
              stripe_customer_id: existingSubscription.stripe_customer_id,
              stripe_subscription_id: null,
            };
          }
        } catch (error) {
          // Subscription not found or error, downgrade to basic
          subscriptionData = {
            plan_type: "basic",
            current_period_end: null,
            stripe_customer_id: existingSubscription.stripe_customer_id,
            stripe_subscription_id: null,
          };
        }
      }
    }
    
    // Update subscription record in the database
    await supabaseClient
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        plan_type: subscriptionData.plan_type,
        current_period_end: subscriptionData.current_period_end,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        updated_at: new Date().toISOString(),
      })
      .select();
    
    // Return subscription data
    return new Response(
      JSON.stringify({
        plan: subscriptionData.plan_type,
        current_period_end: subscriptionData.current_period_end,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
