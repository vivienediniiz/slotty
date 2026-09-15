-- Insert test user for Slotty
-- Execute in Supabase SQL Editor

INSERT INTO "users" (id, email, name, "passwordHash", "createdAt", "updatedAt")
VALUES (
  'test-user-001',
  'teste@slotty.com',
  'Usuário Teste',
  '$2a$10$68EO5TdWSHPwycaSSo6sTuoKlEisict8Ek1waOQ4AWtQWjO/ijJh.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Credenciais de login:
-- E-mail: teste@slotty.com
-- Senha: senha123
