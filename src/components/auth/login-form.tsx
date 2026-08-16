
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useState } from 'react';
import { Separator } from '../ui/separator';

const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});


export function LoginForm() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const formSchema = isSignUp ? signUpSchema : signInSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const resetForm = () => {
    form.reset({
      email: '',
      password: '',
      confirmPassword: '',
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication Unavailable',
        description: 'Please wait a moment and try again.',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        if ('confirmPassword' in values) {
            await createUserWithEmailAndPassword(auth, values.email, values.password);
        }
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);
      }
      // The redirect is handled by the AppProvider/useUser hook
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign-Up Failed' : 'Login Failed',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : error.code === 'auth/email-already-in-use'
            ? 'This email is already registered. Please sign in.'
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const toggleFormMode = () => {
      setIsSignUp(!isSignUp);
      resetForm();
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    {...field}
                    disabled={isLoading}
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
                    placeholder="••••••••"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isSignUp && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
              </>
            )}
          </Button>
        </form>
      </Form>
      
      <div className="text-center text-sm">
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <Button variant="link" onClick={toggleFormMode} className="p-0 h-auto">
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </Button>
      </div>

    </div>
  );
}

    
