/* Protótipo · Marcação de consultas nas UBS de Maragogi
   WhatsApp simulado + painel do Gestor da UBS. Todos os dados são fictícios
   e ficam só neste navegador. Sem servidor, sem WhatsApp real. */
(function () {
  'use strict';

  // ---------- Constantes ----------
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const TURNOS = {
    manha: { label: 'Manhã', janelas: ['07:00', '08:00', '09:00', '10:00'] },
    tarde: { label: 'Tarde', janelas: ['13:00', '14:00', '15:00'] },
  };
  const TIPOS = { enf: 'Enfermagem', cli: 'Clínico geral' };
  const POR = { paciente: 'Paciente', familiar: 'Familiar', acs: 'ACS', gestor: 'Balcão' };
  const ACTIVE = ['marcada', 'confirmada'];
  const ANTECEDENCIA = 7;
  const STORE_KEY = 'ubs-marcacao-proto-v3';
  const HORARIO = { abre: 7, fecha: 17 };
  const MARIA_TEL = '82988881234';

  // ---------- Datas (tudo em UTC para não depender do fuso) ----------
  const toMs = (d, hm) => {
    const [y, m, dd] = d.split('-').map(Number);
    const [h, mi] = (hm || '00:00').split(':').map(Number);
    return Date.UTC(y, m - 1, dd, h, mi);
  };
  const dOf = ms => new Date(ms).toISOString().slice(0, 10);
  const hmOf = ms => new Date(ms).toISOString().slice(11, 16);
  const addDays = (d, n) => dOf(toMs(d) + n * 864e5);
  const wd = d => new Date(toMs(d)).getUTCDay();
  const isUtil = d => { const w = wd(d); return w > 0 && w < 6; };
  const fmtD = d => { const [, m, dd] = d.split('-'); return `${DIAS[wd(d)]}, ${dd}/${m}`; };
  const fmtH = hm => { const [h, m] = hm.split(':'); return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`; };
  const plusH = (hm, n) => { const [h, m] = hm.split(':').map(Number); return `${String(h + n).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
  const janelaTxt = hm => `${fmtH(hm)} às ${fmtH(plusH(hm, 1))}`;
  const nextUtil = d => { let x = addDays(d, 1); while (!isUtil(x)) x = addDays(x, 1); return x; };

  // ---------- Texto ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTxt = s => esc(s).replace(/\*(.+?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtTel = t => t ? `(${t.slice(0, 2)}) ${t.slice(2, 3)} ${t.slice(3, 7)}-${t.slice(7)}` : '—';
  const fmtCpf = c => `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
  const firstLast = n => { const p = n.split(' '); return p.length > 1 ? `${p[0]} ${p[p.length - 1]}` : n; };
  const first = n => n.split(' ')[0];
  const turnoTxt = t => TURNOS[t].label.toLowerCase();
  let uidN = 0;
  const newId = p => `${p}${Date.now().toString(36)}${(uidN++).toString(36)}`;

  // ---------- Dados fictícios ----------
  const NOMES = ['Antônio Pereira', 'Francisca Oliveira', 'José Carlos Santos', 'Luzia Ferreira', 'Raimundo Alves',
    'Cícera Gomes', 'Severino Barbosa', 'Rita de Cássia Lima', 'João Batista Rocha', 'Marlene Cavalcanti',
    'Pedro Henrique Melo', 'Damiana Araújo', 'Manoel Costa', 'Helena Bezerra', 'Sebastião Nunes', 'Joana Darc Silva',
    'Edvaldo Lins', 'Quitéria Moura', 'Luiz Gonzaga Teixeira', 'Aparecida Ramos', 'Givaldo Freitas', 'Socorro Vieira',
    'Fábio Monteiro', 'Neide Correia', 'Valdir Pinto', 'Iracema Duarte', 'Ronaldo Farias', 'Tereza Cristina Lopes',
    'Benedito Castro', 'Lúcia Albuquerque', 'Cláudio Moraes', 'Vera Lúcia Brito'];
  // Pacientes da fila de hoje (terça 10/11) e da segunda que passou
  const NOMES_HOJE = ['Genival Tavares', 'Marinalva Souto', 'Expedito Lira', 'Rosilene Batista', 'Adauto Siqueira',
    'Zuleide Prado', 'Orlando Queiroz', 'Valdete Matos', 'Cosme Damião Leal', 'Irene Fontes', 'Jailson Brandão', 'Edite Carneiro'];

  function seed() {
    const ubs = [
      { id: 'centro', nome: 'UBS Centro', contato: 'Seg a sex, 7h às 17h · (82) 3000-0001 (fictício)' },
      { id: 'saobento', nome: 'UBS São Bento', contato: 'Seg a sex, 7h às 17h · (82) 3000-0002 (fictício)' },
    ];
    const profs = [
      { id: 'carlos', ubs: 'centro', nome: 'Dr. Carlos Lima', tipo: 'cli', vagas: 3, turnos: { manha: true, tarde: true } },
      { id: 'ana', ubs: 'centro', nome: 'Enf. Ana Souza', tipo: 'enf', vagas: 3, turnos: { manha: true, tarde: true } },
      { id: 'beatriz', ubs: 'saobento', nome: 'Dra. Beatriz Rocha', tipo: 'cli', vagas: 3, turnos: { manha: true, tarde: false } },
      { id: 'paulo', ubs: 'saobento', nome: 'Enf. Paulo Mendes', tipo: 'enf', vagas: 3, turnos: { manha: true, tarde: true } },
    ];
    const pacs = [
      { id: 'p-maria', nome: 'Maria José da Silva', cpf: '11122233344', cns: '700000000000001', ubs: 'centro', tel: MARIA_TEL },
      { id: 'p-josefa', nome: 'Josefa da Silva', cpf: '55566677788', cns: '700000000000002', ubs: 'centro', tel: null },
    ];
    NOMES.forEach((nome, i) => {
      const n = i + 1;
      pacs.push({
        id: `p${n}`, nome,
        cpf: String(20000000000 + n * 1234567).slice(0, 11),
        cns: String(700000000000100 + n),
        ubs: i < 24 ? 'centro' : 'saobento',
        tel: n % 6 === 0 ? null : '8299' + String(1000000 + n * 37291).slice(-7),
      });
    });
    const tels = { [MARIA_TEL]: { dono: null, label: 'Maria José' } };
    pacs.forEach(p => { if (p.tel && p.tel !== MARIA_TEL) tels[p.tel] = { dono: p.id }; });

    const marcs = [];
    const porCiclo = ['paciente', 'familiar', 'paciente', 'acs', 'paciente'];
    const add = (n, prof, data, turno, janela) => {
      const p = pacs.find(x => x.id === `p${n}`);
      const pr = profs.find(x => x.id === prof);
      const por = p.tel ? porCiclo[n % porCiclo.length] : 'gestor';
      marcs.push({
        id: `s${n}-${data}`, pac: p.id, ubs: pr.ubs, prof, tipo: pr.tipo, data, turno, janela, status: 'marcada',
        por: { tipo: por, tel: p.tel }, criado: toMs('2026-11-09', '10:00'), lembrado: false, canal: p.tel ? 'WhatsApp' : 'Balcão',
      });
    };
    // Quarta 11/11
    add(21, 'carlos', '2026-11-11', 'manha', '07:00'); add(22, 'carlos', '2026-11-11', 'manha', '07:00');
    add(23, 'carlos', '2026-11-11', 'manha', '08:00'); add(19, 'ana', '2026-11-11', 'tarde', '13:00');
    // Quinta 12/11 — o dia do imprevisto
    [[1, '07:00'], [2, '07:00'], [3, '07:00'], [4, '08:00'], [5, '08:00'], [6, '09:00'], [7, '09:00'], [8, '10:00']]
      .forEach(([n, j]) => add(n, 'carlos', '2026-11-12', 'manha', j));
    [[9, '13:00'], [10, '13:00'], [11, '14:00'], [12, '15:00']].forEach(([n, j]) => add(n, 'carlos', '2026-11-12', 'tarde', j));
    [[13, '07:00'], [14, '07:00'], [15, '08:00'], [16, '09:00'], [17, '10:00']].forEach(([n, j]) => add(n, 'ana', '2026-11-12', 'manha', j));
    // Sexta 13/11
    add(18, 'carlos', '2026-11-13', 'manha', '07:00'); add(20, 'ana', '2026-11-13', 'manha', '08:00');
    // UBS São Bento
    add(25, 'beatriz', '2026-11-12', 'manha', '07:00'); add(26, 'beatriz', '2026-11-12', 'manha', '07:00');
    add(27, 'beatriz', '2026-11-12', 'manha', '08:00'); add(28, 'paulo', '2026-11-11', 'manha', '07:00');

    // Pacientes extras da UBS Centro para a fila de hoje e o histórico da semana
    NOMES_HOJE.forEach((nome, i) => {
      const n = 29 + i;
      const tel = n % 5 === 0 ? null : '8298' + String(2000000 + n * 41113).slice(-7);
      pacs.push({ id: `p${n}`, nome, cpf: String(30000000000 + n * 7654321).slice(0, 11), cns: String(700000000000200 + n), ubs: 'centro', tel });
      if (tel) tels[tel] = { dono: `p${n}` };
    });
    const t = (d, hm) => toMs(d, hm);
    // Hoje, terça 10/11, às 9h: parte já foi atendida, parte está na recepção, parte ainda vai chegar
    const H = '2026-11-10';
    const hoje = [
      [29, 'carlos', '07:00', { chegada: t(H, '06:52'), chamadoEm: t(H, '07:05'), atendidoEm: t(H, '07:20') }],
      [30, 'carlos', '07:00', { chegada: t(H, '07:10'), chamadoEm: t(H, '07:22'), atendidoEm: t(H, '07:41') }],
      [31, 'carlos', '07:00', {}],
      [32, 'ana', '07:00', { chegada: t(H, '07:02'), chamadoEm: t(H, '07:08'), atendidoEm: t(H, '07:25') }],
      [33, 'carlos', '08:00', { chegada: t(H, '07:58'), chamadoEm: t(H, '08:05'), atendidoEm: t(H, '08:31') }],
      [34, 'carlos', '08:00', { chegada: t(H, '08:12'), chamadoEm: t(H, '08:50') }],
      [35, 'carlos', '08:00', { chegada: t(H, '08:40') }],
      [36, 'ana', '08:00', { chegada: t(H, '08:21') }],
      [37, 'carlos', '09:00', { chegada: t(H, '08:56') }],
      [38, 'carlos', '09:00', {}],
      [39, 'carlos', '10:00', {}],
      [40, 'ana', '10:00', {}],
    ];
    hoje.forEach(([n, prof, janela, extra]) => {
      add(n, prof, H, 'manha', janela);
      Object.assign(marcs[marcs.length - 1], { status: 'confirmada', lembrado: true, criado: t('2026-11-05', '10:00') }, extra);
    });
    add(1, 'ana', H, 'tarde', '13:00'); add(2, 'carlos', H, 'tarde', '14:00');
    // Segunda 09/11, já encerrada: atendidos e faltas
    const S9 = '2026-11-09';
    [[29, 'carlos', '07:00', 1], [30, 'carlos', '07:00', 1], [33, 'carlos', '07:00', 0], [34, 'ana', '07:00', 1],
      [35, 'carlos', '08:00', 1], [36, 'carlos', '08:00', 1], [37, 'ana', '08:00', 1], [38, 'carlos', '09:00', 0],
      [39, 'carlos', '09:00', 1], [40, 'ana', '09:00', 1], [3, 'carlos', '10:00', 1], [4, 'ana', '10:00', 1],
      [5, 'carlos', '13:00', 0], [7, 'ana', '14:00', 1]].forEach(([n, prof, janela, veio]) => {
      add(n, prof, S9, janela < '12:00' ? 'manha' : 'tarde', janela);
      const m = marcs[marcs.length - 1];
      m.id = `h${n}-${S9}`;
      if (veio) Object.assign(m, { chegada: t(S9, janela), chamadoEm: t(S9, plusH(janela, 0)) + 6e5, atendidoEm: t(S9, janela) + 18e5 });
    });

    return { ubs, profs, pacs, tels, marcs, avisos: [], bloqueios: [] };
  }

  function freshState() {
    return {
      now: toMs('2026-11-10', '09:00'), ubs: 'centro', tel: MARIA_TEL, tab: 'fila', dia: '2026-11-12', feito: {},
      data: seed(), chats: {}, bot: {}, unread: {}, imp: null,
      balcao: { cpf: '', pac: null, buscou: false, tipo: 'cli', dia: '', turno: 'manha' }, lastResult: null,
    };
  }

  // ---------- Estado e persistência ----------
  function load() { try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* sem armazenamento: segue em memória */ } }
  let S = load() || freshState();
  const typing = {};
  const fresh = {};
  const seenMsgs = new Set();
  let firstRender = true;
  let lastTel = null;

  const D = () => S.data;
  const ubsById = id => D().ubs.find(u => u.id === id);
  const profById = id => D().profs.find(p => p.id === id);
  const pacById = id => D().pacs.find(p => p.id === id);
  const today = () => dOf(S.now);
  const telInfo = tel => D().tels[tel] || (D().tels[tel] = { dono: null });
  const bot = tel => S.bot[tel] || (S.bot[tel] = { step: 'novo', data: {} });
  const chatOf = tel => S.chats[tel] || (S.chats[tel] = []);

  function findPac(txt) {
    const dig = String(txt).replace(/\D/g, '');
    if (dig.length !== 11 && dig.length !== 15) return null;
    return D().pacs.find(p => p.cpf === dig || p.cns === dig) || null;
  }

  // ---------- Agenda ----------
  function isBlocked(prof, data, turno) {
    return D().bloqueios.some(b => b.data === data && (b.turno === 'dia' || b.turno === turno) &&
      (b.prof === prof.id || (b.prof === 'todos' && b.ubs === prof.ubs)));
  }
  const ocupadas = (profId, data, turno, janela) =>
    D().marcs.filter(m => m.prof === profId && m.data === data && m.turno === turno && m.janela === janela && ACTIVE.includes(m.status)).length;
  function livres(prof, data, turno) {
    if (!prof.turnos[turno] || !isUtil(data) || isBlocked(prof, data, turno)) return 0;
    return TURNOS[turno].janelas.reduce((s, j) => s + Math.max(0, prof.vagas - ocupadas(prof.id, data, turno, j)), 0);
  }
  const profsTipo = (ubs, tipo) => D().profs.filter(p => p.ubs === ubs && p.tipo === tipo);
  function diasDisponiveis(ubs, tipo) {
    const out = [];
    for (let i = 1; i <= ANTECEDENCIA; i++) {
      const d = addDays(today(), i);
      const n = profsTipo(ubs, tipo).reduce((s, p) => s + livres(p, d, 'manha') + livres(p, d, 'tarde'), 0);
      if (n > 0) out.push({ d, n });
    }
    return out;
  }
  const vagasTurno = (ubs, tipo, d, t) => profsTipo(ubs, tipo).reduce((s, p) => s + livres(p, d, t), 0);

  // Encontra a primeira janela livre. opts: pref (janela preferida), prof (profissional preferido),
  // exact (só a janela preferida), reserved (vagas já prometidas neste lote).
  function alocar(ubs, tipo, data, turno, opts) {
    const o = opts || {};
    const reserved = o.reserved || {};
    const js = TURNOS[turno].janelas;
    let order = js.slice();
    if (o.pref && js.includes(o.pref)) {
      const pi = js.indexOf(o.pref);
      order.sort((a, b) => Math.abs(js.indexOf(a) - pi) - Math.abs(js.indexOf(b) - pi) || js.indexOf(a) - js.indexOf(b));
      if (o.exact) order = [o.pref];
    }
    const ps = profsTipo(ubs, tipo).slice().sort((a, b) => (b.id === o.prof) - (a.id === o.prof));
    for (const j of order) {
      for (const p of ps) {
        if (!p.turnos[turno] || !isUtil(data) || isBlocked(p, data, turno)) continue;
        const key = `${p.id}|${data}|${turno}|${j}`;
        if (ocupadas(p.id, data, turno, j) + (reserved[key] || 0) < p.vagas) return { prof: p.id, data, turno, janela: j, key };
      }
    }
    return null;
  }

  // ---------- Conversa ----------
  function pushMsg(tel, m) {
    m.id = newId('m');
    m.at = S.now;
    chatOf(tel).push(m);
    if (tel !== S.tel) S.unread[tel] = (S.unread[tel] || 0) + 1;
  }
  function say(tel, msgs) {
    const arr = (Array.isArray(msgs) ? msgs : [msgs]).map(m => typeof m === 'string' ? { from: 'bot', text: m } : Object.assign({ from: 'bot' }, m));
    const deliver = () => { typing[tel] = false; arr.forEach(m => pushMsg(tel, m)); save(); render(); };
    if (tel === S.tel) { typing[tel] = true; render(); setTimeout(deliver, 450); } else deliver();
  }
  const menuButtons = () => [
    { label: '1 · Marcar consulta', value: '1' }, { label: '2 · Minhas consultas', value: '2' },
    { label: '3 · Cancelar consulta', value: '3' }, { label: '4 · Marcar para outra pessoa', value: '4' },
    { label: '5 · Contato da UBS', value: '5' },
  ];
  function menu(tel, pre) {
    const st = bot(tel); st.step = 'menu'; st.data = {};
    const dono = pacById(telInfo(tel).dono);
    say(tel, (pre || []).concat([{ text: `Como posso ajudar${dono ? `, *${first(dono.nome)}*` : ''}?`, buttons: menuButtons() }]));
  }
  function endWith(tel, msgs) {
    const st = bot(tel); st.step = 'menu'; st.data = {};
    const arr = (Array.isArray(msgs) ? msgs : [msgs]).map(m => typeof m === 'string' ? { text: m } : m);
    arr[arr.length - 1].buttons = [{ label: 'Voltar ao menu', value: 'menu' }];
    say(tel, arr);
  }

  function userSend(text, value, msgId) {
    const tel = S.tel;
    if (msgId) { const m = chatOf(tel).find(x => x.id === msgId); if (m) m.answered = value; }
    pushMsg(tel, { from: 'user', text });
    save(); render();
    // Mensagem de ausência (WhatsApp Business): fora do horário da equipe, avisa uma vez por dia
    const h = Number(hmOf(S.now).slice(0, 2));
    const fora = h < HORARIO.abre || h >= HORARIO.fecha || !isUtil(today());
    const info = telInfo(tel);
    if (fora && info.ausencia !== today()) {
      info.ausencia = today();
      pushMsg(tel, { from: 'bot', kind: 'away', tag: 'Mensagem de ausência', text: `A equipe da UBS atende de segunda a sexta, das ${HORARIO.abre}h às ${HORARIO.fecha}h. A marcação automática funciona 24 horas: pode continuar por aqui.` });
      save(); render();
    }
    if (String(value).startsWith('av:')) handleAviso(tel, String(value)); else handle(tel, value);
  }

  function handle(tel, raw) {
    const st = bot(tel);
    const v = String(raw).trim();
    const lv = v.toLowerCase();
    const info = telInfo(tel);
    if (!info.dono && st.step !== 'identificar') {
      st.step = 'identificar';
      return say(tel, ['Olá! Este é o canal de *marcação de consultas gerais* das UBS de Maragogi, com enfermagem ou clínico geral.',
        'Para começar, digite o seu *CPF* ou o número do seu *Cartão SUS*.']);
    }
    if (['menu', 'oi', 'olá', 'ola', '0', 'inicio', 'início'].includes(lv) && st.step !== 'identificar') return menu(tel);
    switch (st.step) {
      case 'identificar': {
        const p = findPac(v);
        if (!p) return say(tel, 'Não encontrei esse cadastro. Confira os números ou procure a sua UBS ou o seu Agente Comunitário de Saúde para se cadastrar.');
        info.dono = p.id;
        return menu(tel, [`Encontrei o seu cadastro: *${p.nome}*, ${ubsById(p.ubs).nome}.`]);
      }
      case 'menu': {
        if (v === '1') { st.data = { pac: info.dono, por: 'paciente' }; return startMarcar(tel); }
        if (v === '2') return minhas(tel);
        if (v === '3') return cancelarInicio(tel);
        if (v === '4') { st.step = 'outro_cpf'; return say(tel, 'Digite o *CPF* ou o *Cartão SUS* da pessoa para quem você quer marcar.'); }
        if (v === '5') { const u = ubsById(pacById(info.dono).ubs); return endWith(tel, `*${u.nome}*\n${u.contato}`); }
        return menu(tel, ['Não entendi. Escolha uma das opções abaixo.']);
      }
      case 'outro_cpf': {
        const p = findPac(v);
        if (!p) return say(tel, 'Não encontrei esse cadastro. Confira os números ou digite *menu* para voltar.');
        if (p.id === info.dono) { st.data = { pac: p.id, por: 'paciente' }; return startMarcar(tel); }
        st.data = { pac: p.id }; st.step = 'outro_rel';
        return say(tel, { text: `Encontrei: *${p.nome}*, ${ubsById(p.ubs).nome}.\nQual é a sua relação com essa pessoa?`,
          buttons: [{ label: 'Sou familiar ou responsável', value: 'familiar' }, { label: 'Sou Agente Comunitário (ACS)', value: 'acs' }] });
      }
      case 'outro_rel':
        if (v !== 'familiar' && v !== 'acs') return say(tel, 'Escolha uma das opções acima.');
        st.data.por = v; return startMarcar(tel);
      case 'tipo':
        if (!TIPOS[v]) return say(tel, 'Escolha o tipo de atendimento nas opções acima.');
        st.data.tipo = v; return askDia(tel);
      case 'dia':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return say(tel, 'Escolha um dos dias nas opções acima.');
        st.data.dia = v; return askTurno(tel);
      case 'turno':
        if (!TURNOS[v]) return say(tel, 'Escolha o turno nas opções acima.');
        st.data.turno = v; return resumo(tel);
      case 'confirmar':
        if (v === 'sim') return confirmar(tel);
        if (v === 'outro') return askDia(tel);
        return menu(tel);
      case 'cancelar_escolha': {
        const m = D().marcs.find(x => x.id === v);
        if (!m) return say(tel, 'Escolha uma das consultas acima.');
        st.data.cancel = v; st.step = 'cancelar_conf';
        return say(tel, { text: `Cancelar a consulta de *${pacById(m.pac).nome}* em *${fmtD(m.data)}*, ${turnoTxt(m.turno)}?`,
          buttons: [{ label: 'Sim, cancelar', value: 'sim' }, { label: 'Não, voltar', value: 'nao' }] });
      }
      case 'cancelar_conf': {
        if (v !== 'sim') return menu(tel);
        const m = D().marcs.find(x => x.id === st.data.cancel);
        if (m && (ACTIVE.includes(m.status) || m.status === 'aguardando')) {
          m.status = 'cancelada'; m.canceladaEm = S.now;
          toast('Consulta cancelada pelo paciente', `${pacById(m.pac).nome} · ${fmtD(m.data)} · vaga liberada`);
        }
        return endWith(tel, 'Pronto. A consulta foi cancelada e a vaga voltou para a agenda.');
      }
      default:
        return menu(tel);
    }
  }

  const consultasDoTel = tel => {
    const dono = telInfo(tel).dono;
    return D().marcs.filter(m => (m.por.tel === tel || m.pac === dono) && (ACTIVE.includes(m.status) || m.status === 'aguardando') && m.data >= today())
      .sort((a, b) => (a.data + a.janela).localeCompare(b.data + b.janela));
  };
  function minhas(tel) {
    const ms = consultasDoTel(tel);
    if (!ms.length) return endWith(tel, 'Você não tem consultas marcadas.');
    const linhas = ms.map(m => `• *${firstLast(pacById(m.pac).nome)}*: ${fmtD(m.data)}, ${turnoTxt(m.turno)}, chegada das ${janelaTxt(m.janela)} (${m.status === 'confirmada' ? 'confirmada' : m.status === 'aguardando' ? 'aguardando nova data' : 'marcada'})`);
    endWith(tel, `Consultas marcadas por este número:\n${linhas.join('\n')}`);
  }
  function cancelarInicio(tel) {
    const ms = consultasDoTel(tel);
    if (!ms.length) return endWith(tel, 'Não há consultas para cancelar.');
    const st = bot(tel); st.step = 'cancelar_escolha';
    say(tel, { text: 'Qual consulta você quer cancelar?',
      buttons: ms.map(m => ({ label: `${first(pacById(m.pac).nome)} · ${fmtD(m.data)} · ${turnoTxt(m.turno)}`, value: m.id })).concat([{ label: 'Voltar ao menu', value: 'menu' }]) });
  }

  function startMarcar(tel) {
    const st = bot(tel);
    const p = pacById(st.data.pac);
    const ativa = D().marcs.find(m => m.pac === p.id && (ACTIVE.includes(m.status) || m.status === 'aguardando') && m.data >= today());
    if (ativa) {
      return endWith(tel, `*${p.nome}* já tem uma consulta marcada: *${fmtD(ativa.data)}*, ${turnoTxt(ativa.turno)}, chegada das ${janelaTxt(ativa.janela)}.\nCada paciente pode ter uma consulta geral ativa por vez.`);
    }
    st.step = 'tipo';
    say(tel, { text: st.data.por === 'paciente' ? 'Qual atendimento você precisa?' : `Qual atendimento para *${first(p.nome)}*?`,
      buttons: [{ label: 'Enfermagem', value: 'enf' }, { label: 'Clínico geral', value: 'cli' }] });
  }
  function askDia(tel) {
    const st = bot(tel);
    const p = pacById(st.data.pac);
    const ds = diasDisponiveis(p.ubs, st.data.tipo).slice(0, 5);
    if (!ds.length) return endWith(tel, 'Não há vagas nos próximos 7 dias. Tente de novo amanhã ou procure a sua UBS.');
    st.step = 'dia';
    say(tel, { text: `Dias com vaga para *${TIPOS[st.data.tipo]}* na ${ubsById(p.ubs).nome}:`, buttons: ds.map(x => ({ label: cap(fmtD(x.d)), value: x.d })) });
  }
  function askTurno(tel) {
    const st = bot(tel);
    const p = pacById(st.data.pac);
    const opts = Object.keys(TURNOS).map(t => ({ t, n: vagasTurno(p.ubs, st.data.tipo, st.data.dia, t) })).filter(o => o.n > 0);
    if (!opts.length) return askDia(tel);
    st.step = 'turno';
    say(tel, { text: `Qual turno em *${fmtD(st.data.dia)}*?`, buttons: opts.map(o => ({ label: `${TURNOS[o.t].label} · ${o.n} ${o.n === 1 ? 'vaga' : 'vagas'}`, value: o.t })) });
  }
  function resumo(tel) {
    const st = bot(tel); const x = st.data;
    const p = pacById(x.pac);
    const a = alocar(p.ubs, x.tipo, x.dia, x.turno);
    if (!a) return askTurno(tel);
    x.prof = a.prof; x.janela = a.janela; st.step = 'confirmar';
    say(tel, { text: `Confira a marcação:\n*${p.nome}*\n${TIPOS[x.tipo]} com ${profById(a.prof).nome}\n*${cap(fmtD(x.dia))}*, ${turnoTxt(x.turno)}\nChegada: *das ${janelaTxt(a.janela)}*\n${ubsById(p.ubs).nome}`,
      buttons: [{ label: 'Confirmar', value: 'sim' }, { label: 'Escolher outro dia', value: 'outro' }, { label: 'Voltar ao menu', value: 'menu' }] });
  }
  function confirmar(tel) {
    const st = bot(tel); const x = st.data;
    const p = pacById(x.pac);
    const prof = profById(x.prof);
    if (isBlocked(prof, x.dia, x.turno) || ocupadas(x.prof, x.dia, x.turno, x.janela) >= prof.vagas) {
      const a = alocar(p.ubs, x.tipo, x.dia, x.turno);
      if (!a) { say(tel, 'Essa vaga acabou de ser ocupada. Vamos escolher outro turno.'); return askTurno(tel); }
      x.prof = a.prof; x.janela = a.janela;
    }
    const m = criarMarcacao(p, x.prof, x.dia, x.turno, x.janela, { tipo: x.por, tel }, 'WhatsApp');
    feito(x.por === 'familiar' ? 'familiar' : 'marcou');
    toast('Nova marcação pelo WhatsApp', `${p.nome} · ${fmtD(m.data)} · ${turnoTxt(m.turno)}${x.por !== 'paciente' ? ` · marcada por ${POR[x.por].toLowerCase()}` : ''}`);
    endWith(tel, `✅ *Consulta marcada!*\n${TIPOS[m.tipo]} com ${profById(m.prof).nome}\n*${cap(fmtD(m.data))}*, chegada das *${janelaTxt(m.janela)}*\n${ubsById(m.ubs).nome}\n\nNa véspera, às 18h, enviaremos um lembrete para você confirmar a presença. Se houver algum imprevisto, avisamos por aqui.`);
  }
  function criarMarcacao(p, profId, data, turno, janela, por, canal) {
    const pr = profById(profId);
    const m = { id: newId('c'), pac: p.id, ubs: p.ubs, prof: profId, tipo: pr.tipo, data, turno, janela, status: 'marcada', por, criado: S.now, lembrado: false, canal };
    D().marcs.push(m);
    fresh[m.id] = Date.now();
    if (p.ubs === S.ubs) S.dia = data;
    return m;
  }

  // ---------- Avisos ----------
  function enviarAviso(m, kind, tipo, text, buttons) {
    const tel = m.por.tel || pacById(m.pac).tel;
    const av = { id: newId('a'), quando: S.now, tipo, marc: m.id, pac: m.pac, ubs: m.ubs, tel: tel || null,
      resposta: tel ? 'sem resposta' : 'avisar por telefone ou ACS' };
    D().avisos.push(av);
    if (tel) {
      pushMsg(tel, { from: 'bot', kind, tag: kind === 'alert' ? 'Aviso da UBS' : 'Lembrete', text,
        buttons: buttons.map(b => ({ label: b.label, value: `av:${av.id}:${b.value}` })) });
    }
    return av;
  }
  function handleAviso(tel, value) {
    const parts = value.split(':');
    const id = parts[1]; const acao = parts[2]; const extra = parts.slice(3).join(':');
    const av = D().avisos.find(a => a.id === id);
    const m = av && D().marcs.find(x => x.id === av.marc);
    if (!av || !m) return say(tel, 'Não encontrei essa consulta.');
    const p = pacById(m.pac);
    av.respondidoEm = S.now;
    if (acao === 'confirmo') {
      if (!ACTIVE.includes(m.status)) return endWith(tel, 'Essa consulta não está mais ativa.');
      m.status = 'confirmada'; av.resposta = 'confirmou'; feito('lembrete');
      toast('Presença confirmada', `${p.nome} · ${fmtD(m.data)}`);
      return endWith(tel, `Presença confirmada para *${fmtD(m.data)}*, chegada das *${janelaTxt(m.janela)}*. Até lá!`);
    }
    if (acao === 'naovou' || acao === 'naoposso') {
      if (ACTIVE.includes(m.status)) { m.status = 'cancelada'; m.canceladaEm = S.now; }
      av.resposta = 'não vai'; feito('lembrete');
      toast('Vaga liberada', `${p.nome} não vai · ${fmtD(m.data)}, ${turnoTxt(m.turno)}`);
      return endWith(tel, 'Tudo bem. A consulta foi cancelada e a vaga voltou para a agenda. Quando precisar, marque de novo por aqui.');
    }
    if (acao === 'ok') { av.resposta = 'ciente'; return endWith(tel, 'Combinado. Obrigado por avisar que recebeu.'); }
    if (acao === 'slot') {
      const [profId, data, turno, janela] = extra.split('|');
      const pr = profById(profId);
      if (m.status !== 'aguardando') return endWith(tel, 'Essa mensagem já foi respondida.');
      if (!pr || isBlocked(pr, data, turno) || ocupadas(profId, data, turno, janela) >= pr.vagas) {
        return say(tel, { text: 'Essa vaga acabou de ser ocupada. Escolha outra:', buttons: opcoesBotoes(m, av.id) });
      }
      Object.assign(m, { prof: profId, data, turno, janela, status: 'confirmada', lembrado: true, remarcada: true });
      fresh[m.id] = Date.now();
      av.resposta = 'escolheu nova vaga';
      toast('Nova vaga escolhida', `${p.nome} · ${fmtD(data)}, ${turnoTxt(turno)}`);
      return endWith(tel, `✅ Remarcada: *${cap(fmtD(data))}*, ${turnoTxt(turno)}, chegada das *${janelaTxt(janela)}*, com ${pr.nome}.`);
    }
    if (acao === 'nenhum') {
      if (m.status === 'aguardando') m.status = 'cancelada';
      av.resposta = 'nenhuma vaga serviu';
      return endWith(tel, 'Entendido. A consulta foi cancelada. Quando quiser, marque outra pelo menu.');
    }
    if (acao === 'nova') {
      av.resposta = 'vai remarcar';
      const st = bot(tel); st.data = { pac: m.pac, por: m.por.tipo === 'gestor' ? 'paciente' : m.por.tipo };
      return startMarcar(tel);
    }
    return menu(tel);
  }
  function opcoes(m) {
    const out = [];
    for (let i = 1; i <= ANTECEDENCIA && out.length < 3; i++) {
      const d = addDays(today(), i);
      for (const t of Object.keys(TURNOS)) {
        if (out.length >= 3) break;
        const a = alocar(m.ubs, m.tipo, d, t, { pref: m.janela, prof: m.prof });
        if (a) out.push(a);
      }
    }
    return out;
  }
  const opcoesBotoes = (m, avId) => opcoes(m).map(o => ({ label: `${cap(fmtD(o.data))} · ${turnoTxt(o.turno)} · ${fmtH(o.janela)}`, value: `av:${avId}:slot:${o.prof}|${o.data}|${o.turno}|${o.janela}` }))
    .concat([{ label: 'Nenhuma serve', value: `av:${avId}:nenhum` }]);

  // Lembretes da véspera às 18h
  function rodarLembretes(prev, next) {
    let n = 0;
    for (let d = dOf(prev); d <= dOf(next); d = addDays(d, 1)) {
      const t = toMs(d, '18:00');
      if (!(prev < t && t <= next)) continue;
      const alvo = addDays(d, 1);
      D().marcs.filter(m => m.data === alvo && m.status === 'marcada' && !m.lembrado).forEach(m => {
        m.lembrado = true; m.lembreteEm = t;
        const p = pacById(m.pac); const pr = profById(m.prof);
        enviarAviso(m, 'reminder', 'Lembrete da véspera',
          `*${p.nome}* tem consulta amanhã, *${fmtD(m.data)}*:\n${TIPOS[m.tipo]} com ${pr.nome}\nChegada das *${janelaTxt(m.janela)}* · ${ubsById(m.ubs).nome}\n\nVocê vai?`,
          [{ label: 'Confirmo', value: 'confirmo' }, { label: 'Não vou', value: 'naovou' }]);
        n++;
      });
    }
    if (n) toast('Lembretes da véspera enviados', `${n} ${n === 1 ? 'paciente' : 'pacientes'} com consulta amanhã`);
  }
  function avancar(kind) {
    const prev = S.now; const d = today();
    let next;
    if (kind === '1h') next = prev + 36e5;
    else if (kind === '18h') { const t = toMs(d, '18:00'); next = prev < t ? t : toMs(addDays(d, 1), '18:00'); }
    else next = toMs(addDays(d, 1), '07:00');
    S.now = next;
    rodarLembretes(prev, next);
    save(); render();
  }

  // ---------- Imprevistos ----------
  function impDefault(hoje) {
    const p = D().profs.find(x => x.ubs === S.ubs);
    const data = hoje ? today() : S.dia > today() ? S.dia : nextUtil(today());
    const turno = hoje && Number(hmOf(S.now).slice(0, 2)) >= 12 ? 'tarde' : 'manha';
    return { ubs: S.ubs, tipo: 'ausencia', prof: p ? p.id : '', data, turno, motivo: '', acao: 'mover',
      destData: nextUtil(data), destTurno: 'mesmo', inicio: '09:00', over: {}, step: 1, adjust: false };
  }
  const TIPO_IMP = { ausencia: 'Ausência do profissional', fechada: 'UBS fechada', atraso: 'Atraso ou mudança de horário' };
  // Texto do aviso que o paciente recebe (o mesmo usado na prévia e no envio)
  function textoAviso(imp, r) {
    const prof = profById(imp.prof); const ubs = ubsById(imp.ubs); const p = pacById(r.m.pac);
    const quando = `${fmtD(imp.data)}${imp.turno === 'dia' ? '' : ` (${turnoTxt(imp.turno)})`}`;
    const quem = imp.tipo === 'fechada' ? `A *${ubs.nome}* estará fechada` : `*${prof.nome}* não poderá atender`;
    const motivo = imp.motivo ? `\nMotivo: ${imp.motivo}.` : '';
    if (imp.tipo === 'atraso') {
      const j = atrasoJanela(r.m, imp.inicio);
      return { text: `*${prof.nome}* vai começar o atendimento de *${quando}* às *${fmtH(imp.inicio)}*.${motivo}\nNova janela de chegada de *${first(p.nome)}*: *das ${janelaTxt(j)}*.`, buttons: [{ label: 'Ok, entendi', value: 'ok' }] };
    }
    if (r.acao === 'mover' && r.dest) {
      return { text: `${quem} em *${quando}*.${motivo}\nA consulta de *${first(p.nome)}* foi *remarcada para ${fmtD(r.dest.data)}*, ${turnoTxt(r.dest.turno)}, com chegada das *${janelaTxt(r.dest.janela)}*.`,
        buttons: [{ label: 'Confirmo', value: 'confirmo' }, { label: 'Não posso ir', value: 'naoposso' }] };
    }
    if (r.acao === 'cancelar') {
      return { text: `${quem} em *${quando}*.${motivo}\nA consulta de *${first(p.nome)}* foi *cancelada*. Pedimos desculpas pelo transtorno.`, buttons: [{ label: 'Marcar nova consulta', value: 'nova' }] };
    }
    return { text: `${quem} em *${quando}*.${motivo}\nEscolha uma nova vaga para *${first(p.nome)}*:`, buttons: null };
  }
  function afetados(imp) {
    return D().marcs.filter(m => m.ubs === imp.ubs && m.data === imp.data && ACTIVE.includes(m.status) && !m.chamadoEm && !m.atendidoEm && !(m.data === today() && !m.chegada && fimJanela(m) <= S.now) &&
      (imp.turno === 'dia' || m.turno === imp.turno) && (imp.tipo === 'fechada' || m.prof === imp.prof))
      .sort((a, b) => (a.turno === b.turno ? 0 : a.turno === 'manha' ? -1 : 1) || a.janela.localeCompare(b.janela) || a.criado - b.criado);
  }
  function preview(imp) {
    const rows = afetados(imp).map(m => ({ m, acao: imp.over[m.id] || imp.acao, dest: null }));
    if (imp.tipo === 'atraso') return rows;
    const reserved = {};
    const movers = rows.filter(r => r.acao === 'mover');
    ['exact', 'near'].forEach(pass => movers.forEach(r => {
      if (r.dest) return;
      const t = imp.destTurno === 'mesmo' ? r.m.turno : imp.destTurno;
      if (imp.destData === imp.data && (imp.turno === 'dia' || imp.turno === t)) return;
      const a = alocar(r.m.ubs, r.m.tipo, imp.destData, t, { pref: r.m.janela, prof: r.m.prof, exact: pass === 'exact', reserved });
      if (a) { r.dest = a; reserved[a.key] = (reserved[a.key] || 0) + 1; }
    }));
    return rows;
  }
  function atrasoJanela(m, inicio) {
    const js = TURNOS[m.turno].janelas;
    const delta = Number(inicio.slice(0, 2)) - Number(js[0].slice(0, 2));
    return plusH(m.janela, Math.max(0, delta));
  }
  function enviarImprevisto() {
    const imp = S.imp;
    const rows = preview(imp);
    const prof = profById(imp.prof);
    const ubs = ubsById(imp.ubs);
    const quando = `${fmtD(imp.data)}${imp.turno === 'dia' ? '' : ` (${turnoTxt(imp.turno)})`}`;
    const tipoLabel = TIPO_IMP[imp.tipo];
    if (imp.tipo !== 'atraso') {
      D().bloqueios.push({ id: newId('b'), ubs: imp.ubs, prof: imp.tipo === 'fechada' ? 'todos' : imp.prof, data: imp.data,
        turno: imp.turno, tipo: imp.tipo, motivo: imp.motivo, criado: S.now });
    }
    let enviados = 0, manuais = 0;
    rows.forEach(r => {
      const m = r.m; const p = pacById(m.pac);
      if (r.acao === 'manter') return;
      const { text, buttons } = textoAviso(imp, r);
      if (imp.tipo === 'atraso') {
        m.janela = atrasoJanela(m, imp.inicio); m.atraso = imp.inicio;
      } else if (r.acao === 'mover' && r.dest) {
        Object.assign(m, { data: r.dest.data, turno: r.dest.turno, janela: r.dest.janela, prof: r.dest.prof, status: 'marcada', lembrado: false, remarcada: true });
        fresh[m.id] = Date.now();
      } else if (r.acao === 'cancelar') {
        m.status = 'cancelada'; m.canceladaEm = S.now;
      } else {
        m.status = 'aguardando';
      }
      const av = enviarAviso(m, 'alert', tipoLabel, text, buttons || []);
      if (!buttons && av.tel) {
        const msg = chatOf(av.tel)[chatOf(av.tel).length - 1];
        msg.buttons = opcoesBotoes(m, av.id);
      }
      if (av.tel) enviados++; else manuais++;
    });
    S.lastResult = { enviados, manuais, quando: S.now, tipo: tipoLabel, alvo: imp.tipo === 'fechada' ? ubs.nome : prof.nome, data: quando,
      destData: imp.tipo !== 'atraso' && imp.acao === 'mover' ? imp.destData : null };
    toast('Avisos enviados', `${enviados} pelo WhatsApp${manuais ? ` · ${manuais} para avisar por telefone ou ACS` : ''}`);
    feito('imprevisto');
    S.imp = Object.assign(impDefault(), { step: 'ok' });
    save(); render();
  }

  // ---------- Toasts ----------
  let lastToast = null;
  function toast(title, body, remote) {
    if (!remote) { S.toast = { id: newId('t'), title, body }; lastToast = S.toast.id; }
    const box = document.getElementById('toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<strong>${esc(title)}</strong>${esc(body)}`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4800);
  }

  // ---------- Renderização ----------
  const $ = id => document.getElementById(id);
  function feito(k) { S.feito = S.feito || {}; S.feito[k] = true; }
  const ROTEIRO = {
    paciente: [
      ['marcou', 'Marcar uma consulta para a Maria', 'Mande Oi e use o CPF 111.222.333-44'],
      ['familiar', 'Marcar para a mãe dela, Josefa', 'Josefa não tem celular · CPF 555.666.777-88'],
      ['lembrete', 'Responder o lembrete da véspera', 'Avance o relógio até as 18h e toque em Confirmo ou Não vou'],
    ],
    gestor: [
      ['chegada', 'Registrar a chegada de um paciente', 'Fila de hoje → botão Chegou', 'fila'],
      ['concluir', 'Concluir um atendimento', 'O próximo da fila é chamado sozinho e recebe o aviso', 'fila'],
      ['imprevisto', 'Registrar um imprevisto de hoje', 'Os pacientes afetados recebem a mensagem de uma vez', 'imp'],
      ['balcao', 'Marcar uma consulta no balcão', 'Para quem não usa WhatsApp', 'balcao'],
    ],
  };
  // Em telas estreitas o roteiro começa fechado para não cobrir a conversa
  if ($('roteiro') && !$('roteiro').classList.contains('in-side') && innerWidth < 860) $('roteiro').open = false;
  function renderRoteiro() {
    const el = $('roteiro'); const lista = ROTEIRO[el.dataset.roteiro] || [];
    const ok = S.feito || {};
    const n = lista.filter(t => ok[t[0]]).length;
    el.querySelector('[data-roteiro-n]').textContent = `${n} de ${lista.length}`;
    el.querySelector('[data-roteiro-list]').innerHTML = lista.map(([k, tit, sub, tab]) =>
      `<li class="${ok[k] ? 'ok' : ''}"><span class="ck" aria-hidden="true"></span><div>${tab ? `<button type="button" class="linkbtn" ${tab === 'imp' ? 'data-action="imp-abrir"' : `data-tab="${tab}"`}>${tit}</button>` : `<strong>${tit}</strong>`}<span>${sub}</span></div><span class="sr-only">${ok[k] ? 'feito' : 'a fazer'}</span></li>`).join('');
  }

  function render() {
    if (!S.imp || S.imp.ubs !== S.ubs) S.imp = impDefault();
    if ($('ubsSelect')) $('ubsSelect').innerHTML = D().ubs.map(u => `<option value="${u.id}" ${u.id === S.ubs ? 'selected' : ''}>${esc(u.nome)}</option>`).join('');
    document.querySelectorAll('[data-clock-label]').forEach(el => { el.textContent = `${cap(fmtD(today()))} · ${hmOf(S.now)}`; });
    if ($('clockLabel')) $('clockLabel').textContent = `${cap(fmtD(today()))} · ${hmOf(S.now)}`;
    if ($('phoneTime')) $('phoneTime').textContent = hmOf(S.now);
    if ($('contacts')) renderContacts();
    if ($('chat')) renderChat();
    if ($('panelBody')) renderPanel();
    if ($('roteiro')) renderRoteiro();
    if ($('impModal')) {
      $('impModal').hidden = !S.impModal;
      if (S.impModal) $('impBody').innerHTML = imprevistoHtml();
    }
    if ($('bizStatus')) renderBizStatus();
  }

  // Perfil comercial: aberto ou fechado no horário simulado
  function renderBizStatus() {
    const h = Number(hmOf(S.now).slice(0, 2));
    const aberto = isUtil(today()) && h >= HORARIO.abre && h < HORARIO.fecha;
    $('bizStatus').innerHTML = aberto
      ? `<span class="biz-open">Aberto agora</span> · fecha às ${HORARIO.fecha}h`
      : `<span class="biz-closed">Fechado agora</span> · a marcação automática continua funcionando`;
  }

  // Sincroniza as abas: o que acontece no WhatsApp aparece no painel, e vice-versa
  window.addEventListener('storage', e => {
    if (e.key !== STORE_KEY || !e.newValue) return;
    let next;
    try { next = JSON.parse(e.newValue); } catch (err) { return; }
    const known = new Set(D().marcs.map(m => m.id));
    S = next;
    D().marcs.forEach(m => { if (!known.has(m.id)) fresh[m.id] = Date.now(); });
    if (S.toast && S.toast.id !== lastToast) { lastToast = S.toast.id; toast(S.toast.title, S.toast.body, true); }
    render();
  });

  function contactLabel(tel) {
    const i = telInfo(tel);
    const dono = pacById(i.dono);
    return i.label || (dono ? firstLast(dono.nome) : fmtTel(tel));
  }
  function renderContacts() {
    // Chips: Maria, o número aberto e até 2 conversas com mensagens novas; o resto fica no seletor.
    const tels = [MARIA_TEL];
    if (!tels.includes(S.tel)) tels.push(S.tel);
    Object.keys(S.unread).filter(t => S.unread[t] > 0 && !tels.includes(t)).sort((a, b) => S.unread[b] - S.unread[a]).slice(0, 2).forEach(t => tels.push(t));
    const chips = tels.map(t => `<button type="button" class="contact ${t === S.tel ? 'active' : ''}" data-contact="${t}">${esc(contactLabel(t))}${S.unread[t] ? `<span class="badge">${S.unread[t]}</span>` : ''}</button>`).join('');
    const pendentes = Object.keys(S.unread).filter(t => S.unread[t] > 0 && !tels.includes(t)).length;
    const outros = D().pacs.filter(p => p.tel && !tels.includes(p.tel))
      .sort((a, b) => (S.unread[b.tel] || 0) - (S.unread[a.tel] || 0))
      .map(p => `<option value="${p.tel}">${esc(firstLast(p.nome))} · ${fmtTel(p.tel)}${S.unread[p.tel] ? ` · ${S.unread[p.tel]} nova(s)` : ''}</option>`).join('');
    $('contacts').innerHTML = chips + `<select data-contact-select aria-label="Abrir outro número"><option value="">${pendentes ? `+${pendentes} com mensagens novas…` : 'Outro número…'}</option>${outros}</select>`;
  }

  function renderChat() {
    const tel = S.tel;
    const msgs = chatOf(tel);
    const box = $('chat');
    if (tel !== lastTel) { firstRender = true; lastTel = tel; }
    const lastPlain = [...msgs].reverse().find(m => m.from === 'bot' && m.buttons && m.buttons.length && !String(m.buttons[0].value).startsWith('av:'));
    const biz = !!document.body.dataset.biz;
    let html = biz ? `<div class="sys-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Esta é uma conta comercial verificada. As mensagens são protegidas com criptografia de ponta a ponta.</div>` : '';
    if (!msgs.length) {
      html += biz
        ? `<div class="chat-empty biz"><img src="marca/icone-azul.svg" alt="" width="64" height="64"><strong>MinhaVez · UBS de Maragogi</strong><span>Marque sua consulta geral sem pegar fila. Toque em <strong>Oi</strong> para começar.</span><button type="button" class="btn small primary" data-action="say-oi">Oi</button></div>`
        : `<div class="chat-empty">Nenhuma conversa ainda.<br>Toque em <strong>Oi</strong> para falar com o canal de marcação.<br><button type="button" class="btn small primary" data-action="say-oi">Oi</button></div>`;
    } else {
      let lastDay = '';
      msgs.forEach(m => {
        const day = dOf(m.at);
        if (day !== lastDay) { html += `<div class="day-sep">${esc(cap(fmtD(day)))}</div>`; lastDay = day; }
        const cls = ['msg', m.from === 'bot' ? 'in' : 'out', m.kind || '', firstRender || seenMsgs.has(m.id) ? '' : 'anim'].join(' ');
        seenMsgs.add(m.id);
        let btns = '';
        if (m.buttons && m.buttons.length) {
          const isAv = String(m.buttons[0].value).startsWith('av:');
          const live = m.answered == null && (isAv || (lastPlain && m.id === lastPlain.id));
          if (biz && m.buttons.length > 3) {
            // Na API do WhatsApp Business, mais de 3 opções viram uma mensagem de lista
            const chosen = m.buttons.find(b => b.value === m.answered);
            btns = `<div class="quick list-msg"><button type="button" data-open-list="${m.id}" ${live ? '' : 'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>${chosen ? esc(chosen.label.replace(/^\d+ · /, '')) : 'Ver opções'}</button></div>`;
          } else {
            btns = `<div class="quick">${m.buttons.map(b => `<button type="button" data-btn data-msg="${m.id}" data-value="${esc(b.value)}" data-label="${esc(b.label)}" ${live ? '' : 'disabled'} class="${m.answered === b.value ? 'chosen' : ''}">${esc(biz ? b.label.replace(/^\d+ · /, '') : b.label)}</button>`).join('')}</div>`;
          }
        }
        const foot = biz && (m.kind === 'reminder' || m.kind === 'alert') ? '<span class="tpl">Mensagem automática · modelo aprovado pela Meta</span>' : '';
        const check = biz && m.from === 'user' ? '<svg class="ticks" viewBox="0 0 18 12" aria-label="lida"><path d="M1 6.5l3.2 3.2L10.5 2.5M7 9.2l.5.5L16.5 2.5"/></svg>' : '';
        html += `<div class="${cls}"><div class="bubble">${m.tag ? `<span class="tag">${esc(m.tag)}</span><br>` : ''}${fmtTxt(m.text)}${foot}<span class="meta">${hmOf(m.at)}${check}</span></div>${btns}</div>`;
      });
    }
    if (typing[tel]) html += '<div class="typing" aria-label="digitando"><i></i><i></i><i></i></div>';
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
    firstRender = false;
    const i = telInfo(tel);
    const dono = pacById(i.dono);
    if ($('chatWho')) $('chatWho').textContent = tel === MARIA_TEL ? 'Celular da Maria José' : `Celular de ${dono ? firstLast(dono.nome) : fmtTel(tel)}`;
    if (!$('phoneCaption')) return;
    $('phoneCaption').innerHTML = tel === MARIA_TEL
      ? `Celular simulado da Maria · ${fmtTel(tel)}<br>CPFs fictícios para testar: Maria ${fmtCpf('11122233344')} · a mãe, Josefa, ${fmtCpf('55566677788')}`
      : `Celular simulado · ${fmtTel(tel)}${dono ? ` · ${esc(dono.nome)}` : ''}`;
  }

  function renderPanel() {
    if ($('tabs') && !$('tabs').querySelector(`[data-tab="${S.tab}"]`)) S.tab = 'fila';
    const ubs = ubsById(S.ubs);
    const T = {
      fila: ['Fila de hoje', 'Quem está no consultório, quem espera e quem ainda vai chegar'],
      numeros: ['Números da semana', 'Marcações, confirmações, faltas e vagas livres de segunda a sexta'],
      inicio: ['Visão geral', `${cap(fmtD(today()))}, ${hmOf(S.now)} · próximos ${ANTECEDENCIA} dias de agenda`],
      agenda: ['Agenda', 'Consultas por profissional, turno e janela de chegada'],
      imprevisto: ['Imprevistos', 'Registre uma vez e avise todos os pacientes afetados'],
      imprevistos: ['Imprevistos', 'O que foi registrado e quantos pacientes foram avisados'],
      balcao: ['Marcar no balcão', 'Para quem não usa WhatsApp'],
      vagas: ['Vagas e equipe', 'Profissionais, turnos e vagas por janela'],
      historico: ['Histórico de avisos', 'Tudo o que foi enviado e o que cada paciente respondeu'],
    }[S.tab] || ['Visão geral', ''];
    $('panelTitle').textContent = T[0];
    $('panelSub').textContent = T[1];
    if ($('sideUbs')) $('sideUbs').textContent = ubs.nome;
    if ($('userUbs')) $('userUbs').textContent = ubs.nome;
    const pend = D().avisos.filter(a => a.ubs === S.ubs && a.resposta === 'sem resposta').length;
    if ($('navCount')) { $('navCount').hidden = !pend; $('navCount').textContent = pend; }
    if ($('filaCount')) { const n = filaHoje().recepcao.length; $('filaCount').hidden = !n; $('filaCount').textContent = n; }
    document.querySelectorAll('#tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === S.tab)));
    const body = $('panelBody');
    if (S.tab === 'fila') body.innerHTML = filaHtml();
    else if (S.tab === 'numeros') body.innerHTML = numerosHtml();
    else if (S.tab === 'inicio') body.innerHTML = inicioHtml();
    else if (S.tab === 'agenda') body.innerHTML = agendaHtml();
    else if (S.tab === 'imprevisto') body.innerHTML = imprevistoHtml();
    else if (S.tab === 'imprevistos') body.innerHTML = impHistoricoHtml();
    else if (S.tab === 'balcao') body.innerHTML = balcaoHtml();
    else if (S.tab === 'vagas') body.innerHTML = vagasHtml();
    else body.innerHTML = historicoHtml();
  }

  // ---------- Fila de hoje ----------
  const fimJanela = m => toMs(m.data, plusH(m.janela, 1));
  function filaHoje(dia) {
    const d = dia || today();
    const ms = D().marcs.filter(m => m.ubs === S.ubs && m.data === d && ACTIVE.includes(m.status))
      .sort((a, b) => (a.janela + (a.chegada || 0)).localeCompare(b.janela + (b.chegada || 0)) || (a.chegada || 0) - (b.chegada || 0));
    const r = { atendidos: [], atendimento: [], recepcao: [], faltas: [], previstos: [] };
    ms.forEach(m => {
      if (m.atendidoEm) r.atendidos.push(m);
      else if (m.chamadoEm) r.atendimento.push(m);
      else if (m.chegada) r.recepcao.push(m);
      else if (d < today() || S.now >= fimJanela(m)) r.faltas.push(m);
      else r.previstos.push(m);
    });
    r.recepcao.sort((a, b) => a.janela.localeCompare(b.janela) || a.chegada - b.chegada);
    return r;
  }
  const minDesde = ms => Math.max(0, Math.round((S.now - ms) / 6e4));
  const telDe = m => m.por.tel || pacById(m.pac).tel;
  function posNaFila(m) {
    const f = filaHoje(m.data).recepcao.filter(x => x.prof === m.prof);
    return f.findIndex(x => x.id === m.id) + 1;
  }
  function filaHtml() {
    // Uma lista só, em ordem: quem está no consultório, quem espera (por ordem de chegada) e quem ainda vem.
    const f = filaHoje();
    const profs = D().profs.filter(p => p.ubs === S.ubs);
    const sel = profs.some(p => p.id === S.filaProf) ? S.filaProf : '';
    const doProf = m => !sel || m.prof === sel;
    const atend = f.atendimento.filter(doProf);
    const ordemProf = id => profs.findIndex(p => p.id === id);
    const espera = f.recepcao.filter(doProf).sort((a, b) => ordemProf(a.prof) - ordemProf(b.prof));
    const vem = f.previstos.filter(doProf);
    const ocupado = new Set(f.atendimento.map(m => m.prof));
    const pos = {};
    const nomeProf = m => esc(profById(m.prof).nome);
    const auto = S.filaAuto !== false;
    let h = `<div class="agenda-head fila-head">
      <button type="button" class="btn imp-btn" data-action="imp-abrir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>Registrar imprevisto de hoje</button>
      <label class="switch"><input type="checkbox" data-fila-auto ${auto ? 'checked' : ''}><span class="sw" aria-hidden="true"></span>Chamada automática</label>
      <select data-fila-prof aria-label="Filtrar por profissional"><option value="">Todos os profissionais</option>${profs.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
      <div class="stats"><span class="stat"><b>${espera.length}</b>esperando</span><span class="stat"><b>${atend.length}</b>em atendimento</span><span class="stat"><b>${vem.length}</b>ainda vêm</span></div></div>`;
    if (!atend.length && !espera.length && !vem.length) return h + '<p class="muted">Ninguém na fila agora.</p>';
    h += '<div class="box"><table class="fila-tab"><thead><tr><th>Nº</th><th>Paciente</th><th>Profissional</th><th>Situação</th><th></th></tr></thead><tbody>';
    atend.forEach(m => {
      h += `<tr class="em-atend"><td></td><td><strong>${esc(firstLast(pacById(m.pac).nome))}</strong></td><td>${nomeProf(m)}</td><td><span class="pill info">No consultório desde ${hmOf(m.chamadoEm)}</span></td><td class="acao"><button type="button" class="btn small" data-fila="fim:${m.id}">Concluir</button></td></tr>`;
    });
    espera.forEach(m => {
      pos[m.prof] = (pos[m.prof] || 0) + 1;
      const n = pos[m.prof];
      const min = minDesde(m.chegada);
      const btn = n === 1 && !auto ? `<button type="button" class="btn small primary" data-fila="chamar:${m.id}" ${ocupado.has(m.prof) ? 'disabled title="Conclua o atendimento atual primeiro"' : ''}>Chamar</button>` : '';
      h += `<tr><td class="num">${n}º</td><td><strong>${esc(firstLast(pacById(m.pac).nome))}</strong></td><td>${nomeProf(m)}</td><td>Esperando há ${min} min${n === 1 && auto && !ocupado.has(m.prof) ? '' : n === 1 && auto ? ' · <span class="prox">próximo</span>' : ''}</td><td class="acao">${btn}</td></tr>`;
    });
    vem.forEach(m => {
      h += `<tr class="a-chegar"><td></td><td>${esc(firstLast(pacById(m.pac).nome))}</td><td>${nomeProf(m)}</td><td>Chega das ${janelaTxt(m.janela)}</td><td class="acao"><button type="button" class="btn small" data-fila="chegou:${m.id}">Chegou</button></td></tr>`;
    });
    h += '</tbody></table></div>';
    return h;
  }
  // A fila anda sozinha: quando um consultório fica livre, o primeiro que chegou para aquele profissional é chamado.
  const esperandoDe = (profId, dia) => D().marcs
    .filter(m => m.prof === profId && m.data === dia && ACTIVE.includes(m.status) && m.chegada && !m.chamadoEm && !m.atendidoEm)
    .sort((a, b) => a.janela.localeCompare(b.janela) || a.chegada - b.chegada);
  function chamar(m, auto) {
    const p = pacById(m.pac); const pr = profById(m.prof); const tel = telDe(m);
    m.chamadoEm = S.now;
    if (tel) pushMsg(tel, { from: 'bot', kind: 'queue', tag: 'Fila da UBS', text: `🔔 *Chegou a vez de ${first(p.nome)}!*\nPode entrar no consultório de ${pr.nome}.` });
    const prox = esperandoDe(m.prof, m.data)[0];
    const tp = prox && telDe(prox);
    if (tp) pushMsg(tp, { from: 'bot', kind: 'queue', tag: 'Fila da UBS', text: `*${first(pacById(prox.pac).nome)}*, você é o *próximo* da fila de ${pr.nome}. Fique por perto da recepção.` });
    toast(auto ? 'Próximo chamado automaticamente' : 'Paciente chamado', `${p.nome} · ${pr.nome}${tel ? ' · aviso enviado no WhatsApp' : ''}`);
  }
  function autoChamar() {
    if (S.filaAuto === false) return 0;
    let n = 0;
    D().profs.forEach(pr => {
      const ocupado = D().marcs.some(m => m.prof === pr.id && m.data === today() && m.chamadoEm && !m.atendidoEm && ACTIVE.includes(m.status));
      const prox = !ocupado && esperandoDe(pr.id, today())[0];
      if (prox) { chamar(prox, true); n++; }
    });
    return n;
  }
  function filaAcao(acao, id) {
    const m = D().marcs.find(x => x.id === id);
    if (!m) return;
    const p = pacById(m.pac); const pr = profById(m.prof); const tel = telDe(m);
    if (acao === 'chegou') {
      m.chegada = S.now; feito('chegada');
      const pos = posNaFila(m);
      if (tel) pushMsg(tel, { from: 'bot', kind: 'queue', tag: 'Fila da UBS', text: `Chegada registrada na *${ubsById(m.ubs).nome}* às ${hmOf(S.now)}.\n*${first(p.nome)}* é o *${pos}º* da fila de ${pr.nome}.\nAvisamos por aqui quando chegar a vez.` });
      toast('Chegada registrada', `${p.nome} · ${pos}º na fila de ${pr.nome}`);
    }
    if (acao === 'chamar') {
      chamar(m, false);
    }
    if (acao === 'fim') { m.atendidoEm = S.now; feito('concluir'); toast('Atendimento concluído', `${p.nome} · ${pr.nome}`); }
    autoChamar();
    save(); render();
  }

  // ---------- Números da semana ----------
  function numerosHtml() {
    const w = wd(today());
    const seg = addDays(today(), w === 0 ? 1 : 1 - w);
    const dias = [0, 1, 2, 3, 4].map(i => addDays(seg, i));
    const linhas = dias.map(d => {
      const c = capDia(d);
      const f = filaHoje(d);
      const veio = f.atendidos.length + f.atendimento.length + f.recepcao.length;
      const falta = f.faltas.length;
      const prev = f.previstos.length;
      const livres = d >= today() ? Math.max(0, c.cap - c.occ) : 0;
      const canceladas = D().marcs.filter(m => m.ubs === S.ubs && m.data === d && m.status === 'cancelada').length;
      return { d, cap: Math.max(c.cap, veio + falta + prev + livres), veio, falta, prev, livres, canceladas, blocked: c.blocked, marcadas: veio + falta + prev };
    });
    const tot = k => linhas.reduce((s, l) => s + l[k], 0);
    const base = tot('veio') + tot('falta');
    const taxa = base ? Math.round(tot('veio') / base * 100) : 0;
    const semana = D().marcs.filter(m => m.ubs === S.ubs && m.data >= seg && m.data <= dias[4]);
    const viaZap = semana.filter(m => m.canal === 'WhatsApp' && m.status !== 'cancelada').length;
    const ativasSem = semana.filter(m => m.status !== 'cancelada').length;
    const liberadas = D().avisos.filter(a => a.ubs === S.ubs && a.resposta === 'não vai').length + semana.filter(m => m.status === 'cancelada').length;
    let h = `<div class="kpis">
      <div class="kpi"><span>Consultas marcadas</span><b>${tot('marcadas')}</b><small>de segunda a sexta</small></div>
      <div class="kpi accent"><span>Comparecimento</span><b>${taxa}%</b><small>${tot('veio')} vieram, ${tot('falta')} faltaram</small></div>
      <div class="kpi ${tot('falta') ? 'alert' : ''}"><span>Faltas</span><b>${tot('falta')}</b><small>sem aviso antes</small></div>
      <div class="kpi"><span>Vagas devolvidas</span><b>${liberadas}</b><small>pacientes que avisaram que não vão</small></div>
      <div class="kpi"><span>Pelo WhatsApp</span><b>${ativasSem ? Math.round(viaZap / ativasSem * 100) : 0}%</b><small>${viaZap} de ${ativasSem} marcações</small></div></div>`;
    h += `<section class="box week"><h3>Ocupação de cada dia<span class="wk-legend"><i class="s-veio"></i>Vieram<i class="s-prev"></i>Marcadas, ainda vão vir<i class="s-falta"></i>Faltaram<i class="s-livre"></i>Vagas livres</span></h3><div class="box-body">`;
    linhas.forEach(l => {
      const pc = n => l.cap ? (n / l.cap * 100).toFixed(1) : 0;
      const tag = l.d === today() ? 'hoje' : l.d < today() ? 'encerrado' : l.blocked ? 'com imprevisto' : '';
      h += `<button type="button" class="week-row" data-goto-day="${l.d}"><span class="wd">${esc(cap(fmtD(l.d)))}${tag ? `<em>${tag}</em>` : ''}</span><span class="stack" role="img" aria-label="${l.veio} vieram, ${l.prev} ainda vão vir, ${l.falta} faltaram, ${l.livres} vagas livres">${l.veio ? `<i class="s-veio" style="width:${pc(l.veio)}%">${l.veio}</i>` : ''}${l.prev ? `<i class="s-prev" style="width:${pc(l.prev)}%">${l.prev}</i>` : ''}${l.falta ? `<i class="s-falta" style="width:${pc(l.falta)}%">${l.falta}</i>` : ''}${l.livres ? `<i class="s-livre" style="width:${pc(l.livres)}%">${l.livres}</i>` : ''}</span><span class="n">${l.marcadas} de ${l.cap}</span></button>`;
    });
    h += '</div></section>';
    return h;
  }

  function chipHtml(m) {
    const p = pacById(m.pac);
    let cls = 'marcada', st = 'Marcada';
    if (m.status === 'confirmada') { cls = 'confirmada'; st = 'Confirmada'; }
    else if (m.status === 'aguardando') { cls = 'aguardando'; st = 'Aguardando escolha de nova vaga'; }
    else if (m.lembrado) { cls = 'naoconf'; st = 'Lembrete enviado, sem confirmação'; }
    const isNew = fresh[m.id] && Date.now() - fresh[m.id] < 2600;
    const title = `${p.nome} · CPF ${fmtCpf(p.cpf)} · ${st} · marcado por ${POR[m.por.tipo].toLowerCase()} via ${m.canal}`;
    return `<span class="chip ${cls} ${isNew ? 'new' : ''}" title="${esc(title)}"><span class="dot"></span>${esc(firstLast(p.nome))}<span class="por">${esc(POR[m.por.tipo])}${m.remarcada ? ' · remarcada' : ''}</span></span>`;
  }

  function agendaHtml() {
    const dia = S.dia;
    const profs = D().profs.filter(p => p.ubs === S.ubs);
    const doDia = D().marcs.filter(m => m.ubs === S.ubs && m.data === dia);
    const ativas = doDia.filter(m => ACTIVE.includes(m.status));
    const conf = ativas.filter(m => m.status === 'confirmada').length;
    const naoConf = ativas.filter(m => m.status === 'marcada' && m.lembrado).length;
    const livresDia = profs.reduce((s, p) => s + livres(p, dia, 'manha') + livres(p, dia, 'tarde'), 0);
    const aguard = D().marcs.filter(m => m.ubs === S.ubs && m.status === 'aguardando').length;
    const bls = D().bloqueios.filter(b => b.ubs === S.ubs && b.data === dia);
    let h = `<div class="agenda-head">
      <button type="button" class="btn small" data-day="prev" aria-label="Dia anterior">‹</button>
      <h2>${esc(fmtD(dia))}</h2>
      <button type="button" class="btn small" data-day="next" aria-label="Próximo dia">›</button>
      <button type="button" class="btn small ghost" data-day="today">Hoje</button>
      <input type="date" value="${dia}" data-day-input aria-label="Escolher dia">
      <div class="stats">
        <span class="stat"><b>${ativas.length}</b>marcadas</span>
        <span class="stat"><b>${conf}</b>confirmadas</span>
        <span class="stat"><b>${naoConf}</b>não confirmadas</span>
        <span class="stat"><b>${livresDia}</b>vagas livres</span>
      </div></div>`;
    bls.forEach(b => {
      const alvo = b.prof === 'todos' ? 'UBS fechada' : `Ausência: ${profById(b.prof).nome}`;
      h += `<div class="banner warn"><div><strong>${esc(alvo)} · ${b.turno === 'dia' ? 'dia todo' : turnoTxt(b.turno)}</strong>${b.motivo ? esc(b.motivo) + '. ' : ''}Os pacientes afetados já foram avisados. Veja o histórico de avisos.</div></div>`;
    });
    if (aguard) h += `<div class="banner info"><div><strong>${aguard} ${aguard === 1 ? 'paciente aguarda' : 'pacientes aguardam'} a escolha de uma nova vaga</strong>Eles receberam opções pelo WhatsApp e ainda não responderam.</div></div>`;
    if (!isUtil(dia)) return h + '<div class="empty-state">Sem atendimento neste dia (fim de semana).</div>';
    h += '<div class="prof-grid">';
    profs.forEach(p => {
      const anyBlocked = Object.keys(TURNOS).some(t => p.turnos[t] && isBlocked(p, dia, t));
      h += `<article class="prof-card ${anyBlocked ? 'blocked' : ''}"><header><div><strong>${esc(p.nome)}</strong><br><span>${TIPOS[p.tipo]} · ${p.vagas} vagas por janela</span></div></header>`;
      Object.keys(TURNOS).forEach(t => {
        if (!p.turnos[t]) return;
        const blocked = isBlocked(p, dia, t);
        h += `<div class="turno"><h4>${TURNOS[t].label}${blocked ? '<span class="blocked-tag">Sem atendimento</span>' : `<span>${livres(p, dia, t)} livres</span>`}</h4>`;
        TURNOS[t].janelas.forEach(j => {
          const ms = doDia.filter(m => m.prof === p.id && m.turno === t && m.janela === j && (ACTIVE.includes(m.status) || m.status === 'aguardando'));
          const ativosN = ms.filter(m => ACTIVE.includes(m.status)).length;
          const vazias = blocked ? 0 : Math.max(0, p.vagas - ativosN);
          h += `<div class="janela"><span class="hora">${fmtH(j)}–${fmtH(plusH(j, 1))}</span><div class="slots">${ms.map(chipHtml).join('')}${'<span class="chip empty">livre</span>'.repeat(vazias)}</div></div>`;
        });
        const canc = doDia.filter(m => m.prof === p.id && m.turno === t && m.status === 'cancelada');
        if (canc.length) h += `<div class="cancel-list">Canceladas: ${canc.map(m => esc(firstLast(pacById(m.pac).nome))).join(', ')}</div>`;
        h += '</div>';
      });
      h += '</article>';
    });
    h += `</div><div class="legend">
      <span><i style="background:var(--info)"></i>Marcada</span><span><i style="background:var(--ok)"></i>Confirmada</span>
      <span><i style="background:var(--warn)"></i>Lembrete enviado, sem confirmação</span>
      <span>Rótulo: quem marcou (Paciente, Familiar, ACS ou Balcão)</span></div>`;
    return h;
  }

  function diasOpts(sel, minD, skip) {
    let o = '';
    for (let i = 0; i <= ANTECEDENCIA + 3; i++) {
      const d = addDays(minD, i);
      if (!isUtil(d) || d === skip) continue;
      o += `<option value="${d}" ${d === sel ? 'selected' : ''}>${esc(cap(fmtD(d)))}</option>`;
    }
    return o;
  }

  function stepperHtml(step) {
    const n = step === 'ok' ? 4 : step;
    return `<ol class="stepper">${['O que aconteceu', 'Quem foi afetado', 'O que fazer'].map((l, i) =>
      `<li class="${i + 1 < n ? 'done' : i + 1 === n ? 'current' : ''}">${l}</li>`).join('')}</ol>`;
  }
  function optCards(field, value, opts) {
    return `<div class="opt-cards">${opts.map(([v, l, d]) => `<button type="button" class="opt" data-imp-set="${field}:${v}" aria-pressed="${value === v}"><strong>${esc(l)}</strong><span>${esc(d)}</span></button>`).join('')}</div>`;
  }
  function bubbleHtml(kind, tag, text, buttons) {
    return `<div class="msg in ${kind}"><div class="bubble">${tag ? `<span class="tag">${esc(tag)}</span><br>` : ''}${fmtTxt(text)}<span class="meta">${hmOf(S.now)}</span></div>${buttons && buttons.length ? `<div class="quick">${buttons.map(b => `<button type="button" disabled>${esc(b)}</button>`).join('')}</div>` : ''}</div>`;
  }
  function impHistoricoHtml() {
    const bls = D().bloqueios.filter(b => b.ubs === S.ubs).sort((a, b) => b.criado - a.criado);
    let h = '<div class="agenda-head"><button type="button" class="btn imp-btn" data-action="imp-abrir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>Registrar imprevisto</button></div>';
    if (!bls.length) return h + '<p class="muted">Nenhum imprevisto registrado ainda.</p>';
    h += '<div class="box"><table><thead><tr><th>Registrado</th><th>O que aconteceu</th><th>Dia afetado</th><th>Pacientes avisados</th><th>Responderam</th></tr></thead><tbody>';
    bls.forEach(b => {
      const avs = D().avisos.filter(a => a.ubs === b.ubs && a.quando === b.criado && a.tipo !== 'Lembrete da véspera');
      const resp = avs.filter(a => a.resposta !== 'sem resposta' && a.resposta !== 'avisar por telefone ou ACS').length;
      h += `<tr><td>${esc(cap(fmtD(dOf(b.criado))))}, ${hmOf(b.criado)}</td><td><strong>${esc(TIPO_IMP[b.tipo])}</strong><br><span class="muted">${esc(b.prof === 'todos' ? ubsById(b.ubs).nome : profById(b.prof).nome)}${b.motivo ? ' · ' + esc(b.motivo) : ''}</span></td><td>${esc(cap(fmtD(b.data)))} · ${b.turno === 'dia' ? 'dia todo' : turnoTxt(b.turno)}</td><td>${avs.length}</td><td>${resp} de ${avs.length}</td></tr>`;
    });
    return h + '</tbody></table></div>';
  }
  function imprevistoHtml() {
    const imp = S.imp;
    const profs = D().profs.filter(p => p.ubs === S.ubs);
    const rows = preview(imp);
    const naoManter = rows.filter(r => r.acao !== 'manter');
    const telOf = r => r.m.por.tel || pacById(r.m.pac).tel;
    const semTel = naoManter.filter(r => !telOf(r)).length;
    const conflitos = imp.tipo === 'atraso' ? 0 : rows.filter(r => r.acao === 'mover' && !r.dest).length;
    const alvo = imp.tipo === 'fechada' ? `na ${ubsById(imp.ubs).nome}` : `de ${profById(imp.prof).nome}`;
    const periodo = imp.turno === 'dia' ? `no dia ${fmtD(imp.data)}` : `na ${turnoTxt(imp.turno)} de ${fmtD(imp.data)}`;
    let h = stepperHtml(imp.step);

    if (imp.step === 'ok') {
      const r = S.lastResult || { enviados: 0, manuais: 0 };
      return h + `<div class="success"><div class="check">✓</div><h2>${r.enviados + r.manuais} ${r.enviados + r.manuais === 1 ? 'aviso registrado' : 'avisos registrados'}</h2>
        <p>${r.enviados} enviados pelo WhatsApp${r.manuais ? ` · ${r.manuais} sem WhatsApp: avisar por telefone ou pelo ACS` : ''}</p>
        <p>${esc(r.tipo || '')} · ${esc(r.alvo || '')} · ${esc(r.data || '')}</p></div>
        <div class="actions" style="justify-content:center">${document.querySelector('#tabs [data-tab="historico"]') ? '<button type="button" class="btn" data-tab-link="historico">Ver respostas no histórico</button>' : ''}${r.destData ? `<button type="button" class="btn" data-goto-day="${r.destData}">Ver agenda de ${esc(fmtD(r.destData))}</button>` : ''}<button type="button" class="btn primary" data-imp-step="1">Registrar outro imprevisto</button></div>`;
    }

    if (imp.step === 1) {
      h += '<h2 class="step-title">O que aconteceu?</h2><p class="step-sub">O sistema encontra as consultas afetadas e avisa cada paciente pelo WhatsApp.</p>';
      h += optCards('tipo', imp.tipo, [['ausencia', 'Ausência do profissional', 'Médico ou enfermeiro não vai atender'], ['fechada', 'UBS fechada', 'Falta de energia, greve, dedetização'], ['atraso', 'Atraso ou mudança de horário', 'O atendimento começa mais tarde']]);
      h += '<div class="form-grid">';
      if (imp.tipo !== 'fechada') h += `<label class="field">Profissional<select data-imp="prof">${profs.map(p => `<option value="${p.id}" ${p.id === imp.prof ? 'selected' : ''}>${esc(p.nome)} · ${TIPOS[p.tipo]}</option>`).join('')}</select></label>`;
      h += `<label class="field">Data<select data-imp="data">${diasOpts(imp.data, today(), null)}</select></label>`;
      h += `<label class="field">Turno<select data-imp="turno"><option value="manha" ${imp.turno === 'manha' ? 'selected' : ''}>Manhã</option><option value="tarde" ${imp.turno === 'tarde' ? 'selected' : ''}>Tarde</option>${imp.tipo !== 'atraso' ? `<option value="dia" ${imp.turno === 'dia' ? 'selected' : ''}>Dia todo</option>` : ''}</select></label>`;
      h += `<label class="field">Motivo (aparece no aviso)<input type="text" data-imp="motivo" value="${esc(imp.motivo)}" placeholder="Ex.: atestado médico"></label></div>`;
      h += `<div class="actions"><span class="muted">${rows.length} ${rows.length === 1 ? 'consulta afetada' : 'consultas afetadas'}</span><span class="spacer"></span><button type="button" class="btn primary" data-imp-step="2">Continuar</button></div>`;
      return h;
    }

    if (imp.step === 2) {
      h += `<h2 class="step-title">${rows.length} ${rows.length === 1 ? 'consulta afetada' : 'consultas afetadas'}</h2><p class="step-sub">${rows.length === 1 ? 'Consulta' : 'Consultas'} ${esc(alvo)} ${esc(periodo)}.</p>`;
      if (!rows.length) {
        h += '<div class="empty-state">Nenhuma consulta marcada nesse período. Nada precisa ser avisado.</div>';
      } else {
        h += `<div class="summary-row"><span class="pill info">${rows.length - rows.filter(r => !telOf(r)).length} com WhatsApp</span>${rows.some(r => !telOf(r)) ? `<span class="pill warn">${rows.filter(r => !telOf(r)).length} sem WhatsApp: ligar ou avisar pelo ACS</span>` : ''}</div>`;
        h += `<div class="affected">${rows.map(r => { const p = pacById(r.m.pac); return `<div class="person"><div><strong>${esc(p.nome)}</strong><span class="sub">${turnoTxt(r.m.turno)} · ${fmtH(r.m.janela)}–${fmtH(plusH(r.m.janela, 1))} · ${esc(POR[r.m.por.tipo])}</span></div>${telOf(r) ? '<span class="pill">WhatsApp</span>' : '<span class="pill warn">Sem WhatsApp</span>'}</div>`; }).join('')}</div>`;
      }
      h += `<div class="actions"><button type="button" class="btn" data-imp-step="1">Voltar</button><span class="spacer"></span><button type="button" class="btn primary" data-imp-step="3" ${rows.length ? '' : 'disabled'}>Continuar</button></div>`;
      return h;
    }

    // Passo 3
    if (imp.tipo === 'atraso') {
      const t = imp.turno === 'dia' ? 'manha' : imp.turno;
      const ops = t === 'manha' ? ['08:00', '09:00', '10:00'] : ['14:00', '15:00'];
      h += '<h2 class="step-title">Qual o novo horário de início?</h2><p class="step-sub">As janelas de chegada de cada paciente são deslocadas na mesma medida.</p>';
      h += `<div class="form-grid"><label class="field">Novo início<select data-imp="inicio">${ops.map(o => `<option value="${o}" ${o === imp.inicio ? 'selected' : ''}>${fmtH(o)}</option>`).join('')}</select></label></div>`;
    } else {
      h += '<h2 class="step-title">O que fazer com essas consultas?</h2><p class="step-sub">A ação vale para todos. Se precisar, ajuste casos individuais antes de enviar.</p>';
      h += optCards('acao', imp.acao, [['mover', 'Mover para outro dia', 'Remarca todos, mantendo a janela quando possível'], ['oferecer', 'Oferecer vagas', 'Cada paciente escolhe entre 3 opções'], ['cancelar', 'Cancelar', 'Cancela e convida a marcar de novo']]);
      if (imp.acao === 'mover') {
        h += `<div class="form-grid"><label class="field">Mover para<select data-imp="destData">${diasOpts(imp.destData, addDays(today(), 1), null)}</select></label>
          <label class="field">Turno de destino<select data-imp="destTurno"><option value="mesmo" ${imp.destTurno === 'mesmo' ? 'selected' : ''}>Mesmo turno</option><option value="manha" ${imp.destTurno === 'manha' ? 'selected' : ''}>Manhã</option><option value="tarde" ${imp.destTurno === 'tarde' ? 'selected' : ''}>Tarde</option></select></label></div>`;
      }
    }
    const firstRow = naoManter[0];
    const prev = firstRow ? textoAviso(imp, firstRow) : null;
    const prevBtns = prev ? (prev.buttons ? prev.buttons.map(b => b.label) : opcoes(firstRow.m).map(o => `${cap(fmtD(o.data))} · ${turnoTxt(o.turno)} · ${fmtH(o.janela)}`).concat(['Nenhuma serve'])) : [];
    h += '<div class="preview"><div>';
    h += `<div class="summary-row"><span class="pill info">${naoManter.length - semTel} pelo WhatsApp</span>${semTel ? `<span class="pill warn">${semTel} sem WhatsApp: ligar ou ACS</span>` : ''}${conflitos ? `<span class="pill warn">${conflitos} sem vaga no destino: recebem opções</span>` : ''}${rows.length - naoManter.length ? `<span class="pill">${rows.length - naoManter.length} sem aviso</span>` : ''}</div>`;
    h += `<button type="button" class="linkbtn" data-action="toggle-adjust">${imp.adjust ? 'Ocultar casos individuais' : `Ajustar casos individuais (${rows.length})`}</button>`;
    if (imp.adjust) {
      h += '<div style="overflow-x:auto;margin-top:8px"><table><thead><tr><th>Paciente</th><th>Janela</th><th>Ação</th><th>Resultado</th></tr></thead><tbody>';
      rows.forEach(r => {
        const m = r.m; const p = pacById(m.pac);
        let res;
        if (r.acao === 'manter') res = '<span class="pill">Sem aviso</span>';
        else if (imp.tipo === 'atraso') res = `<span class="pill info">Nova janela ${fmtH(atrasoJanela(m, imp.inicio))}</span>`;
        else if (r.acao === 'mover') res = r.dest ? `<span class="pill ok">${esc(fmtD(r.dest.data))} · ${fmtH(r.dest.janela)}</span>` : '<span class="pill warn">Sem vaga: opções</span>';
        else if (r.acao === 'oferecer') res = '<span class="pill warn">Escolhe a vaga</span>';
        else res = '<span class="pill bad">Cancelada</span>';
        const sel = imp.tipo === 'atraso'
          ? `<select data-over="${m.id}"><option value="">Avisar</option><option value="manter" ${imp.over[m.id] === 'manter' ? 'selected' : ''}>Não avisar</option></select>`
          : `<select data-over="${m.id}"><option value="">Ação do lote</option>${[['mover', 'Mover'], ['oferecer', 'Oferecer vagas'], ['cancelar', 'Cancelar'], ['manter', 'Não avisar']].map(([v, l]) => `<option value="${v}" ${imp.over[m.id] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
        h += `<tr class="${r.acao === 'mover' && !r.dest && imp.tipo !== 'atraso' ? 'conflict' : ''}"><td><strong>${esc(p.nome)}</strong></td><td>${fmtH(m.janela)}–${fmtH(plusH(m.janela, 1))}</td><td>${sel}</td><td>${res}</td></tr>`;
      });
      h += '</tbody></table></div>';
    }
    h += '</div>';
    h += `<div class="msg-preview"><span class="label">Prévia do aviso · ${firstRow ? esc(pacById(firstRow.m.pac).nome) : '—'}</span>${prev ? bubbleHtml('alert', 'Aviso da UBS', prev.text, prevBtns) : '<span class="muted">Nenhum aviso será enviado.</span>'}</div></div>`;
    h += `<div class="actions"><button type="button" class="btn" data-imp-step="2">Voltar</button><span class="spacer"></span><button type="button" class="btn primary" data-action="send-imp" ${naoManter.length ? '' : 'disabled'}>Enviar ${naoManter.length} ${naoManter.length === 1 ? 'aviso' : 'avisos'}</button></div>`;
    return h;
  }

  function capDia(d) {
    let capN = 0, blocked = false;
    D().profs.filter(p => p.ubs === S.ubs).forEach(p => Object.keys(TURNOS).forEach(t => {
      if (!p.turnos[t]) return;
      if (isBlocked(p, d, t)) { blocked = true; return; }
      capN += TURNOS[t].janelas.length * p.vagas;
    }));
    const occ = D().marcs.filter(m => m.ubs === S.ubs && m.data === d && ACTIVE.includes(m.status)).length;
    return { cap: capN, occ, blocked };
  }
  function inicioHtml() {
    const dias = [];
    for (let i = 0; i <= ANTECEDENCIA; i++) { const d = addDays(today(), i); if (isUtil(d)) dias.push(d); }
    const fim = addDays(today(), ANTECEDENCIA);
    const ms = D().marcs.filter(m => m.ubs === S.ubs && m.data >= today() && m.data <= fim);
    const ativas = ms.filter(m => ACTIVE.includes(m.status));
    const conf = ms.filter(m => m.status === 'confirmada').length;
    const semResp = ms.filter(m => m.status === 'marcada' && m.lembrado).length;
    const aguard = ms.filter(m => m.status === 'aguardando').length;
    const viaZap = ativas.filter(m => m.canal === 'WhatsApp').length;
    const livresT = dias.reduce((s, d) => { const c = capDia(d); return s + Math.max(0, c.cap - c.occ); }, 0);
    let h = `<div class="kpis">
      <div class="kpi"><span>Consultas marcadas</span><b>${ativas.length}</b><small>${viaZap} pelo WhatsApp</small></div>
      <div class="kpi"><span>Confirmadas</span><b>${conf}</b><small>presença confirmada</small></div>
      <div class="kpi ${semResp ? 'alert' : ''}"><span>Sem confirmação</span><b>${semResp}</b><small>lembrete enviado</small></div>
      <div class="kpi ${aguard ? 'alert' : ''}"><span>Aguardando vaga</span><b>${aguard}</b><small>após imprevisto</small></div>
      <div class="kpi accent"><span>Vagas livres</span><b>${livresT}</b><small>próximos ${ANTECEDENCIA} dias</small></div></div>`;
    h += `<div class="quick-actions"><button type="button" class="btn primary" data-tab="imprevisto">Registrar imprevisto</button><button type="button" class="btn" data-tab="balcao">Marcar no balcão</button><button type="button" class="btn" data-tab="agenda">Abrir agenda</button></div>`;
    h += '<div class="grid-2"><div class="box"><h3>Ocupação por dia<a href="#" data-tab-link="agenda">Ver agenda</a></h3><div class="box-body">';
    dias.forEach(d => {
      const c = capDia(d);
      const pct = c.cap ? Math.min(100, Math.round(c.occ / c.cap * 100)) : 0;
      h += `<button type="button" class="occ ${c.blocked ? 'blocked' : ''}" data-goto-day="${d}"><span>${esc(cap(fmtD(d)))}${d === today() ? ' · hoje' : ''}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="n">${c.occ} de ${c.cap}${c.blocked ? ' · imprevisto' : ''}</span></button>`;
    });
    h += '</div></div><div style="display:flex;flex-direction:column;gap:16px">';
    const bls = D().bloqueios.filter(b => b.ubs === S.ubs && b.data >= today()).sort((a, b) => a.data.localeCompare(b.data));
    h += `<div class="box"><h3>Imprevistos registrados</h3><div class="box-body">${bls.length ? `<ul class="list">${bls.map(b => `<li><div><strong>${esc(TIPO_IMP[b.tipo])} · ${esc(b.prof === 'todos' ? ubsById(b.ubs).nome : profById(b.prof).nome)}</strong><span class="sub">${esc(fmtD(b.data))} · ${b.turno === 'dia' ? 'dia todo' : turnoTxt(b.turno)}${b.motivo ? ' · ' + esc(b.motivo) : ''}</span></div><span class="pill ok">Avisos enviados</span></li>`).join('')}</ul>` : '<p class="muted" style="margin:0">Nenhum imprevisto nos próximos dias.</p>'}</div></div>`;
    const avs = D().avisos.filter(a => a.ubs === S.ubs).slice(-5).reverse();
    const pill = r => r === 'confirmou' || r === 'escolheu nova vaga' || r === 'ciente' ? 'ok' : r === 'não vai' || r === 'nenhuma vaga serviu' ? 'bad' : r === 'sem resposta' ? '' : 'warn';
    h += `<div class="box"><h3>Últimos avisos<a href="#" data-tab-link="historico">Ver todos</a></h3><div class="box-body">${avs.length ? `<ul class="list">${avs.map(a => `<li><div><strong>${esc(pacById(a.pac).nome)}</strong><span class="sub">${esc(a.tipo)} · ${hmOf(a.quando)}</span></div><span class="pill ${pill(a.resposta)}">${esc(a.resposta)}</span></li>`).join('')}</ul>` : '<p class="muted" style="margin:0">Nenhum aviso enviado ainda. Avance o relógio até as 18h para disparar os lembretes da véspera.</p>'}</div></div>`;
    h += '</div></div>';
    return h;
  }

  function balcaoHtml() {
    const b = S.balcao;
    const p = b.pac ? pacById(b.pac) : null;
    let h = `<p class="muted" style="margin-top:0">Para quem não usa WhatsApp: o gestor marca no balcão. Se o paciente tiver celular no cadastro, ele recebe a confirmação e os avisos por lá.</p>
      <div class="form-grid"><label class="field">CPF ou Cartão SUS<input type="text" data-balcao="cpf" value="${esc(b.cpf)}" placeholder="Somente números"></label>
      <div class="field" style="justify-content:flex-end"><button type="button" class="btn" data-action="balcao-buscar">Buscar paciente</button></div></div>`;
    if (b.buscou && !p) {
      h += `<div class="empty-state">Paciente não encontrado na base desta UBS. Faça o cadastro antes de marcar.<br><span class="muted">Para testar: Josefa da Silva, CPF ${fmtCpf('55566677788')}.</span></div>`;
      return h;
    }
    if (!p) return h + `<p class="muted">Para testar: Josefa da Silva (mãe da Maria, sem celular), CPF ${fmtCpf('55566677788')}.</p>`;
    if (p.ubs !== S.ubs) return h + `<div class="empty-state">${esc(p.nome)} está cadastrado(a) na ${esc(ubsById(p.ubs).nome)}. A marcação deve ser feita na UBS do paciente.</div>`;
    const ativa = D().marcs.find(m => m.pac === p.id && (ACTIVE.includes(m.status) || m.status === 'aguardando') && m.data >= today());
    h += `<div class="card patient-card"><div><strong>${esc(p.nome)}</strong><br><span class="muted">CPF ${fmtCpf(p.cpf)} · ${p.tel ? 'Celular ' + fmtTel(p.tel) : 'Sem celular cadastrado'}</span></div>${ativa ? `<span class="pill warn">Já tem consulta: ${esc(fmtD(ativa.data))}</span>` : '<span class="pill ok">Pode marcar</span>'}</div>`;
    if (ativa) return h;
    const ds = diasDisponiveis(p.ubs, b.tipo);
    if (!ds.some(x => x.d === b.dia)) b.dia = ds.length ? ds[0].d : '';
    const turnos = b.dia ? Object.keys(TURNOS).filter(t => vagasTurno(p.ubs, b.tipo, b.dia, t) > 0) : [];
    if (!turnos.includes(b.turno)) b.turno = turnos[0] || 'manha';
    const a = b.dia && turnos.length ? alocar(p.ubs, b.tipo, b.dia, b.turno) : null;
    h += `<div class="form-grid" style="margin-top:16px">
      <label class="field">Atendimento<select data-balcao="tipo"><option value="cli" ${b.tipo === 'cli' ? 'selected' : ''}>Clínico geral</option><option value="enf" ${b.tipo === 'enf' ? 'selected' : ''}>Enfermagem</option></select></label>
      <label class="field">Dia<select data-balcao="dia">${ds.map(x => `<option value="${x.d}" ${x.d === b.dia ? 'selected' : ''}>${esc(cap(fmtD(x.d)))} · ${x.n} vagas</option>`).join('')}</select></label>
      <label class="field">Turno<select data-balcao="turno">${turnos.map(t => `<option value="${t}" ${t === b.turno ? 'selected' : ''}>${TURNOS[t].label} · ${vagasTurno(p.ubs, b.tipo, b.dia, t)} vagas</option>`).join('')}</select></label></div>`;
    h += a ? `<div class="card"><strong>${esc(cap(fmtD(a.data)))}, ${turnoTxt(a.turno)}</strong> · chegada das ${janelaTxt(a.janela)} · ${esc(profById(a.prof).nome)}</div>
      <div class="actions"><button type="button" class="btn primary" data-action="balcao-marcar">Marcar consulta</button></div>` : '<div class="empty-state">Sem vagas nos próximos 7 dias.</div>';
    return h;
  }

  function vagasHtml() {
    const profs = D().profs.filter(p => p.ubs === S.ubs);
    let h = `<p class="muted" style="margin-top:0">Janelas de chegada de 1 hora: manhã das 7h às 11h (4 janelas) e tarde das 13h às 16h (3 janelas). A agenda fica aberta para os próximos ${ANTECEDENCIA} dias. As mudanças valem na hora.</p>`;
    h += '<table><thead><tr><th>Profissional</th><th>Atendimento</th><th>Manhã</th><th>Tarde</th><th>Vagas por janela</th><th>Vagas por dia</th></tr></thead><tbody>';
    profs.forEach(p => {
      const porDia = Object.keys(TURNOS).reduce((s, t) => s + (p.turnos[t] ? TURNOS[t].janelas.length * p.vagas : 0), 0);
      h += `<tr><td><strong>${esc(p.nome)}</strong></td><td>${TIPOS[p.tipo]}</td>
        <td><input type="checkbox" data-turno="${p.id}|manha" ${p.turnos.manha ? 'checked' : ''} aria-label="Manhã"></td>
        <td><input type="checkbox" data-turno="${p.id}|tarde" ${p.turnos.tarde ? 'checked' : ''} aria-label="Tarde"></td>
        <td><input type="number" min="1" max="8" value="${p.vagas}" data-vaga="${p.id}" aria-label="Vagas por janela"></td><td>${porDia}</td></tr>`;
    });
    return h + '</tbody></table>';
  }

  function historicoHtml() {
    const avs = D().avisos.filter(a => a.ubs === S.ubs).slice().reverse();
    if (!avs.length) return '<div class="empty-state">Nenhum aviso enviado ainda. Registre um imprevisto ou avance o relógio até as 18h para disparar os lembretes da véspera.</div>';
    const pill = r => r === 'confirmou' || r === 'escolheu nova vaga' || r === 'ciente' ? 'ok' : r === 'não vai' || r === 'nenhuma vaga serviu' ? 'bad' : r === 'sem resposta' ? '' : 'warn';
    let h = '<table><thead><tr><th>Enviado em</th><th>Tipo</th><th>Paciente</th><th>Destino</th><th>Resposta</th></tr></thead><tbody>';
    avs.forEach(a => {
      h += `<tr><td>${esc(fmtD(dOf(a.quando)))} · ${hmOf(a.quando)}</td><td>${esc(a.tipo)}</td><td>${esc(pacById(a.pac).nome)}</td><td>${a.tel ? 'WhatsApp ' + fmtTel(a.tel) : 'Sem WhatsApp'}</td><td><span class="pill ${pill(a.resposta)}">${esc(a.resposta)}</span></td></tr>`;
    });
    return h + '</tbody></table>';
  }

  // ---------- Eventos ----------
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.dataset.fila) { const [a, id] = t.dataset.fila.split(':'); return filaAcao(a, id); }
    if (t.dataset.openList) return openList(t.dataset.openList);
    if (t.dataset.action === 'list-close') return closeSheet('listSheet');
    if (t.dataset.action === 'list-send') {
      const sh = $('listSheet'); const sel = sh.querySelector('input[name="opt"]:checked');
      if (!sel) return;
      closeSheet('listSheet');
      return userSend(sel.dataset.label, sel.value, sh.dataset.msg);
    }
    if (t.dataset.action === 'perfil') return openSheet('bizSheet');
    if (t.dataset.action === 'perfil-close') return closeSheet('bizSheet');
    if (t.dataset.tab) { S.tab = t.dataset.tab; save(); return render(); }
    if (t.dataset.tabLink) { e.preventDefault(); S.tab = t.dataset.tabLink; save(); return render(); }
    if (t.dataset.clock) return avancar(t.dataset.clock);
    if (t.id === 'resetBtn') {
      if (window.confirm('Reiniciar a demonstração? Todas as conversas e marcações feitas aqui serão apagadas.')) { S = freshState(); save(); render(); }
      return;
    }
    if (t.dataset.contact) { S.tel = t.dataset.contact; S.unread[S.tel] = 0; save(); return render(); }
    if (t.hasAttribute('data-btn')) return userSend(t.dataset.label, t.dataset.value, t.dataset.msg);
    if (t.dataset.action === 'say-oi') return userSend('Oi', 'oi');
    if (t.dataset.day) {
      if (t.dataset.day === 'today') S.dia = today(); else S.dia = addDays(S.dia, t.dataset.day === 'next' ? 1 : -1);
      save(); return render();
    }
    if (t.dataset.impSet) {
      const [f, v] = t.dataset.impSet.split(':');
      S.imp[f] = v;
      if (f === 'tipo' && v === 'atraso' && S.imp.turno === 'dia') S.imp.turno = 'manha';
      if (f === 'tipo' && v === 'atraso') S.imp.inicio = S.imp.turno === 'tarde' ? '14:00' : '09:00';
      S.imp.over = {}; save(); return render();
    }
    if (t.dataset.action === 'imp-abrir') { S.imp = impDefault(true); S.impModal = true; save(); render(); const c = document.querySelector('#impModal .modal-card'); if (c) c.focus(); return; }
    if (t.dataset.action === 'imp-fechar') { S.impModal = false; if (S.imp.step === 'ok') S.imp = impDefault(); save(); return render(); }
    if (t.dataset.action === 'send-imp') return enviarImprevisto();
    if (t.dataset.impStep) {
      const v = t.dataset.impStep;
      if (S.imp.step === 'ok') S.imp = impDefault();
      S.imp.step = Number(v); save(); return render();
    }
    if (t.dataset.action === 'toggle-adjust') { S.imp.adjust = !S.imp.adjust; save(); return render(); }
    if (t.dataset.gotoDay) { S.dia = t.dataset.gotoDay; S.tab = 'agenda'; S.impModal = false; save(); return render(); }
    if (t.dataset.action === 'balcao-buscar') {
      const p = findPac(S.balcao.cpf);
      S.balcao.pac = p ? p.id : null; S.balcao.buscou = true; save(); return render();
    }
    if (t.dataset.action === 'balcao-marcar') {
      const b = S.balcao; const p = pacById(b.pac);
      const a = alocar(p.ubs, b.tipo, b.dia, b.turno);
      if (!a) return toast('Sem vaga', 'Escolha outro dia ou turno.');
      const m = criarMarcacao(p, a.prof, a.data, a.turno, a.janela, { tipo: 'gestor', tel: p.tel || null }, 'Balcão');
      if (p.tel) {
        pushMsg(p.tel, { from: 'bot', text: `✅ *Consulta marcada no balcão da ${ubsById(p.ubs).nome}*\n${TIPOS[m.tipo]} com ${profById(m.prof).nome}\n*${cap(fmtD(m.data))}*, chegada das *${janelaTxt(m.janela)}*` });
      }
      feito('balcao');
      toast('Consulta marcada no balcão', `${p.nome} · ${fmtD(m.data)} · ${turnoTxt(m.turno)}`);
      S.balcao = { cpf: '', pac: null, buscou: false, tipo: b.tipo, dia: '', turno: 'manha' };
      S.tab = 'agenda'; save(); return render();
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'ubsSelect') { S.ubs = t.value; S.imp = null; S.lastResult = null; S.balcao.pac = null; S.balcao.buscou = false; save(); return render(); }
    if (t.hasAttribute('data-fila-auto')) { S.filaAuto = t.checked; if (t.checked) autoChamar(); save(); return render(); }
    if (t.hasAttribute('data-fila-prof')) { S.filaProf = t.value; save(); return render(); }
    if (t.hasAttribute('data-contact-select')) { if (t.value) { S.tel = t.value; S.unread[S.tel] = 0; save(); render(); } return; }
    if (t.hasAttribute('data-day-input')) { if (t.value) { S.dia = t.value; save(); render(); } return; }
    if (t.dataset.imp) {
      S.imp[t.dataset.imp] = t.value;
      if (t.dataset.imp === 'data' && S.imp.destData <= t.value) S.imp.destData = nextUtil(t.value);
      if (t.dataset.imp === 'turno' && S.imp.tipo === 'atraso') S.imp.inicio = t.value === 'tarde' ? '14:00' : '09:00';
      if (t.dataset.imp !== 'motivo') S.imp.over = {};
      save(); return render();
    }
    if (t.dataset.over) { if (t.value) S.imp.over[t.dataset.over] = t.value; else delete S.imp.over[t.dataset.over]; save(); return render(); }
    if (t.dataset.vaga) { const p = profById(t.dataset.vaga); p.vagas = Math.max(1, Math.min(8, Number(t.value) || 1)); save(); return render(); }
    if (t.dataset.turno) { const [id, tu] = t.dataset.turno.split('|'); profById(id).turnos[tu] = t.checked; save(); return render(); }
    if (t.dataset.balcao && t.dataset.balcao !== 'cpf') { S.balcao[t.dataset.balcao] = t.value; save(); return render(); }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.balcao === 'cpf') { S.balcao.cpf = t.value; S.balcao.buscou = false; }
    if (t.dataset.imp === 'motivo') { S.imp.motivo = t.value; save(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.balcao === 'cpf') { e.preventDefault(); document.querySelector('[data-action="balcao-buscar"]').click(); }
  });

  // Folhas que sobem do rodapé do celular (lista de opções e perfil comercial)
  function openSheet(id) { const s = $(id); if (!s) return; s.hidden = false; requestAnimationFrame(() => s.classList.add('open')); const f = s.querySelector('button, input'); if (f) f.focus(); }
  function closeSheet(id) { const s = $(id); if (!s) return; s.classList.remove('open'); setTimeout(() => { s.hidden = true; }, 180); }
  function openList(msgId) {
    const m = chatOf(S.tel).find(x => x.id === msgId);
    const sh = $('listSheet');
    if (!m || !sh) return;
    sh.dataset.msg = m.id;
    sh.querySelector('[data-list-title]').textContent = m.text.split('\n')[0].replace(/\*/g, '');
    sh.querySelector('[data-list-opts]').innerHTML = m.buttons.map((b, i) => {
      const label = b.label.replace(/^\d+ · /, '');
      const [main, ...rest] = label.split(' · ');
      return `<label class="lopt"><span><strong>${esc(main)}</strong>${rest.length ? `<small>${esc(rest.join(' · '))}</small>` : ''}</span><input type="radio" name="opt" value="${esc(b.value)}" data-label="${esc(label)}" ${i === 0 ? 'checked' : ''}></label>`;
    }).join('');
    openSheet('listSheet');
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['listSheet', 'bizSheet'].forEach(id => { const s = $(id); if (s && !s.hidden) closeSheet(id); });
  });

  if ($('composer')) $('composer').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('msgInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const tel = S.tel;
    const st = bot(tel);
    const msgs = chatOf(tel);
    const last = [...msgs].reverse().find(m => m.from === 'bot' && m.buttons && m.buttons.length && m.answered == null);
    if (/^\d{1,2}$/.test(text) && last && !['identificar', 'outro_cpf'].includes(st.step)) {
      const b = last.buttons[Number(text) - 1];
      if (b) return userSend(text, b.value, last.id);
    }
    userSend(text, text);
  });

  // Exposto para a composição do vídeo e para testes no console.
  if (autoChamar()) save();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.impModal) { S.impModal = false; save(); render(); } });

  window.UBSProto = { get state() { return S; }, render, reset() { S = freshState(); save(); render(); } };

  render();
})();
