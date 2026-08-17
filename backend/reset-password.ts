import { prisma } from './lib/prisma';
import bcrypt from 'bcrypt';

async function reset() {
  const users = await prisma.utilisateur.findMany({ select: { id: true, email: true, nom: true, role: true } });
  console.log("=== UTILISATEURS EXISTANTS ===");
  console.log(users);
  
  if (users.length > 0) {
    const admin = users.find(u => u.role === 'ADMIN') || users[0];
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.utilisateur.update({
      where: { id: admin.id },
      data: { motDePasse: hashedPassword }
    });
    console.log(`\nMot de passe réinitialisé pour: ${admin.email}`);
    console.log(`Nouveau mot de passe: admin123`);
  }
}

reset().catch(console.error).finally(() => process.exit(0));
