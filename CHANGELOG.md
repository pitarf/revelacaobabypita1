# Changelog

Histórico de versões e alterações para o sistema de Chá Revelação.

## [1.1.0] - 2026-06-29

### Adicionado
- **Segurança & Privacidade**:
  - Adicionada a tag de metadados de exclusão de indexação por motores de busca (`robots: "noindex, nofollow"`) no arquivo global `src/app/layout.tsx` para obedecer à privacidade de busca especificada.
- **Banco de Dados & Semeadura**:
  - Atualização do script `prisma/seed.ts` para limpar a tabela de palpites e semear exatamente 21 votos iniciais (16 para Miguel e 5 para Rafaella), refletindo a realidade de votação do evento com proporção de 76% e 24%.
- **Identidade Visual**:
  - Integração da fonte clássica cursiva *Pacifico* carregada localmente (`/Pacifico.ttf`) via regra `@font-face` para destacar textos e cabeçalhos em `globals.css` no Tailwind v4, eliminando requisições a servidores externos de fontes.
  - Atualização do componente `Header.tsx` para renderizar os nomes de bebês em destaque com a fonte Pacifico em peso regular (`font-normal`), evitando a distorção do falso negrito gerado pelo navegador.
  - Aumento expressivo da escala tipográfica para "Miguel" e "Rafaella" (de `5xl` a `8xl`), ajustando o alinhamento vertical da linha de base da caligrafia e adicionando drop-shadows suaves coloridos correspondentes para maior destaque visual.
  - Ampliação dos botões e fontes da votação de palpites (`RevealVote.tsx`): botões maiores (`py-5 px-8` e `rounded-3xl`), fonte Pacifico (`font-serif`) aplicada aos nomes dos bebês nos botões de voto em tamanho gigante (`text-3xl` a `5xl`), título da pergunta ampliado para `4xl`, e ampliação do botão roxo de visualizar resultados.
  - Integração da nova paleta de cores de decoração (Branco e Pêssego/Apricot `#f6b26b`) nas variáveis de tema global de CSS (`globals.css`), alinhando bordas e realces do site e alterando o confete de sucesso para o pêssego.
  - Criação de uma seção dedicada para Sugestão de Traje (`DressCode.tsx`) no site público, exibindo a paleta recomendada (Branco e `#f6b26b`) e dicas de combinação para orientar os convidados com elegância.
  - Limpeza dos círculos de cores em `DressCode.tsx`: removido o texto interno de visualização ("Branco" e "#f6b26b") para exibir apenas a cor sólida e o efeito de profundidade.
  - Redesenho completo e refinamento do painel de resultados de palpites (`RevealVote.tsx`): removida a barra fina dividida antiga e inseridas duas barras de progresso individuais grossas e modernas (azul e rosa) com brilho interno, animações, contagem de votos, nomes dos bebês em Pacifico e rodapé simplificado.
  - Estilização da modal de confirmação de palpite em `RevealVote.tsx`: centralização total dos textos, inputs com placeholders centralizados e bordas na cor pêssego `#f6b26b`, remoção do botão fechar flutuante e inclusão de botões arredondados e preenchidos ("Voltar" e "Registrar Palpite"), conforme o mockup recebido.
  - Redesenho da seção de confirmação de presença (`RsvpSection.tsx`): centralização das informações logísticas (Data, Hora, Local) com ícones e rótulos roxos `#5f5cd1`, e inclusão do botão de ação roxo centralizado, de acordo com o print de referência.
  - Otimização da modal de RSVP (`RsvpModal.tsx`): substituição dos seletores de quantidade por dropdowns `<select>` nativos, inclusão de um card com mockup funcional do reCAPTCHA "Não sou um robô" para validação anti-spam e alinhamento dos botões de ação na base direita.
  - Substituição de `font-serif` por `font-sans` nos títulos do painel administrativo para manter a estética corporativa e limpa.
  - Integração de imagem de plano de fundo personalizada com ilustração de ursinhos e balões de ar quente (`/background.png`) em `.bg-baby-gradient`.
  - Reestruturação da área inicial do site: o painel de votação e palpites (`RevealVote`) foi movido e integrado no cabeçalho principal (`Header.tsx`) logo abaixo dos cartões de informações logísticas (Data, Horário e Local), com botões planos simplificados e botão roxo de alternar resultados. Também aumentamos o espaçamento inferior dos nomes dos bebês (`mb-16 md:mb-20`) para dar o devido respiro visual em relação aos cartões de informações do evento, alinhado com os requisitos de design e capturas fornecidas.
  - Reordenação de seções da Home (`page.tsx`): a Galeria de Fotos (`PhotoGallery.tsx`) foi movida para ser exibida antes da seção da Mensagem dos Pais (`BabyMessage.tsx`). Adicionalmente, organizamos as seções subsequentes para exibir a Confirmação de Presença (`RsvpSection.tsx`) diretamente abaixo da Mensagem dos Pais, seguida da Sugestão de Traje (`DressCode.tsx`), Lista de Presentes (`GiftList.tsx`) e a seção condicional de Vídeo (`VideoSection.tsx`) ao final. Definimos as dimensões do carrossel para o formato ampliado de 420x560px (`w-[420px] max-w-full aspect-[3/4]`), removemos todas as legendas e frases sobrepostas às fotos (tanto no carrossel quanto na modal de zoom), posicionamos as setas de navegação nas laterais externas do card, aplicamos círculos numerados interativos sobrepostos na base interna da foto e adicionamos uma animação suave de fade-in no re-mount das imagens ao alternar os slides.
  - Atualização e formatação da Mensagem dos Pais (`BabyMessage.tsx`): habilitada a renderização de tags HTML no texto (usando `dangerouslySetInnerHTML`) para permitir formatação rica com negritos (`<strong>`), removemos as aspas duplas externas `"..."` e tratamos quebras de linha `\n` como `<br/>`. Também removemos a caixa contorno bege (`glass-card`) e o ícone de coração do topo, ampliando a largura máxima da seção para `max-w-5xl` e do texto interno para `max-w-4xl` para que os parágrafos fiquem dispostos em formato largo, definindo a clássica tipografia **Times New Roman** (serif) e aumentando o tamanho das fontes (título em `text-3xl md:text-4xl` e corpo em `text-lg md:text-xl lg:text-[22px]`) para melhor legibilidade. Adicionalmente, no bloco de informações do evento (`RsvpSection.tsx`), substituímos o contêiner `flex gap-1.5` nas informações de Data, Hora e Endereço por blocos de texto inline estáveis (`mr-1.5` para o rótulo `<span>`) e ampliamos a largura máxima do contêiner para `max-w-lg`, corrigindo em definitivo a quebra de linha anômala da cidade "Ramos" que ocorria em layouts Flexbox estreitos.
  - Ajuste cromático e tipográfico geral (`globals.css`, `Header.tsx`, `MusicPlayer.tsx`, `RsvpSection.tsx`, `RsvpModal.tsx`, `RevealVote.tsx`, `PhotoGallery.tsx`, `GiftList.tsx`, `BabyMessage.tsx`, `DressCode.tsx`, `VideoSection.tsx`): substituímos todas as ocorrências de cor roxa (`#5f5cd1` com hover `#4d4ab2`) pelo tom pêssego (`#f6b26b` com hover `#e09d56`) e fundo sólido no menu principal. Redefinimos a variável `--color-gray-500` para `#000000` no bloco `@theme` de `globals.css` para alterar instantaneamente todos os textos cinzas secundários do site para a cor preta. Adicionalmente, ampliamos a escala tipográfica de todos os títulos das seções principais para `text-3xl md:text-4xl lg:text-5xl` (e a Mensagem dos Pais para `text-3xl md:text-5xl lg:text-6xl`) para conferir maior legibilidade e destaque visual.
  - Seeding e Fallback das Fotos Locais da Galeria: semeamos no Neon PostgreSQL e definimos no endpoint `/api/gallery` o carregamento das 5 fotos do ensaio salvas na pasta `/public` que contêm a palavra `capa` no nome (`/capav1.jpg`, `/capa 2v1.jpg`, etc.), acompanhadas de suas respectivas legendas e ordens de exibição. Também removemos a frase explicativa redundante "Escolha um ou mais itens abaixo." da introdução da lista de presentes (`GiftList.tsx`), substituímos o drawer lateral pelo novo modal centralizado e responsivo de filtros contendo as dropdowns "Categoria", "Preço" e "Ordenar por", e adicionamos o botão de "Carrinho" integrado e posicionado ao lado do botão "Filtrar Itens" no topo da listagem de presentes. Adicionalmente, atualizamos o script de importação de presentes (`import_gifts.ts`) para deduzir 6,6% do valor de todos os 82 presentes originais (multiplicando por 0.934) e arredondar os valores para números inteiros (`Math.round`), repovoando a base de dados com esses valores finais para obter o arredondamento ideal.
  - Sincronização do Banco de Dados (`prisma/seed.ts` e `/api/settings`): atualizadas as configurações padrão da tabela `SiteSetting` para conter o novo texto de boas-vindas completo e com as marcações de negrito, limpando dados antigos antes da recriação. Atualizamos a URL do Google Maps para a localização real do evento em Ramos (`https://maps.app.goo.gl/W1VWq4w2wUpApKER7`). Adicionalmente, incluímos uma rotina de migração automática no endpoint GET `/api/settings` para detectar e atualizar instantaneamente tanto a mensagem dos pais quanto o link do Google Maps no banco de dados Neon do usuário, e forçamos o estilo de negrito em `globals.css` para anular o reset do preflight do Tailwind.
  - Mural de Recados dos Convidados (schema, APIs e painéis): adicionamos o modelo `GuestMessage` ao `schema.prisma` e atualizamos o banco Neon via `prisma db push`. Renomeamos a seção e navegação de "Nosso Momento" para "Recados", apontando para a âncora `#recados`. Implementamos o painel público do mural em `BabyMessage.tsx` com listagem em grid das mensagens e botão/modal para envio de recadinhos com limite de 500 caracteres. Por fim, criamos a página administrativa de moderação em `/admin/recados` e sua respectiva API (`/api/admin/messages`) para exclusão e auditoria de mensagens, integrando o atalho com ícone no menu lateral `AdminSidebar.tsx`.

## [1.0.0] - 2026-06-29

### Adicionado
- **Páginas de Checkout & Conclusão**:
  - Checkout em etapas (Identificação com opção de presente anônimo e Mensagem; Escolha do método de pagamento).
  - Tela de conclusão com código copia e cola Pix, QR Code dinâmico, simulador de testes de aprovação rápida e link de envio de comprovante por WhatsApp.
- **Painel Administrativo (`/admin`)**:
  - Login seguro com JWT baseados em e-mail e senha criptografados (bcrypt).
  - Dashboard principal contendo cartões consolidados (adultos, crianças, palpites, bruto, taxas MP, líquido e pendentes), placar visual de votos e tabelas rápidas.
  - CRUD completo para Categorias de Presentes (auto-gerador de slug).
  - CRUD completo para Presentes (limitações de estoque, imagem, destaque isFeatured e links externos).
  - CRUD completo de RSVPs de Convidados.
  - Relatório completo de Pedidos de Presentes e Extrato Financeiro unificado.
  - Controle e mudança do status de entrega dos presentes físicos em tempo real.
  - Exportação de planilhas de RSVPs e Pedidos para CSV formatado em UTF-8 com BOM (compatível com Excel no padrão brasileiro de delimitador `;`).
  - Painel de configurações gerais (títulos, bebê rosa/azul, local maps, data e hora) e financeiro (chave Pix e MP tokens).
  - Painel de controle de mídias (fotos do carrossel, mensagem acolhedora, ativação de vídeo YouTube/Vimeo e volume do tocador MP3 de fundo).
- **Simulador de Sandbox de Cartão de Crédito**:
  - Rota de simulação integrada e transparente para parcelamento em até 5x sem quebrar fluxos em ambientes locais de testes.

## [1.0.0-alpha] - 2026-06-29

### Adicionado
- Inicialização do projeto Next.js (App Router) com TypeScript, Tailwind CSS e ESLint.
- Instalação de dependências: Lucide React, Sonner, Mercado Pago SDK, Canvas Confetti, Recharts, bcryptjs, jsonwebtoken, ws.
- Configuração do Prisma ORM v7 com o novo padrão de Driver Adapters para o Neon PostgreSQL.
- Criação dos arquivos `.env` e `.env.example` com as variáveis de ambiente necessárias.
- Criação e aplicação da migração de banco de dados inicial (`20260629161457_init`) no Neon.
- Geração do Prisma Client personalizado na pasta `src/generated/client`.
