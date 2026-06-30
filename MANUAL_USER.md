# Manual do Usuário - Painel Chá Revelação

Bem-vindo ao painel de administração do seu **Chá Revelação**! Este manual foi criado para ajudar você a personalizar o site, gerenciar seus convidados, acompanhar as confirmações de presença, configurar a lista de presentes e acompanhar os palpites de votação do seu bebê.

---

## 1. Acesso ao Painel Administrativo
O painel administrativo do site é protegido e pode ser acessado através do link:
`http://seusite.com/admin` (ou `http://localhost:3000/admin` durante os testes).

1. Digite seu **e-mail** e **senha** cadastrados.
2. Após o login, você será redirecionado para o **Dashboard Principal**.

---

## 2. Visão Geral (Dashboard)
O Dashboard apresenta métricas resumidas em tempo real para controle do evento:
- **Total de Convidados**: Total de pessoas que confirmaram presença (dividido entre adultos e crianças).
- **Votos Realizados**: Quantidade de votos em "Miguel" (Azul) e "Rafaella" (Rosa), incluindo as porcentagens em tempo real.
- **Presentes Prometidos e Entregues**: Quantidade de presentes selecionados e quantos já foram recebidos fisicamente ou confirmados no financeiro.
- **Resumo Financeiro**: Valor bruto e líquido arrecadados através do Pix e Cartão de crédito.

---

## 3. Gerenciamento de Convidados (RSVP)
Na aba **Confirmações**, você tem acesso à lista completa de pessoas que responderam ao convite:
- **Busca e Filtros**: Pesquise convidados por nome e filtre por status (Confirmado, Pendente ou Cancelado).
- **Dados do Convidado**: Visualize telefone, e-mail, restrições alimentares (ex: alergias, vegetarianismo) e mensagens de carinho deixadas para os pais.
- **Edição e Exclusão**: Modifique informações ou remova convidados manualmente caso necessário.
- **Exportar lista**: Baixe toda a planilha de convidados em formato CSV para abrir no Excel.

---

## 4. Gerenciamento da Lista de Presentes
Na aba **Presentes**, você administra os itens disponíveis para os convidados escolherem:
- **Adicionar Novo Presente**: Insira nome, descrição, categoria, valor, imagem e quantidade permitida.
- **Exclusão e Edição**: Edite detalhes dos presentes a qualquer momento. Se um presente já foi escolhido por alguém, o sistema preserva o histórico de compras mesmo que você desative o presente da lista pública.
- **Duplicar Presentes**: Ideal para criar rapidamente itens semelhantes (como fraldas de tamanhos diferentes).
- **Categorias**: Crie ou modifique as categorias (Fraldas, Higiene, Roupas, Móveis) que organizam a exibição no site.

---

## 5. Extrato e Acompanhamento Financeiro
Na aba **Extrato**, você acompanha de perto todas as contribuições em dinheiro feitas no site (Pix ou Cartão de crédito):
- **Detalhamento**: Visualize a data, o nome de quem presenteou, o valor bruto enviado e as taxas reais descontadas pelo meio de pagamento, além do valor líquido que será transferido para você.
- **Status do Pagamento**: Acompanhe se o pagamento está Aprovado, Pendente ou Cancelado.
- **Comprovantes**: Para pagamentos manuais por Pix (caso utilize chave simples), os convidados podem enviar o arquivo do comprovante. Você poderá visualizá-los aqui e aprovar o pedido manualmente com um clique.

---

## 6. Personalização do Site e Evento
Na aba **Personalização** e **Configurações**, você adapta todo o site ao seu gosto:
- **Textos e Informações**: Altere o título do evento, a pergunta da votação, a mensagem principal dos pais e os nomes dos bebês.
- **Configuração do Evento**: Ajuste data, horário, local (com link do Google Maps) e endereço alternativo para entrega física de presentes.
- **Mídia**: Envie músicas de fundo, configure o vídeo de apresentação (YouTube ou upload) e envie fotos para a galeria (você pode reordenar as fotos arrastando-as no painel).
- **Visual & Tipografia**: Ajuste cores do tema (paleta rosa e azul) e imagens decorativas. O site público utiliza automaticamente a fonte clássica cursiva infantil **Pacifico** em todas as áreas de destaque (título principal, nomes dos bebês e títulos das seções) para proporcionar uma identidade visual meiga e premium.
- **Privacidade & Motores de Busca**: Por padrão de privacidade e segurança dos seus dados e dos seus convidados, o site foi configurado com bloqueio de indexação (`noindex, nofollow`). Isso significa que ele não ficará listado publicamente nas pesquisas do Google, garantindo que apenas convidados que tenham o link acessem as informações do seu evento.
