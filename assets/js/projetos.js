// ============================================================
//  Projetos do portfólio
//  publico: false  -> o projeto NÃO aparece no site.
//  Usado para projetos com código privado ou que ainda não estão
//  no GitHub. Para mostrar, troque para true (e, se quiser,
//  preencha "repo" depois de publicar o código).
// ============================================================
window.PROJETOS = [
  {
    id: "nutricare",
    publico: true,
    destaque: true,
    nome: "NutriCare",
    subtitulo: "Plataforma de acompanhamento nutricional para pacientes com diabetes",
    categoria: "fullstack",
    status: "concluido",
    imagem: "assets/projetos/nutricare.jpg",
    resumo:
      "Ecossistema com API, painel web para nutricionistas e app mobile para pacientes. Trabalho de Conclusão de Curso em parceria com o curso de Nutrição.",
    problema:
      "O acompanhamento de pacientes com diabetes depende de registros de glicemia e alimentação que normalmente ficam no papel ou espalhados em aplicativos diferentes. O NutriCare junta paciente e nutricionista no mesmo sistema, com aplicação prevista na ADJ (Associação de Diabetes Juvenil) de Birigui.",
    funcionalidades: [
      "App mobile do paciente: registro de glicemia e refeições, plano alimentar, mensagens, conteúdos educativos e notificações push",
      "Painel web da nutricionista: vínculo com pacientes, plano alimentar, relatórios com exportação CSV e PDF, mensagens e painel de alertas",
      "Perfil de administrador com métricas e gestão de usuários",
      "Login com e-mail/senha (JWT) e com Google",
      "Banco PostgreSQL versionado por migrations e testes automatizados na API",
      "Integração contínua no GitHub Actions e deploy no Render",
    ],
    tecnologias: ["TypeScript", "NestJS", "PostgreSQL", "React", "Vite", "React Native", "Expo", "Docker", "GitHub Actions"],
    repo: "https://github.com/ahr7onix/Projeto_tcc",
    demo: "https://nutricare-adj-painel.onrender.com",
    observacoes: [
      "Projeto em equipe: Natan Lourenço e Silva, Isac Buzelli dos Santos e Henrique Payá Ferreira.",
      "O painel online exige cadastro. No plano gratuito do Render o servidor pode levar cerca de 1 minuto para acordar.",
      "Os alimentos cadastrados são dados de exemplo e não devem ser usados clinicamente.",
    ],
  },
  {
    id: "market-hub",
    publico: false, // repositório privado no GitHub
    destaque: true,
    nome: "Market Hub",
    subtitulo: "SaaS de gestão de vendas para Mercado Livre e Shopee",
    categoria: "fullstack",
    status: "desenvolvimento",
    imagem: "assets/projetos/market-hub.jpg",
    resumo:
      "Plataforma SaaS para quem vende em marketplaces: centraliza pedidos, produtos e etiquetas de várias lojas em um único painel.",
    problema:
      "Quem vende no Mercado Livre e na Shopee ao mesmo tempo precisa alternar entre painéis diferentes para acompanhar pedidos e estoque. O Market Hub conecta as contas e sincroniza tudo em um lugar só.",
    funcionalidades: [
      "Integração com Mercado Livre e Shopee por adaptadores de marketplace",
      "Sincronização de pedidos em fila de processamento, com novas tentativas automáticas",
      "Gestão de produtos, pedidos e etiquetas",
      "Assinaturas com período de teste e webhooks",
      "Suporte em tempo real via WebSocket",
      "Área administrativa com receita, logs e usuários",
    ],
    tecnologias: ["TypeScript", "Next.js", "NestJS", "Prisma", "Turborepo", "Tailwind CSS", "Socket.IO", "Docker"],
    repo: "",
    demo: "https://market-hub-saas-web.vercel.app",
    observacoes: ["Código-fonte privado."],
  },
  {
    id: "survival-live",
    publico: false, // ainda não está no GitHub
    destaque: true,
    nome: "Survival Live 24/7",
    subtitulo: "Jogo no Roblox controlado pela audiência de uma live do TikTok",
    categoria: "games",
    status: "prototipo",
    imagem: "",
    resumo:
      "Arena de sobrevivência no Roblox em que comentários e presentes da live viram ações dentro do jogo, com servidor de integração, painel administrativo e overlay para transmissão.",
    problema:
      "Lives interativas exigem que o público influencie o conteúdo em tempo real sem que o apresentador precise operar tudo à mão. O sistema traduz eventos da live em comandos para o jogo, com filtros, limites e fila.",
    funcionalidades: [
      "Jogo Roblox com ondas de inimigos, heróis controlados por comandos do chat e rankings",
      "Servidor de integração com fila, filtros e limites por usuário",
      "Painel administrativo com login e overlay vertical 1080×1920 para o OBS",
      "Supervisor que reinicia o servidor após quedas",
      "Simulador de comentários e presentes para testar sem live",
      "120 testes automatizados (todos passando)",
    ],
    tecnologias: ["TypeScript", "Node.js", "Luau", "Roblox Studio", "Zod", "OBS"],
    repo: "",
    demo: "",
    observacoes: [
      "A integração com o TikTok usa uma biblioteca não oficial e ainda não foi validada com uma live real.",
    ],
  },
  {
    id: "translator-overlay",
    publico: false, // ainda não está no GitHub
    destaque: false,
    nome: "TranslatorOverlay",
    subtitulo: "Tradutor em tempo real do chat de jogos com OCR e IA",
    categoria: "automacao",
    status: "concluido",
    imagem: "",
    resumo:
      "Programa para Windows que lê o chat do Roblox pela tela, traduz e mostra a tradução em uma janela sobre o jogo, sem tocar nos arquivos ou na memória do jogo.",
    problema:
      "Jogadores brasileiros em servidores internacionais não entendem o chat. O programa traduz as mensagens automaticamente e também traduz o que o jogador escreve em português.",
    funcionalidades: [
      "Captura de tela da área do chat e reconhecimento de texto (OCR)",
      "Tradução com dicionário local, tradutor secundário e IA opcional (API da Anthropic) usando o contexto da conversa",
      "Overlay sobre o jogo, atalhos globais e ícone na bandeja do sistema",
      "Tradução rápida do português para o idioma do chat",
      "184 testes automatizados (todos passando)",
    ],
    tecnologias: ["Python", "OCR", "Claude API", "Windows"],
    repo: "",
    demo: "",
    observacoes: [],
  },
  {
    id: "vanguard-bot",
    publico: false, // ainda não está no GitHub
    destaque: false,
    nome: "Vanguard Bot",
    subtitulo: "Bot de Discord para gestão de comunidade",
    categoria: "automacao",
    status: "concluido",
    imagem: "",
    resumo:
      "Bot que monta e administra o servidor de Discord de um clã de jogos: estrutura de canais, tickets, recrutamento, tryouts, moderação e logs.",
    problema:
      "Comunidades grandes no Discord gastam muito tempo com tarefas repetitivas de moderação e recrutamento. O bot automatiza esse fluxo.",
    funcionalidades: [
      "Criação automática da estrutura do servidor, com modo de pré-visualização",
      "Tickets, recrutamento e tryouts com média de avaliações",
      "Moderação com sistema de advertências e logs",
      "Backup da configuração",
      "12 testes automatizados (todos passando)",
    ],
    tecnologias: ["JavaScript", "Node.js", "discord.js"],
    repo: "",
    demo: "",
    observacoes: [],
  },
  {
    id: "nx",
    publico: true,
    destaque: false,
    nome: "NX Web Design",
    subtitulo: "Site institucional para agência de web design",
    categoria: "web",
    status: "concluido",
    imagem: "assets/projetos/nx.jpg",
    resumo:
      "Site de quatro páginas (início, serviços, planos e contato) com visual 3D, pensado para apresentar uma agência e captar orçamentos.",
    problema:
      "Uma agência precisa transmitir qualidade logo no primeiro acesso e transformar visitas em pedidos de orçamento.",
    funcionalidades: [
      "Layout responsivo com menu mobile e destaque do link ativo",
      "Filtro de projetos por categoria e seletor de orçamento",
      "Formulário de contato com envio real por e-mail (FormSubmit)",
      "Efeito de inclinação 3D nos cards",
    ],
    tecnologias: ["HTML", "CSS", "JavaScript"],
    repo: "https://github.com/ahr7onix/NX",
    demo: "https://ahr7onix.github.io/NX/",
    observacoes: ["Os cases exibidos no site são exemplos ilustrativos."],
  },
  {
    id: "nexus",
    publico: true,
    destaque: false,
    nome: "Nexus",
    subtitulo: "Landing page de vendas com área de login e dashboard",
    categoria: "web",
    status: "prototipo",
    imagem: "assets/projetos/nexus.jpg",
    resumo:
      "Página de vendas para um produto digital fictício, com estrutura de funil completa e uma área de membros demonstrativa.",
    problema:
      "Mostra como estruturar uma página que conduz o visitante do problema à oferta: dor, solução, passo a passo, bônus e planos.",
    funcionalidades: [
      "Estrutura de funil: problema, solução, etapas, bônus e tabela de preços",
      "Barra de oferta com contagem regressiva e contadores animados",
      "Telas de login e cadastro com dashboard (dados salvos só no navegador)",
    ],
    tecnologias: ["HTML", "CSS", "JavaScript"],
    repo: "https://github.com/ahr7onix/portfolio/tree/main/Nexus",
    demo: "Nexus/",
    observacoes: [
      "Protótipo de front-end, sem servidor: o login é apenas demonstrativo.",
      "Depoimentos e números da página são conteúdo de exemplo.",
    ],
  },
  {
    id: "perfil-3d",
    publico: true,
    destaque: false,
    nome: "Perfil 3D",
    subtitulo: "Página de perfil com universo 3D interativo",
    categoria: "web",
    status: "concluido",
    imagem: "assets/projetos/perfil-3d.jpg",
    resumo:
      "Página pessoal com um universo em Three.js (buraco negro, planetas, nebulosas e cometas) que reage à música.",
    problema:
      "Criadores de conteúdo precisam de uma página única para reunir suas redes, com identidade visual marcante e fácil de personalizar.",
    funcionalidades: [
      "Cena 3D com buraco negro, disco de acreção, planetas e cinturão de asteroides",
      "Visualizador e animações sincronizados com a música (playlist do YouTube)",
      "Card com inclinação 3D, efeito glitch e status ao vivo do Discord",
      "Tudo personalizável em um único arquivo de configuração",
    ],
    tecnologias: ["JavaScript", "Three.js", "HTML", "CSS"],
    repo: "https://github.com/ahr7onix/ahr7onix.github.io",
    demo: "https://zynxvoid.vercel.app",
    observacoes: [],
  },
  {
    id: "idrak",
    publico: false, // página feita para um amigo, com dados pessoais dele
    destaque: false,
    nome: "Cartaz de Recompensa",
    subtitulo: "Página de perfil animada no estilo One Piece",
    categoria: "web",
    status: "concluido",
    imagem: "",
    resumo: "Perfil em forma de cartaz de recompensa, com vídeo de fundo e efeitos sincronizados ao ritmo da música.",
    problema: "Página de perfil personalizada feita para um amigo.",
    funcionalidades: ["Efeitos sincronizados ao BPM da música", "Cartaz que vira para mostrar o verso", "Configuração em um único arquivo"],
    tecnologias: ["JavaScript", "HTML", "CSS"],
    repo: "https://github.com/ahr7onix/idrak-perfil",
    demo: "https://ahr7onix.github.io/idrak-perfil/",
    observacoes: [],
  },
];
