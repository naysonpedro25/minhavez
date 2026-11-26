<img src="marca/minhavez-horizontal-fundo-branco.svg" alt="MinhaVez" height="48">

# MinhaVez · marcação de consultas pelo WhatsApp nas UBS de Maragogi

Protótipo navegável da proposta da **Equipe C**, do EDGE Academy (UFAL).

Hoje, quem precisa de consulta com enfermagem ou clínico geral nas UBS de Maragogi chega de madrugada para garantir a vaga. E, quando o médico falta, o paciente só descobre ao chegar à unidade. O MinhaVez liga os dois lados na mesma agenda:

- **o paciente** marca pelo WhatsApp, escolhe o dia e a janela de chegada e é avisado quando a vez dele está perto;
- **a UBS** acompanha a fila do dia num painel. A fila anda sozinha e, se houver imprevisto, todos os afetados recebem o aviso de uma vez.

> É uma simulação: o WhatsApp é desenhado na tela e os dados são fictícios. Nenhuma mensagem é enviada de verdade.

## Como abrir

**Demo online:** https://naysonpedro25.github.io/minhavez/

Também dá para baixar a pasta e abrir o `index.html` no navegador, sem instalar nada. A página inicial leva às duas partes da demo:

- `whatsapp.html`: o celular do paciente;
- `painel.html`: o painel da recepção da UBS.

As duas páginas compartilham o mesmo estado. Com uma em cada aba, o que acontece em uma aparece na outra. O estado fica guardado no navegador, e **Recomeçar a demonstração** volta tudo ao início.

## Roteiro rápido

**Paciente**

1. Toque em **Oi** e informe um CPF fictício: Maria, `111.222.333-44`, ou a mãe dela, Josefa, `555.666.777-88`.
2. Escolha o tipo de consulta, o dia e a janela de chegada nas listas.
3. Em **De quem é este celular**, troque de contato para marcar para um familiar.
4. Na barra de simulação, use **Até as 18h · lembretes** para receber o lembrete da véspera e responder.

**UBS**

1. Na **Fila de hoje**, marque a chegada de um paciente.
2. Conclua um atendimento: o próximo da fila é chamado sozinho e recebe o aviso no WhatsApp. A chamada automática pode ser desligada no interruptor.
3. Toque em **Registrar imprevisto de hoje**, diga o que aconteceu e escolha o que fazer com os pacientes afetados. O histórico fica na aba **Imprevistos**.
4. Em **Marcar no balcão**, marque para quem chegou sem celular.

Cada página tem um **Roteiro da demo** no canto, que vai se marcando conforme as etapas são feitas.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Página inicial |
| `whatsapp.html` | Simulação do WhatsApp do paciente |
| `painel.html` | Painel da UBS |
| `app.js` | Dados fictícios, regras da fila e da agenda |
| `styles.css`, `minhavez.css` | Estilos |
| `marca/` | Logo e ícone do MinhaVez |
