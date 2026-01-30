import { AuthService } from './services/taskService';

const registerAdmin = async () => {
  const name = "Admin User";
  const username = `admin_${Math.random().toString(36).substring(2, 8)}`;
  const password = `pass_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const adminUser = await AuthService.register(name, username, password);
    console.log("Admin user registered successfully:");
    console.log(`Name: ${adminUser.name}`);
    console.log(`Username: ${adminUser.username}`);
    console.log(`Password: ${password} (Please remember this password, it's not stored directly.)`);
    console.log(`ID: ${adminUser.id}`);
    console.log(`Role: ${adminUser.role}`);
  } catch (error) {
    console.error("Error registering admin user:", error);
  }
};

registerAdmin();