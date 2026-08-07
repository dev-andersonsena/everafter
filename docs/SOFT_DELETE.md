# Exclusão lógica de convidados

## Registro da criação

- Data e horário: **07/08/2026 às 17:46:08 (UTC-03:00, America/Sao_Paulo)**
- Funcionalidade: soft delete de convidados e cadastros originados por links de acompanhantes
- Endpoint: `DELETE /api/guests/:id`

## Comportamento

A lixeira remove o convidado das interfaces do painel, RSVP, busca e recepção, mas não executa `DELETE` no PostgreSQL. O registro permanece em `dados.registro` com:

- `deleted_at`: data e horário da exclusão lógica;
- `deleted_by`: login responsável pela operação;
- `created_by`: login que originou o cadastro ou o link de acompanhantes;
- `creation_source`: origem do registro (`admin`, `public`, `companion_link` ou `legacy`).

As consultas operacionais retornam somente registros com `deleted_at IS NULL`. Logs de acesso e vínculos existentes não são apagados.

## Permissões

| Usuário | Permissão de soft delete |
| --- | --- |
| `root` | Pode remover qualquer convidado ativo, independentemente da origem ou do criador. |
| `admin` | Pode remover somente o cadastro de acompanhantes criado a partir de um link gerado pelo próprio login admin. |
| `recepcao` | Não possui permissão de exclusão. |

A permissão é validada no backend. A lixeira no frontend é exibida conforme o campo `can_soft_delete` retornado pela API, mas ocultar ou manipular o botão não altera a autorização do servidor.

Registros antigos sem `created_by` ou marcados como `legacy` não podem ser removidos pelo admin; permanecem sob controle exclusivo do root.

## Fluxo de autoria

1. O login autenticado cria um link de acompanhantes.
2. `dados.companion_links.created_by` recebe o nome desse login.
3. Quando o link é utilizado, o convidado recebe o mesmo `created_by` e `creation_source = 'companion_link'`.
4. Ao clicar na lixeira, o backend compara o login atual com o criador.
5. Se autorizado, grava `deleted_at` e `deleted_by`; nenhum registro é fisicamente apagado.

## Migração automática

Na inicialização, o servidor usa `ADD COLUMN IF NOT EXISTS` para criar os campos necessários e cria o índice parcial `registro_active_idx` para a listagem dos registros ativos. Portanto, a migração é idempotente e pode ser executada em bancos já existentes.

## Auditoria e recuperação manual

Consulta de registros removidos:

```sql
SELECT id, nome, created_by, creation_source, deleted_at, deleted_by
FROM dados.registro
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

Restauração autorizada de um registro:

```sql
UPDATE dados.registro
SET deleted_at = NULL,
    deleted_by = NULL
WHERE id = '<id-do-convidado>';
```

Não foi adicionada restauração pela interface nesta versão; a recuperação deve ser feita por uma pessoa autorizada diretamente no banco.
