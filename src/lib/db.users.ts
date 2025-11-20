export type UserRole = 'ENGINEER' | 'LEAD';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const users: User[] = [];

async function getUserByEmail(email: string): Promise<User | null> {
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return user ?? null;
}

async function create(userData: {
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<User> {
  const id = `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const newUser: User = {
    id,
    email: userData.email,
    passwordHash: userData.passwordHash,
    role: userData.role,
    createdAt: new Date(),
  };

  users.push(newUser);
  return newUser;
}

export const dbUsers = {
  getUserByEmail,
  create,
};
