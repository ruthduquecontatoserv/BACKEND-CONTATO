# Instruções de Uso

## Requisitos
- Node.js (v14 ou superior)
- Docker e Docker Compose
- PostgreSQL

## Configuração e Execução

### Usando Docker (Recomendado)

1. Clone o repositório ou extraia os arquivos
2. Navegue até a pasta do projeto
3. Execute o Docker Compose:

```bash
docker-compose up -d
```

Isso irá:
- Iniciar um container PostgreSQL
- Configurar o banco de dados
- Iniciar a API na porta 3000

### Execução Manual

1. Clone o repositório ou extraia os arquivos
2. Navegue até a pasta do projeto
3. Instale as dependências:

```bash
npm install
```

4. Configure o arquivo `.env` com suas credenciais de banco de dados
5. Execute as migrações do Prisma:

```bash
npx prisma migrate dev
```

6. Inicie o servidor:

```bash
npm run dev
```

## Documentação da API

A documentação Swagger está disponível em:

```
http://localhost:3000/api-docs
```

## Estrutura do Projeto

```
curso-platform-backend/
├── prisma/
│   └── schema.prisma       # Esquema do banco de dados
├── src/
│   ├── controllers/        # Controladores da API
│   ├── middlewares/        # Middlewares (autenticação, erros)
│   ├── routes/             # Rotas da API
│   ├── utils/              # Utilitários
│   ├── config/             # Configurações
│   ├── swagger.json        # Documentação Swagger
│   └── index.js            # Ponto de entrada da aplicação
├── .env                    # Variáveis de ambiente
├── docker-compose.yml      # Configuração Docker
├── Dockerfile              # Configuração de build
└── package.json            # Dependências e scripts
```

## Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Autenticação de usuário
- `GET /api/auth/me` - Obter informações do usuário autenticado

### Usuários
- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Obter detalhes de um usuário
- `POST /api/users` - Criar novo usuário
- `PUT /api/users/:id` - Atualizar dados de um usuário
- `DELETE /api/users/:id` - Remover um usuário

### Departamentos
- `GET /api/departments` - Listar todos os departamentos
- `GET /api/departments/:id` - Obter detalhes de um departamento
- `POST /api/departments` - Criar novo departamento
- `PUT /api/departments/:id` - Atualizar dados de um departamento
- `DELETE /api/departments/:id` - Remover um departamento

### Cursos
- `GET /api/courses` - Listar todos os cursos
- `GET /api/courses/:id` - Obter detalhes de um curso
- `POST /api/courses` - Criar novo curso
- `PUT /api/courses/:id` - Atualizar dados de um curso
- `DELETE /api/courses/:id` - Remover um curso

### Matrículas
- `GET /api/user-courses` - Listar todas as matrículas
- `POST /api/user-courses` - Criar nova matrícula
- `PUT /api/user-courses/:id/progress` - Atualizar progresso em um curso
- `PUT /api/user-courses/:id/complete` - Marcar curso como concluído

### Métricas
- `GET /api/metrics/dashboard` - Obter métricas para o dashboard
- `GET /api/metrics/users` - Obter métricas de usuários
- `GET /api/metrics/courses` - Obter métricas de cursos
- `GET /api/metrics/departments` - Obter métricas por departamento

## Autenticação

A API utiliza autenticação JWT. Para acessar endpoints protegidos:

1. Faça login usando `POST /api/auth/login`
2. Receba o token JWT na resposta
3. Inclua o token no header de requisições subsequentes:
   ```
   Authorization: Bearer seu_token_jwt
   ```

## Usuário Administrador Padrão

Para o primeiro acesso, você pode criar um usuário administrador usando o endpoint `POST /api/users` sem autenticação.
