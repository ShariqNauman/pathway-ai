
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { UserCredentials } from "@/types/user";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login, isLoading, currentUser } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange"
  });
  
  // Use useWatch to actively monitor form values
  const email = useWatch({ control: form.control, name: "email" });
  const password = useWatch({ control: form.control, name: "password" });
  
  // Track whether the form is actually valid with filled values
  const [formIsValid, setFormIsValid] = useState(false);
  
  // Check if all fields are filled and valid
  useEffect(() => {
    const allFieldsFilled = 
      email?.trim() !== "" && 
      password?.trim() !== "";
    
    const noErrors = Object.keys(form.formState.errors).length === 0;
    
    // Only enable the button when all fields are filled, no errors, and user has interacted with the form
    setFormIsValid(allFieldsFilled && noErrors && form.formState.isDirty);
  }, [email, password, form.formState]);

  const onSubmit = async (values: LoginFormValues) => {
    setError("");
    setFormSubmitted(true);
    
    const credentials: UserCredentials = {
      email: values.email,
      password: values.password
    };
    
    try {
      const success = await login(credentials);
      
      if (success) {
        toast("Login successful");
        navigate("/dashboard");
      } else {
        setError("Invalid email or password");
        toast("Login failed: Invalid email or password");
        setFormSubmitted(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
      toast("Login failed: An error occurred");
      setFormSubmitted(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md p-8 rounded-lg shadow-lg bg-card"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to access your account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@example.com" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          setFormSubmitted(false);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="********" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          setFormSubmitted(false);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || formSubmitted || !formIsValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="text-sm text-center mt-6">
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </motion.div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default LoginPage;
