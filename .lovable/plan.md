

# Dashboard de Produtividade de Linhas de Produção

## Visão Geral
Interface operacional para monitoramento em tempo real de linhas de produção, com visualização do layout das máquinas, métricas de performance (OEE, DLI) e categorização de paradas. Genérica para diferentes tipos de linhas.

---

## Páginas e Funcionalidades

### 1. Login & Autenticação
- Tela de login com email/senha
- Dois perfis: **Operador** e **Gestor**
- Operador: registra paradas, visualiza métricas da sua linha
- Gestor: acessa dashboards consolidados, relatórios e configurações

### 2. Configuração da Linha (perfil Admin/Gestor)
- Cadastro de linhas de produção (nome, tipo, velocidade nominal)
- Cadastro de máquinas por linha (nome, tipo, posição na sequência)
- **Editor visual drag & drop** para organizar o layout das máquinas no fluxo
- Cadastro de categorias de parada (ex: manutenção, setup, falta de material, etc.)

### 3. Visão da Linha em Tempo Real (página principal)
- **Layout visual da linha**: máquinas representadas como blocos conectados por setas de fluxo
- Cada máquina mostra status com cor (rodando = verde, parada = vermelho, setup = amarelo)
- Clicar numa máquina abre painel lateral com:
  - OEE da máquina (Disponibilidade × Performance × Qualidade)
  - Throughput / Vazão (DLI)
  - Histórico de paradas recentes
  - Botão para registrar nova parada (Operador)
- Barra superior com métricas consolidadas da linha (OEE geral, throughput total)

### 4. Registro de Paradas (Operador)
- Selecionar máquina → informar início/fim da parada
- Categorizar a parada (dropdown com categorias configuradas)
- Adicionar observações opcionais
- Visualização das paradas ativas e recentes

### 5. Dashboard do Gestor
- Visão consolidada de todas as linhas
- Gráficos de OEE ao longo do tempo (por turno, dia, semana)
- Pareto de paradas por categoria
- Comparativo entre máquinas e linhas
- Indicadores DLI com gráfico de vazão

### 6. Dados e Integração
- Inicialmente com **dados mock** simulando produção em tempo real
- Estrutura preparada para consumir a API do gateway/broker da ESP32
- Polling ou WebSocket para atualização em tempo real

---

## Design & UX
- Sidebar com navegação entre: Linha ao Vivo, Paradas, Dashboard, Configurações
- Tema escuro como padrão (ambiente industrial)
- Cards e indicadores grandes e legíveis para uso em monitores na fábrica
- Layout responsivo mas otimizado para telas grandes (monitores industriais)

---

## Backend (Lovable Cloud / Supabase)
- Tabelas: linhas, máquinas, paradas, categorias_parada, métricas
- Tabela de user_roles (operador/gestor) com RLS
- Autenticação via Supabase Auth
- Edge functions para cálculo de OEE e agregações

