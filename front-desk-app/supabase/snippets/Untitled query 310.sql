select conname
from pg_constraint
where conname = 'users_role_check';