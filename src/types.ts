export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
}

export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  location: string;
  cost: number;
  createdAt: string;
}

export interface SharedRecipe {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  createdAt: string;
}

export type AuthState = {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
};
