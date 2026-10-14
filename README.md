# TableHub — frontend

React/Vite para gestão do restaurante e cardápio por QR, integrado ao [backend Java/SQL Server](https://github.com/Pablo-numsei/backend2). Preserve o `package-lock.json` para reproduzir a árvore de dependências verificada.

## Executar

Use Node.js compatível com o Vite 7, preferencialmente 22.12 ou superior. Copie `.env.example` para `.env.local` e ajuste os endereços:

```dotenv
VITE_API_URL=http://localhost:8080
VITE_PUBLIC_URL=http://localhost:5173
```

Essas variáveis são incorporadas **no build**. `VITE_PUBLIC_URL` deve apontar para o frontend acessível pelo telefone ao gerar QR Codes. Se não for definida, utiliza-se a origem atual do navegador. Um endereço localhost não é acessível em outro dispositivo. Nunca coloque senha do banco, JWT_SECRET ou chave VAPID privada em variáveis `VITE_*`.

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run dev
# Gerar artefatos em dist
npm.cmd run build
```

O backend precisa permitir a origem escolhida no CORS. Em hospedagem estática, configurar fallback das rotas SPA para `index.html`, preservando as URLs dos arquivos de assets. Produção exige HTTPS.

## Fluxos

- Administrador cadastra produtos/categorias/mesas e ajusta estoque. Garçom e Cozinha têm permissões próprias; a autorização definitiva está no backend.
- Em Mesas, a equipe abre Gerenciar mesa e obtém o novo QR assinado. O QR tem margem branca e link copiável. Substitua os códigos antigos.
- Cliente troca o QR por contexto de mesa de duas horas, guardado na aba. O número sozinho deixa o cardápio disponível apenas para consulta. Não existe associação automática à Mesa 04.
- Carrinho/confirmação usam IDs e preços atuais do servidor. Cada pedido recebe um token próprio; o contexto da mesa não abre pedidos de outras pessoas.
- Cliente chama garçom/conta usando contexto da mesa ou token do pedido. Chamados idênticos ainda abertos são reutilizados pelo servidor.
- Mesas mostra todos os registros, pedidos associados e situação operacional: ocupada até entrega e confirmação de pagamento de todos os pedidos. Isso não registra presença física/reserva.
- A rota `/clientes` apresenta **pedidos anônimos reais**; não inventa nomes, telefones, visitas ou vínculos entre pessoas. Totais descrevem somente os pedidos filtrados.
- Pagamentos são identificados como **simulação**, sem transação bancária. O cliente solicita; equipe autorizada confirma. Estados e valores são consultados no servidor.

Sessão da equipe usa sessionStorage por padrão; “Lembrar” utiliza localStorage explicitamente. Logout limpa os registros do navegador. Um JWT copiado não é revogado instantaneamente no servidor; tokens em Web Storage permanecem sujeitos a XSS da mesma origem.

## Testes

`npm test` cobre sessão/perfis, tokens e headers por pedido/mesa, catálogo, carrinho, preços decimais, busca e pedidos anônimos. `node tests/browserSmoke.mjs` usa o build de `dist`, Chromium/Edge instalado, perfil temporário em `.browser-tests` e API interceptada; **não acessa SQL Server**. O teste de navegador é separado da suíte Node.

Os relatórios da rodada ficam no repositório backend: [auditoria](https://github.com/Pablo-numsei/backend2/blob/main/AUDITORIA_FINALIZACAO.md), [testes](https://github.com/Pablo-numsei/backend2/blob/main/RELATORIO_TESTES_FINALIZACAO.md) e [guia de entrega](https://github.com/Pablo-numsei/backend2/blob/main/GUIA_ENTREGA.md).

## Limitações conhecidas

Sem gateway ou segregação de pagamentos demonstrativos no banco. Sem identificação de clientes, reservas/comandas, recuperação de senha ou 2FA nesta rodada. Observações de preparo permanecem locais e a interface orienta comunicar restrições à equipe. QR compartilhado não prova presença física. Requisições repetidas de criação de pedido ainda não têm idempotência durável entre reinícios.

Homologação em SQL Server de teste, leitura física de QR e notificações reais continuam necessárias. Nenhuma implantação em produção foi feita.
