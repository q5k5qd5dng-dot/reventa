// Uso: node server/admin-cli.mjs correo@dominio.es [contraseña]
// Crea el usuario administrador (o promociona uno existente).
import { q, id, now } from "./db.mjs";
import { hashPassword } from "./auth.mjs";
const [email, pw] = [process.argv[2]?.toLowerCase(), process.argv[3]];
if (!email) { console.error("Uso: node server/admin-cli.mjs correo@dominio.es [contraseña]"); process.exit(1); }
const u = q.get("SELECT id FROM users WHERE email=?", email);
if (u) { q.run("UPDATE users SET role='admin' WHERE id=?", u.id); if (pw) q.run("UPDATE users SET pass_hash=? WHERE id=?", await hashPassword(pw), u.id); console.log(`✓ ${email} ahora es administrador`); }
else {
  if (!pw || pw.length < 8) { console.error("El usuario no existe: indica una contraseña de al menos 8 caracteres"); process.exit(1); }
  q.run("INSERT INTO users (id, name, email, pass_hash, role, created_at) VALUES (?,?,?,?,?,?)", id(14), "Administrador", email, await hashPassword(pw), "admin", now());
  console.log(`✓ Administrador creado: ${email}`);
}
