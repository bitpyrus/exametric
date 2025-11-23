import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

interface User {
  id: string;
  email: string;
  name: string;
  role?: 'admin' | 'examTaker';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Determine role from token claims, fallback to RTDB users/{uid}.role
        let role: 'admin' | 'examTaker' = 'examTaker';
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          if (idTokenResult?.claims?.admin) role = 'admin';
        } catch (e) {
          // ignore
        }

        try {
          const snap = await get(ref(database, `users/${firebaseUser.uid}`));
          if (snap.exists()) {
            const val = snap.val();
            if (val?.role === 'admin') role = 'admin';
            else if (val?.role === 'examTaker') role = 'examTaker';
          }
        } catch (e) {
          // ignore
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email || 'User',
          role,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userCredential.user.displayName || userCredential.user.email}`,
      });
      navigate('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Login failed",
        description: message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Persist user role as examTaker in Realtime DB (client-side write)
      try {
        await set(ref(database, `users/${userCredential.user.uid}`), {
          role: 'examTaker',
          email,
          name,
        });
      } catch (e: unknown) {
        console.warn('Failed to write user role to database', e);
      }

      toast({
        title: "Account created!",
        description: `Welcome, ${name}!`,
      });
      navigate('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Signup failed",
        description: message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate('/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message || "Could not log out",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
