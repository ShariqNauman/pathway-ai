
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan } = await req.json();
    
    if (!plan || !["pro", "yearly"].includes(plan)) {
      throw new Error("Invalid plan selected");
    }
    
    // Create Supabase client using the anon key for authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    
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
    
    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Check if user already exists as a customer
    let customerId;
    const { data: existingSubscriptions } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (existingSubscriptions?.stripe_customer_id) {
      customerId = existingSubscriptions.stripe_customer_id;
    } else {
      // Look up by email
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    }
    
    // If no customer exists, we'll let Stripe create one
    // Create price ID based on plan
    let priceId;
    let planType;
    
    if (plan === "pro") {
      priceId = "price_pro_monthly"; // Replace with actual Stripe price ID
      planType = "pro";
    } else if (plan === "yearly") {
      priceId = "price_yearly"; // Replace with actual Stripe price ID
      planType = "yearly";
    }
    
    // Create checkout session options
    const sessionOptions: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan === 'pro' ? 'Pro Plan - Monthly' : 'Yearly Plan',
              description: plan === 'pro' ? 'Monthly subscription to Pathway Pro' : 'Annual subscription to Pathway AI',
            },
            unit_amount: plan === 'pro' ? 700 : 5000, // $7 or $50
            recurring: {
              interval: plan === 'pro' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get("origin")}/dashboard?payment=success`,
      cancel_url: `${req.headers.get("origin")}/pricing?payment=canceled`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    };
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);
    
    // Return the session URL
    return new Response(
      JSON.stringify({ url: session.url }),
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
