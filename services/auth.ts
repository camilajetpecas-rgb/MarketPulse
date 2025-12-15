
import { User } from "../types";

const STORAGE_KEY = 'marketpulse_users';
const CURRENT_USER_KEY = 'marketpulse_current_user';

// Inicializa com usuários padrão se não existirem
const initAuth = () => {
  const usersStr = localStorage.getItem(STORAGE_KEY);
  let users: User[] = usersStr ? JSON.parse(usersStr) : [];
  let hasChanges = false;

  // 1. Garante o Administrador Padrão
  const defaultAdmin: User = {
    id: '1',
    name: 'Administrador',
    email: 'admin@marketpulse.com',
    password: 'admin', 
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  if (!users.find(u => u.email === defaultAdmin.email)) {
      users.push(defaultAdmin);
      hasChanges = true;
  }

  // 2. Garante o Usuário da Camila (Recovery)
  // Se o usuário não existir (por limpeza de cache), recria com senha padrão
  const camilaUser: User = {
      id: '2',
      name: 'Camila Ferreira',
      email: 'camilajetpecas@gmail.com',
      password: 'admin', // Senha de recuperação definida como 'admin'
      role: 'admin',
      createdAt: new Date().toISOString()
  };

  if (!users.find(u => u.email === camilaUser.email)) {
      users.push(camilaUser);
      hasChanges = true;
  }

  if (hasChanges) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
};

initAuth();

export const authService = {
  getUsers: (): User[] => {
    const usersStr = localStorage.getItem(STORAGE_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  },

  login: (email: string, password: string): User | null => {
    // Recarrega do storage para garantir dados frescos
    const users = authService.getUsers();
    // Comparação simples (em produção usaríamos hash)
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (user) {
      const { password, ...userWithoutPass } = user;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPass));
      return userWithoutPass;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  registerUser: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = authService.getUsers();
    
    if (users.find(u => u.email === user.email)) {
      throw new Error("E-mail já cadastrado.");
    }

    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  deleteUser: (id: string) => {
    let users = authService.getUsers();
    // Impede exclusão do próprio admin principal para evitar lockout
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.email === 'admin@marketpulse.com') {
        throw new Error("Não é possível excluir o administrador raiz.");
    }

    users = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  updatePassword: (id: string, newPassword: string) => {
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex >= 0) {
      users[userIndex].password = newPassword;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } else {
        throw new Error("Usuário não encontrado");
    }
  },

  // Função de emergência para resetar o ambiente
  resetSystem: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.reload();
  }
};
