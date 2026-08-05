-- ---------------------------------------------------------------------------
-- Quem sou eu e quem e o dono da tabela?
--
-- Rode ISTO no SQL Editor e me mande o resultado das 3 consultas.
-- Nao altera nada — so lê.
-- ---------------------------------------------------------------------------

-- 1. Com que papel o SQL Editor esta rodando
select current_user as papel_atual, session_user as papel_da_sessao;

-- 2. Quem e o dono da tabela items
select schemaname, tablename, tableowner
  from pg_tables
 where schemaname = 'public' and tablename = 'items';

-- 3. De quais papeis o meu papel atual e membro
--    (se o dono aparecer aqui, da para usar `set role` e resolver)
select r.rolname as posso_virar
  from pg_auth_members m
  join pg_roles r on r.oid = m.roleid
  join pg_roles u on u.oid = m.member
 where u.rolname = current_user
 order by 1;
