import { useState, useEffect, useCallback, useRef } from "react";
import { loadData, saveData, deleteData } from "./supabaseClient";
import { Switch, ModalConfirm, AbaProdutos, AbaListaSimples } from "./components";
import {
  CFG_KEY, PROD_KEY, BORDAS_KEY, BAIRROS_KEY,
  PEDIDOS_PREFIX, PEDIDOS_INDEX_KEY,
  DEFAULT_CONFIG, DEFAULT_BORDAS, DEFAULT_BAIRROS, DEFAULT_PRODUTOS,
  CATEGORIA_ICONES, brl, uid,
} from "./constants";
import { styles } from "./styles";

export default function App() {
  const [tela, setTela] = useState("cliente");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [produtos, setProdutos] = useState([]);
  const [bordas, setBordas] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const mostrarToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  useEffect(() => {
    (async () => {
      const [cfg, prods, bds, bai] = await Promise.all([
        loadData(CFG_KEY, DEFAULT_CONFIG),
        loadData(PROD_KEY, DEFAULT_PRODUTOS),
        loadData(BORDAS_KEY, DEFAULT_BORDAS),
        loadData(BAIRROS_KEY, DEFAULT_BAIRROS),
      ]);
      setConfig({ ...DEFAULT_CONFIG, ...(cfg || {}) });
      setProdutos(prods && prods.length ? prods : DEFAULT_PRODUTOS);
      setBordas(bds && bds.length ? bds : DEFAULT_BORDAS);
      setBairros(bai && bai.length ? bai : DEFAULT_BAIRROS);
      setCarregando(false);
    })();
  }, []);

  async function persistConfig(v) { setConfig(v); await saveData(CFG_KEY, v); }
  async function persistProdutos(v) { setProdutos(v); await saveData(PROD_KEY, v); }
  async function persistBordas(v) { setBordas(v); await saveData(BORDAS_KEY, v); }
  async function persistBairros(v) { setBairros(v); await saveData(BAIRROS_KEY, v); }

  if (carregando) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingEmoji}>🍕</div>
        <div style={styles.loadingText}>Carregando cardápio...</div>
      </div>
    );
  }

  return (
    <div style={styles.appShell}>
      {toast && <div style={styles.toast}>{toast}</div>}
      {tela === "cliente" && <TelaCliente config={config} produtos={produtos} bordas={bordas} bairros={bairros} mostrarToast={mostrarToast} irParaAdmin={() => setTela("admin-login")} />}
      {tela === "admin-login" && <TelaLoginAdmin senhaCorreta={config.senhaAdmin} onEntrar={() => setTela("admin")} onVoltar={() => setTela("cliente")} />}
      {tela === "admin" && <TelaAdmin config={config} produtos={produtos} bordas={bordas} bairros={bairros} setConfig={persistConfig} setProdutos={persistProdutos} setBordas={persistBordas} setBairros={persistBairros} mostrarToast={mostrarToast} onVoltarCardapio={() => setTela("cliente")} />}
    </div>
  );
}

/* ── Tela Cliente ── */
function TelaCliente({ config, produtos, bordas, bairros, mostrarToast, irParaAdmin }) {
  const disponiveis = produtos.filter((p) => p.disponivel !== false);
  const categoriasOrdem = [...new Set(disponiveis.map((p) => p.categoria || "Outros"))];
  const porCategoria = {};
  disponiveis.forEach((p) => { const cat = p.categoria || "Outros"; if (!porCategoria[cat]) porCategoria[cat] = []; porCategoria[cat].push(p); });

  const [selecoes, setSelecoes] = useState({});
  const [carrinho, setCarrinho] = useState([]);
  const [enviando, setEnviando] = useState(false);

  function getSel(cat) {
    return selecoes[cat] || { sabor1Id: porCategoria[cat]?.[0]?.id || "", sabor2Id: "inteira", bordaId: bordas[0]?.id || "", obs: "" };
  }
  function setSel(cat, patch) { setSelecoes((s) => ({ ...s, [cat]: { ...getSel(cat), ...patch } })); }
  const ehPizza = (cat) => cat.toLowerCase().includes("pizza");

  function adicionar(cat) {
    const lista = porCategoria[cat] || [];
    const sel = getSel(cat);
    const item1 = lista.find((p) => p.id === sel.sabor1Id);
    if (!item1) return;
    if (ehPizza(cat)) {
      const item2 = sel.sabor2Id !== "inteira" ? lista.find((p) => p.id === sel.sabor2Id) : null;
      const borda = bordas.find((b) => b.id === sel.bordaId);
      const total = (item2 ? Math.max(item1.preco, item2.preco) : item1.preco) + (borda ? borda.preco : 0);
      setCarrinho((c) => [...c, { key: uid(), nome: item2 ? `${item1.nome} / ${item2.nome} (meio a meio)` : item1.nome, categoria: cat, borda: borda ? borda.nome : null, obs: sel.obs.trim(), qtd: 1, total }]);
    } else {
      setCarrinho((c) => [...c, { key: uid(), nome: item1.nome, categoria: cat, borda: null, obs: sel.obs.trim(), qtd: 1, total: item1.preco }]);
    }
    setSel(cat, { obs: "" });
    mostrarToast(`✅ ${item1.nome} adicionado!`);
  }

  const totalGeral = carrinho.reduce((s, i) => s + i.total * i.qtd, 0);

  return (
    <div style={styles.pageWrap}>
      <div style={styles.headerCliente}>
        <div style={styles.headerTitulo}>{(config.nomeLoja || "").toUpperCase()}</div>
        <div style={styles.headerSub}>{config.cidade} {config.telefone ? `| ${config.telefone}` : ""}</div>
      </div>
      <div style={styles.main}>
        {!config.aberto && <div style={styles.avisoFechado}>😴 Estamos fechados no momento.</div>}
        {disponiveis.length === 0 ? (
          <div style={styles.emptyState}>🍕 Nenhum produto disponível no momento.</div>
        ) : (
          categoriasOrdem.map((cat) => {
            const lista = porCategoria[cat];
            const sel = getSel(cat);
            const pizza = ehPizza(cat);
            const item1 = lista.find((p) => p.id === sel.sabor1Id);
            return (
              <div key={cat} style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionBar} />
                  <span style={styles.sectionIcon}>{CATEGORIA_ICONES[cat] || "🍽️"}</span>
                  <span style={styles.sectionTitle}>{cat.toUpperCase()}</span>
                </div>
                {item1 && (item1.foto || item1.descricao) && (
  <div style={styles.itemInfoBox}>
    {item1.foto && (
      <img src={item1.foto} alt={item1.nome} style={styles.itemInfoFoto} />
    )}
    {item1.descricao && (
      <div style={styles.itemInfoDesc}>{item1.descricao}</div>
    )}
  </div>
)}
                <div style={styles.fieldLabel}>{pizza ? "Sabor 1:" : "Item:"}</div>
                <select value={sel.sabor1Id} onChange={(e) => setSel(cat, { sabor1Id: e.target.value })} style={styles.selectInput}>
                  {lista.map((p) => <option key={p.id} value={p.id}>{p.nome} ({brl(p.preco)})</option>)}
                </select>
                {pizza && (
                  <>
                    <div style={styles.fieldLabel}>Sabor 2 (Opcional):</div>
                    <select value={sel.sabor2Id} onChange={(e) => setSel(cat, { sabor2Id: e.target.value })} style={styles.selectInput}>
                      <option value="inteira">-- Inteira --</option>
                      {lista.filter((p) => p.id !== sel.sabor1Id).map((p) => <option key={p.id} value={p.id}>{p.nome} ({brl(p.preco)})</option>)}
                    </select>
                    <div style={styles.fieldLabel}>Borda:</div>
                    <select value={sel.bordaId} onChange={(e) => setSel(cat, { bordaId: e.target.value })} style={styles.selectInput}>
                      {bordas.map((b) => <option key={b.id} value={b.id}>{b.nome} {b.preco > 0 ? `(+${brl(b.preco)})` : "(Grátis)"}</option>)}
                    </select>
                  </>
                )}
                <div style={styles.fieldLabel}>Observação{pizza ? " da Pizza" : ""}:</div>
                <input value={sel.obs} onChange={(e) => setSel(cat, { obs: e.target.value })} placeholder="Ex: Sem cebola, bem assada..." style={styles.textInput} />
                <button style={styles.btnAdicionar} onClick={() => adicionar(cat)}>+ ADICIONAR {cat.toUpperCase().replace(/S$/, "")}</button>
              </div>
            );
          })
        )}
        <div style={styles.carrinhoBox}>
          <div style={styles.carrinhoTitulo}>🛒 Seu Pedido:</div>
          <div style={styles.carrinhoDivider} />
          {carrinho.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", padding: "8px 0" }}>Nenhum item adicionado ainda.</div>
          ) : (
            carrinho.map((i) => (
              <div key={i.key} style={styles.carrinhoItem}>
                <div>
                  <div style={styles.carrinhoItemNome}>{i.nome}</div>
                  {i.borda && <div style={styles.carrinhoItemSub}>Borda: {i.borda}</div>}
                  {i.obs && <div style={styles.carrinhoItemSub}>Obs: {i.obs}</div>}
                  <button style={styles.removerLink} onClick={() => setCarrinho((c) => c.filter((x) => x.key !== i.key))}>remover</button>
                </div>
                <div style={styles.carrinhoItemPreco}>{brl(i.total)}</div>
              </div>
            ))
          )}
          <div style={styles.totalGeralRow}><span>Total Geral:</span><span style={styles.totalGeralValor}>{brl(totalGeral)}</span></div>
        </div>
        <FinalizarEntrega config={config} bairros={bairros} carrinho={carrinho} totalGeral={totalGeral} enviando={enviando} setEnviando={setEnviando}
          onPedidoEnviado={() => { setCarrinho([]); mostrarToast("Pedido enviado! 🎉"); }} />
      </div>
      <button style={styles.adminLink} onClick={irParaAdmin}>admin</button>
    </div>
  );
}

/* ── Finalizar Entrega ── */
function FinalizarEntrega({ config, bairros, carrinho, totalGeral, enviando, setEnviando, onPedidoEnviado }) {
  const [nome, setNome] = useState("");
  const [bairroId, setBairroId] = useState(bairros[0]?.id || "");
  const [rua, setRua] = useState("");
  const [complemento, setComplemento] = useState("");
  const [obsGeral, setObsGeral] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [erros, setErros] = useState({});

  const bairroSel = bairros.find((b) => b.id === bairroId);
  const taxa = bairroSel ? bairroSel.taxa : 0;
  const totalComTaxa = totalGeral + taxa;

  function validar() {
    const e = {};
    if (!nome.trim()) e.nome = true;
    if (!bairroId) e.bairro = true;
    if (!rua.trim()) e.rua = true;
    if (carrinho.length === 0) e.carrinho = true;
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function enviar() {
    if (!validar() || enviando) return;
    setEnviando(true);
    let msg = `🍕 *Novo pedido – ${config.nomeLoja}*\n\n*Cliente:* ${nome}\n*Bairro:* ${bairroSel ? bairroSel.nome : "-"}\n*Endereço:* ${rua}${complemento ? " - " + complemento : ""}\n\n*Itens:*\n`;
    carrinho.forEach((i) => { msg += `• ${i.nome}${i.borda ? ` (Borda: ${i.borda})` : ""} — ${brl(i.total)}\n`; if (i.obs) msg += `   _Obs: ${i.obs}_\n`; });
    if (obsGeral.trim()) msg += `\n*Obs gerais:* ${obsGeral.trim()}\n`;
    msg += `\n*Subtotal:* ${brl(totalGeral)}\n*Taxa (${bairroSel?.nome || "-"}):* ${brl(taxa)}\n*Total:* ${brl(totalComTaxa)}\n\n*Pagamento:* ${pagamento}`;
    try {
      const pedidoId = uid();
      await saveData(PEDIDOS_PREFIX + pedidoId, { id: pedidoId, nome, bairro: bairroSel?.nome || "", rua, complemento, itens: carrinho, subtotal: totalGeral, taxa, total: totalComTaxa, pagamento, obsGeral, data: new Date().toISOString() });
      const indice = await loadData(PEDIDOS_INDEX_KEY, []);
      await saveData(PEDIDOS_INDEX_KEY, [...(indice || []), pedidoId]);
    } catch { /* segue */ }
    const numero = (config.whatsapp || "").replace(/\D/g, "") || "5512991119914";
    window.open(numero ? `https://wa.me/${numero}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    setEnviando(false);
    onPedidoEnviado();
    setNome(""); setRua(""); setComplemento(""); setObsGeral("");
  }

  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionBar} /><span style={styles.sectionIcon}>📍</span>
        <span style={styles.sectionTitle}>FINALIZAR ENTREGA</span>
      </div>
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu Nome" style={{ ...styles.textInput, ...(erros.nome ? styles.inputErro : {}) }} />
      <div style={styles.fieldLabel}>Bairro:</div>
      <select value={bairroId} onChange={(e) => setBairroId(e.target.value)} style={{ ...styles.selectInput, ...(erros.bairro ? styles.inputErro : {}) }}>
        <option value="">-- Selecione seu Bairro --</option>
        {bairros.map((b) => <option key={b.id} value={b.id}>{b.nome} (taxa {brl(b.taxa)})</option>)}
      </select>
      <input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua e Número" style={{ ...styles.textInput, ...(erros.rua ? styles.inputErro : {}) }} />
      <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento (Apt, Bloco, Fundos...)" style={styles.textInput} />
      <textarea value={obsGeral} onChange={(e) => setObsGeral(e.target.value)} placeholder="Observações Gerais do Pedido..." style={{ ...styles.textInput, minHeight: 64, resize: "none" }} />
      <div style={styles.fieldLabel}>Forma de Pagamento:</div>
      <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} style={styles.selectInput}>
        <option value="Pix">Pix</option><option value="Cartão">Cartão</option><option value="Dinheiro">Dinheiro</option>
      </select>
      <div style={styles.totalBoxFinal}>Total Geral: <strong>{brl(totalComTaxa)}</strong></div>
      {erros.carrinho && <div style={{ ...styles.erroCampo, textAlign: "center", marginBottom: 8 }}>Adicione pelo menos um item.</div>}
      <button style={{ ...styles.btnEnviarPedido, ...(enviando ? styles.btnDisabledGreen : {}) }} onClick={enviar} disabled={enviando}>
        {enviando ? "Enviando..." : "✅ ENVIAR PEDIDO PELO WHATSAPP"}
      </button>
    </div>
  );
}

/* ── Login Admin ── */
function TelaLoginAdmin({ senhaCorreta, onEntrar, onVoltar }) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState(false);
  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>🔒</div>
        <div style={styles.loginTitle}>Painel Admin</div>
        <div style={styles.loginSub}>Digite a senha para gerenciar o cardápio.</div>
        <input type="password" value={valor} onChange={(e) => { setValor(e.target.value); setErro(false); }} onKeyDown={(e) => e.key === "Enter" && (valor === senhaCorreta ? onEntrar() : setErro(true))} placeholder="Senha" style={{ ...styles.textInput, marginTop: 16, textAlign: "center" }} autoFocus />
        {erro && <div style={{ ...styles.erroCampo, textAlign: "center", marginTop: 6 }}>Senha incorreta.</div>}
        <button style={{ ...styles.btn, marginTop: 16 }} onClick={() => valor === senhaCorreta ? onEntrar() : setErro(true)}>Entrar</button>
        <button style={styles.btnLink} onClick={onVoltar}>← Voltar ao cardápio</button>
      </div>
    </div>
  );
}

/* ── Tela Admin ── */
function TelaAdmin({ config, produtos, bordas, bairros, setConfig, setProdutos, setBordas, setBairros, mostrarToast, onVoltarCardapio }) {
  const [aba, setAba] = useState("produtos");
  return (
    <div style={styles.pageWrap}>
      <div style={styles.headerAdmin}>
        <div style={styles.headerAdminRow}>
          <div style={styles.logoCircleAdmin}>🍕</div>
          <div style={{ flex: 1 }}><div style={styles.adminTitulo}>Painel Admin</div><div style={styles.adminSub}>Cardápio Digital</div></div>
          <button style={styles.btnSecSmall} onClick={onVoltarCardapio}>Ver cardápio</button>
        </div>
        <div style={styles.adminNav}>
          {[{ id: "produtos", label: "🍕 Produtos" }, { id: "bordas", label: "🧀 Bordas" }, { id: "bairros", label: "📍 Bairros" }, { id: "pedidos", label: "📋 Pedidos" }, { id: "config", label: "⚙️ Config" }].map((t) => (
            <button key={t.id} onClick={() => setAba(t.id)} style={{ ...styles.adminNavBtn, ...(aba === t.id ? styles.adminNavBtnActive : {}) }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={styles.main}>
        {aba === "produtos" && <AbaProdutos produtos={produtos} setProdutos={setProdutos} mostrarToast={mostrarToast} />}
        {aba === "bordas" && <AbaListaSimples titulo="Bordas de Pizza" itens={bordas} setItens={setBordas} mostrarToast={mostrarToast} campoValor="preco" labelValor="Preço adicional (R$)" placeholderNome="Ex: Catupiry, Cheddar..." permitirZero />}
        {aba === "bairros" && <AbaListaSimples titulo="Bairros Atendidos" itens={bairros} setItens={setBairros} mostrarToast={mostrarToast} campoValor="taxa" labelValor="Taxa de entrega (R$)" placeholderNome="Ex: Centro, Crispim..." permitirZero />}
        {aba === "pedidos" && <AbaPedidos mostrarToast={mostrarToast} />}
        {aba === "config" && <AbaConfig config={config} setConfig={setConfig} mostrarToast={mostrarToast} />}
      </div>
    </div>
  );
}

/* ── Aba Pedidos ── */
function AbaPedidos({ mostrarToast }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [limpando, setLimpando] = useState(false);

  const carregarPedidos = useCallback(async () => {
    setCarregando(true);
    const indice = await loadData(PEDIDOS_INDEX_KEY, []);
    const lista = await Promise.all((indice || []).map((id) => loadData(PEDIDOS_PREFIX + id, null)));
    setPedidos(lista.filter(Boolean).sort((a, b) => new Date(b.data) - new Date(a.data)));
    setCarregando(false);
  }, []);

  useEffect(() => { carregarPedidos(); }, [carregarPedidos]);

 function imprimirPedido(p) {
  const fontSize = config.fontImpressao || 13;
  const data = new Date(p.data).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const itens = (p.itens || []).map((i) =>
    `• ${i.nome}${i.borda ? ` (Borda: ${i.borda})` : ""}${i.obs ? ` — Obs: ${i.obs}` : ""} ... ${brl(i.total)}`
  ).join("\n");

  const html = `<html><head><title>Pedido</title>
    <style>body{font-family:monospace;font-size:${fontSize}px;padding:16px;max-width:380px;margin:0 auto}hr{border:none;border-top:1px dashed #999;margin:10px 0}.row{display:flex;justify-content:space-between}.total{font-weight:bold}</style>
    </head><body>
    <h2 style="text-align:center">🍕 PIZZARIA OLIVEIRA</h2>
    <div style="text-align:center;color:#555">${data}</div>
    <hr/><div><b>Cliente:</b> ${p.nome}</div>
    <div><b>Bairro:</b> ${p.bairro}</div>
    <div><b>Endereço:</b> ${p.rua}${p.complemento ? ` — ${p.complemento}` : ""}</div>
    <div><b>Pagamento:</b> ${p.pagamento}</div>
    <hr/><div><b>Itens:</b></div>
    <pre style="font-size:${fontSize}px">${itens}</pre>
    <hr/>
    <div class="row"><span>Subtotal</span><span>${brl(p.subtotal)}</span></div>
    <div class="row"><span>Taxa (${p.bairro})</span><span>${brl(p.taxa)}</span></div>
    <div class="row total"><span>TOTAL</span><span>${brl(p.total)}</span></div>
    ${p.obsGeral ? `<hr/><div><b>Obs:</b> ${p.obsGeral}</div>` : ""}
    <hr/><div style="text-align:center">Obrigado! 🍕</div>
    </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedido-${p.nome}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
} 

  return (
    <div>
      <h2 style={styles.h2}>Pedidos Recebidos <button style={{ ...styles.btnSecSmall, marginLeft: "auto" }} onClick={carregarPedidos}>⟳ Atualizar</button></h2>
      <p style={styles.hint}>Pedidos de todos os clientes que acessarem o link aparecem aqui.</p>
      {carregando ? <div style={styles.emptyState}>Carregando...</div> : pedidos.length === 0 ? <div style={styles.emptyState}>📋 Nenhum pedido ainda.</div> : (
        <>
          {pedidos.map((p) => {
            const data = new Date(p.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
            return (
              <div key={p.id} style={styles.pedidoCard}>
                <div style={styles.pedidoTop}><span style={styles.pedidoNome}>{p.nome}</span><span style={styles.pedidoData}>{data}</span></div>
                <div style={styles.pedidoDetail}>📍 {p.bairro} — {p.rua} {p.complemento ? `(${p.complemento})` : ""}<br />🍕 {(p.itens || []).map((i) => i.nome).join(", ")}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={styles.pedidoTag}>💳 {p.pagamento}</span>
                  <span style={styles.pedidoTotal}>{brl(p.total)}</span>
                </div>
                <button style={styles.btnImprimir} onClick={() => imprimirPedido(p)}>🖨️ Imprimir</button>
              </div>
            );
          })}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #2a2a2a" }}>
            <button style={styles.btnOutline} onClick={() => setLimpando(true)}>🗑️ Limpar histórico</button>
          </div>
        </>
      )}
      {limpando && <ModalConfirm titulo="⚠️ Limpar histórico?" texto="Os pedidos serão apagados permanentemente." onCancelar={() => setLimpando(false)} onConfirmar={limparTudo} textoConfirmar="Apagar" />}
    </div>
  );

/* ── Aba Config ── */
function AbaConfig({ config, setConfig, mostrarToast }) {
  const [nomeLoja, setNomeLoja] = useState(config.nomeLoja);
  const [cidade, setCidade] = useState(config.cidade || "");
  const [telefone, setTelefone] = useState(config.telefone || "");
  const [aberto, setAberto] = useState(config.aberto !== false);
  const [tempo, setTempo] = useState(config.tempoEntrega || "40–60 min");
  const [whatsapp, setWhatsapp] = useState(config.whatsapp || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [fontImpressao, setFontImpressao] = useState(String(config.fontImpressao || 13));
  const numeroLimpo = whatsapp.replace(/\D/g, "");

  async function salvar() {
    let senhaFinal = config.senhaAdmin;
    if (novaSenha.trim()) {
      if (senhaAtual !== config.senhaAdmin) { mostrarToast("⚠️ Senha atual incorreta."); return; }
      senhaFinal = novaSenha.trim();
    }
    await setConfig({ ...config, nomeLoja: nomeLoja.trim() || "Pizzaria Oliveira",
  cidade: cidade.trim(), telefone: telefone.trim(), aberto,
  tempoEntrega: tempo.trim() || "40–60 min", whatsapp: numeroLimpo,
  fontImpressao: parseInt(fontImpressao) || 13,
  senhaAdmin: senhaFinal });
    setSenhaAtual(""); setNovaSenha("");
    mostrarToast("✅ Configurações salvas!");
  }

  return (
    <div>
      <h2 style={styles.h2}>Configurações da Loja</h2>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Identidade</div>
        <div style={{ marginBottom: 12 }}><label style={styles.label}>Nome da pizzaria</label><input value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} style={styles.input} /></div>
        <div style={styles.formGrid2}>
          <div><label style={styles.label}>Cidade</label><input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Pinda-SP" style={styles.input} /></div>
          <div><label style={styles.label}>Telefone</label><input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(12) 99111-9914" style={styles.input} /></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <Switch checked={aberto} onChange={() => setAberto((a) => !a)} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>Loja aberta para pedidos</span>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Entrega</div>
        <label style={styles.label}>Tempo estimado</label>
        <input value={tempo} onChange={(e) => setTempo(e.target.value)} style={styles.input} />
        <p style={styles.hint}>Taxa de entrega definida por bairro em <strong>📍 Bairros</strong>.</p>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>WhatsApp para receber pedidos</div>
        <label style={styles.label}>Número (com DDD e código do país)</label>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 5512991119914" inputMode="tel" style={styles.input} />
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>Apenas números: código do país (55) + DDD + número.</p>
        {numeroLimpo.length >= 10 && <div style={styles.linkPreview}>📲 Pedidos para: <strong>+{numeroLimpo}</strong></div>}
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Senha do painel admin</div>
        <div style={{ marginBottom: 12 }}><label style={styles.label}>Senha atual</label><input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Confirme a senha atual" style={styles.input} /></div>
        <div><label style={styles.label}>Nova senha (deixe vazio para manter)</label><input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha" style={styles.input} /></div>
      </div>
<div style={styles.card}>
  <div style={styles.cardTitle}>🖨️ Impressão</div>
  <label style={styles.label}>Tamanho da fonte (px)</label>
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
    <input type="range" min="10" max="22" value={fontImpressao}
      onChange={(e) => setFontImpressao(e.target.value)} style={{ flex: 1 }} />
    <span style={{ fontSize: 15, fontWeight: 700, color: "#2ecc40", minWidth: 36 }}>
      {fontImpressao}px
    </span>
  </div>
  <div style={{ marginTop: 10, background: "#161616", borderRadius: 10, padding: "12px 14px", fontSize: parseInt(fontImpressao), color: "#f0f0f0", lineHeight: 1.6 }}>
    <div>🍕 <strong>Pizzaria Oliveira</strong></div>
    <div>• 1x Calabresa — R$ 39,90</div>
    <div><strong>Total: R$ 44,90</strong></div>
  </div>
</div><div style={styles.card}>
  <div style={styles.cardTitle}>🖨️ Impressão</div>
  <label style={styles.label}>Tamanho da fonte (px)</label>
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
    <input type="range" min="10" max="22" value={fontImpressao}
      onChange={(e) => setFontImpressao(e.target.value)} style={{ flex: 1 }} />
    <span style={{ fontSize: 15, fontWeight: 700, color: "#2ecc40", minWidth: 36 }}>
      {fontImpressao}px
    </span>
  </div>
</div>
      <button style={styles.btn} onClick={salvar}>Salvar configurações</button>
    </div>
  );
}
