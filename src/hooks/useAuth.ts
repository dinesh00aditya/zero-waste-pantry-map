import { useState, useCallback, useEffect } from 'react';
import { AuthState } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    status: 'loading', // start loading until firebase is ready
  });

  const syncUserToFirestore = async (uid: string, email: string, name: string) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      try {
        await setDoc(userRef, {
          email,
          name,
          role: 'client'
        });
      } catch(error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
      }
    }
  };

  const loginWithGoogle = useCallback(async () => {
    setAuthState(prev => ({ ...prev, status: 'loading' }));
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const sessionUser = {
        id: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
      };

      await syncUserToFirestore(result.user.uid, sessionUser.email, sessionUser.name);

      setAuthState({
        user: sessionUser,
        token: await result.user.getIdToken(),
        status: 'authenticated',
      });
    } catch (error: any) {
      console.error(error);
      setAuthState({ user: null, token: null, status: 'unauthenticated' });
      throw error;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, pass: string) => {
    setAuthState(prev => ({ ...prev, status: 'loading' }));
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const sessionUser = {
        id: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
      };
      setAuthState({
        user: sessionUser,
        token: await result.user.getIdToken(),
        status: 'authenticated',
      });
    } catch (error: any) {
      console.error(error);
      setAuthState({ user: null, token: null, status: 'unauthenticated' });
      throw error;
    }
  }, []);

  const signupWithEmail = useCallback(async (name: string, email: string, pass: string) => {
    setAuthState(prev => ({ ...prev, status: 'loading' }));
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const sessionUser = {
        id: result.user.uid,
        email: result.user.email || '',
        name: name,
      };

      await syncUserToFirestore(result.user.uid, sessionUser.email, sessionUser.name);

      setAuthState({
        user: sessionUser,
        token: await result.user.getIdToken(),
        status: 'authenticated',
      });
    } catch (error: any) {
      console.error(error);
      setAuthState({ user: null, token: null, status: 'unauthenticated' });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setAuthState({ user: null, token: null, status: 'unauthenticated' });
    } catch(err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const userRef = doc(db, 'users', user.uid);
        import('firebase/firestore').then(({ onSnapshot }) => {
           userUnsubscribe = onSnapshot(userRef, (docSnap) => {
             if (docSnap.exists()) {
               const data = docSnap.data();
               setAuthState({
                 user: {
                   id: user.uid,
                   email: user.email || '',
                   name: data.name || user.displayName || user.email?.split('@')[0] || 'User',
                   bio: data.bio || ''
                 },
                 token,
                 status: 'authenticated',
               });
             } else {
               setAuthState({
                 user: {
                   id: user.uid,
                   email: user.email || '',
                   name: user.displayName || user.email?.split('@')[0] || 'User',
                 },
                 token,
                 status: 'authenticated',
               });
             }
           });
        });
      } else {
        if (userUnsubscribe) userUnsubscribe();
        setAuthState({ user: null, token: null, status: 'unauthenticated' });
      }
    });

    return () => {
      unsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  return { ...authState, loginWithGoogle, loginWithEmail, signupWithEmail, logout };
}
