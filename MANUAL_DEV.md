# Manual do Desenvolvedor - Chá Revelação Miguel ou Rafaella

Este manual contém as diretrizes técnicas, arquitetura e instruções necessárias para configurar, executar e dar manutenção no sistema de **Chá Revelação**.

## 1. Stack de Tecnologia
- **Frontend/Backend**: Next.js 15+ (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4 (Mobile-First)
- **Banco de Dados**: PostgreSQL Neon Cloud Database
- **ORM**: Prisma v7.8.0 (utilizando adaptador `@prisma/adapter-pg` com o driver `pg` clássico do Node para sockets estáveis em Windows)
- **Autenticação**: Cookies HttpOnly + Sessão JWT criptografada (`jsonwebtoken` e `bcryptjs`)
- **Interface**: Lucide React e Sonner (Notificações Toast premium)
- **Efeitos de UX**: Canvas Confetti
- **Gráficos**: CSS inline flex e SVG adaptados para máxima leveza
- **Tipografia**: Fonte cursiva *Pacifico* importada do Google Fonts e mapeada via Tailwind CSS v4 para os elementos de destaque.
- **Indexação (Robots)**: Desabilitada globalmente no `layout.tsx` (`robots: "noindex, nofollow"`) para atender às diretivas de privacidade.

---

## 2. Configuração do Ambiente Local

### Pré-requisitos
- Node.js (v18.x ou superior)
- NPM (v10.x ou superior)

### Execução Passo a Passo

1. **Instalar Dependências**:
   ```bash
   npm.cmd install
   ```
2. **Variáveis de Ambiente**:
   Copie o arquivo `.env.example` para `.env` e confirme se a string de conexão está preenchida:
   ```bash
   cp .env.example .env
   ```
3. **Gerar Tipos e o Client Prisma**:
   Gere o Prisma Client no diretório local personalizado (`src/generated/client`) executando:
   ```bash
   npx.cmd prisma generate
   ```
4. **Sincronizar Estrutura do Banco**:
   Caso o banco esteja vazio, aplique a migração e popule os dados iniciais do seed:
   ```bash
   npx.cmd prisma db push
   npx.cmd tsx prisma/seed.ts
   ```
5. **Rodar em Modo Desenvolvimento**:
   ```bash
   npm.cmd run dev
   ```
   Acesse a aplicação em `http://localhost:3000`.

---

## 3. Lógica do Banco de Dados & Concorrência de Estoque

Para prevenir problemas de concorrência e venda duplicada de presentes, a reserva e a geração de pedidos em `/api/checkout` rodam sob transações atômicas `prisma.$transaction`.

A integridade do estoque respeita as seguintes condições:
- **Estoque Restante**: Calculado dinamicamente no código através de `maxQuantity - chosenQuantity`, evitando redundâncias na gravação.
- **Rollback de Webhook**: Caso o gateway avise que um Pix ou Cartão expirou/foi rejeitado, a API `/api/webhooks/payment` executa uma transação decrementando o `chosenQuantity` e devolvendo o item à vitrine de presentes automaticamente.

---

## 4. Estrutura Modular do Projeto
- `/prisma`: Arquivo de schema relacional e populador (`seed.ts`).
- `/src/app`: Rotas e páginas unificadas (App Router do Next.js).
- `/src/components`: Componentes modulares, divididos entre `/public` (convidados) e `/admin` (gerenciamento).
- `/src/context`: CartContext (Provedor global de estado do carrinho do cliente).
- `/src/lib`: Singletons do Prisma, decodificação JWT de segurança e cookies HttpOnly.
- `/src/services`: Adaptadores de checkout e simuladores do Mercado Pago.

---

## 5. Simulador Integrado para Homologação
Se a variável `MP_ACCESS_TOKEN` estiver ausente no `.env`, a API de checkout ativa o **Simulador Sandbox**. Isso gera URLs de testes do cartão de crédito (`/presentes/finalizar/cartao-simulado`) e códigos Pix copia e cola simulados. 

O desenvolvedor ou cliente pode aprovar compras fictícias clicando no botão **Simular Webhook de Aprovação** presente na tela de conclusão. O webhook `/api/webhooks/payment` é disparado localmente, atualizando o banco Neon e disparando confetes instantaneamente.
