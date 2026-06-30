# Roadmap de Tarefas - Chá Revelação

Roadmap detalhado do desenvolvimento da aplicação de Chá Revelação (Miguel ou Rafaella?).

## [x] 1. Inicialização e Configuração
- [x] Criar estrutura do projeto Next.js (App Router)
- [x] Instalar dependências necessárias (Prisma, Lucide, Sonner, Mercado Pago SDK, etc.)
- [x] Configurar o banco de dados Neon PostgreSQL via Prisma 7 (Driver Adapter)
- [x] Gerar o Prisma Client no diretório `src/generated/client`
- [x] Criar `.env.example`, `CHANGELOG.md` e documentação técnica inicial

## [x] 2. Modelagem do Banco e Dados Iniciais
- [x] Criar script de semente (seed) no banco com dados padrões (Admin, EventSetting, Presentes e Categorias iniciais)
- [x] Rodar o seed para popular o banco de dados Neon

## [x] 3. Desenvolvimento de APIs (Backend)
- [x] Rota de Autenticação Administrativa (Login por e-mail e senha com sessão JWT baseada em cookies)
- [x] Rota de Votos (Prevenção de spam por cookie e IP, sem travar rede residencial)
- [x] Rota de RSVP (Confirmação de presença e cancelamento seguro)
- [x] Rotas de Presentes e Carrinho (Validação concorrente de estoque no servidor)
- [x] Rota de Checkout (Criação de pedidos, QR Code Pix e integração simulada/real com Mercado Pago)
- [x] Rota de Webhooks do Gateway de Pagamento

## [x] 4. Interface Pública (Mobile-First)
- [x] Configuração de Tema Visual (rosa e azul suave, ursinhos, nuvens e balões com Tailwind)
- [x] Cabeçalho com data, local, contagem regressiva e botões fixos no mobile
- [x] Controle flutuante elegante de Música de Fundo (contornando restrições de navegadores)
- [x] Mensagem dos pais, vídeo opcional e Galeria de Fotos (Carrossel com Zoom)
- [x] Votação interativa com exibição em tempo real do gráfico de percentuais
- [x] Modal do formulário RSVP com máscaras de campo brasileiras
- [x] Lista de Presentes com filtros rápidos por categoria, preço e ordenação
- [x] Carrinho de compras flutuante e checkout em etapas
- [x] Páginas de conclusão, termos de uso e política de privacidade (LGPD)

## [x] 5. Painel Administrativo (/admin)
- [x] Login do administrador com sessão segura
- [x] Dashboard com totalizadores (RSVP, votos, valores recebidos por Pix/Cartão) e gráficos de desempenho
- [x] CRUD de Categorias e Presentes (com exportação e controle de estoque)
- [x] Gerenciamento de RSVP (busca por convidado, edição de quantidade, exportação de lista)
- [x] Extrato financeiro com detalhamento de taxas reais dos meios de pagamento
- [x] Personalização dinâmica do tema (cores de fundo, mensagens, fontes) e mídias do evento

## [x] 6. Testes e Validação
- [x] Testes de fluxo de checkout concorrente (garantir que o estoque do presente não fique negativo)
- [x] Testes de visualização mobile-first
- [x] Ajustes e polimentos visuais premium
