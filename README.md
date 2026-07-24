[![CI/CD](https://github.com/dev-andersonsena/everafter/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/dev-andersonsena/everafter/actions/workflows/ci-cd.yml)

## CI/CD e infraestrutura

O projeto possui uma pipeline de CI/CD implementada com GitHub Actions.

### Integração contínua

Em cada Pull Request direcionado à branch `main`, a pipeline executa:

- instalação reproduzível com `npm ci`;
- validação TypeScript com `tsc --noEmit`;
- execução de testes;
- build do frontend React/Vite;
- build do backend Node.js/Express.

### Entrega contínua

Após o merge na branch `main`, o GitHub Actions:

- acessa uma instância Amazon EC2 por SSH;
- atualiza o código da aplicação;
- instala as dependências;
- gera o build de produção;
- reinicia o serviço utilizando PM2.

As credenciais e informações de acesso são armazenadas em GitHub Actions Secrets.

### Arquitetura

- Frontend: React e Vite
- Backend: Node.js e Express
- Banco de dados: PostgreSQL
- Infraestrutura: AWS EC2
- Gerenciamento de processo: PM2
- CI/CD: GitHub Actions


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
