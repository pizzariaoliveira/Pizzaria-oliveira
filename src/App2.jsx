import { useState, useRef } from "react";
import { uploadFotoProduto } from "./supabaseClient";
import { brl, uid, styles } from "./constants";

/* ───── Switch ───── */
export function Switch({ checked, onChange }) {
  return (
    <label style={styles.switch}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ ...styles.slider, background: checked ? "#2ecc40" : "#3a3a3a" }}>
        <span style={{ ...styles.sliderDot, transform: checked ? "translateX(18px)" : "translateX(0)" }} />
      </span>
    </label>
  );
}

/* ───── Modal Confirmação ───── */
export function ModalConfirm({ titulo, texto, onCancelar, onConfirmar, textoConfirmar }) {
  return (
    <div style={styles.modalBg} onClick={onCancelar}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h4 style={styles.modalTitulo}>{titulo}</h4>
        <p style={styles.modalTexto}>{texto}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={styles.modalBtnCancelar} onClick={onCancelar}>Cancelar</button>
          <button style={styles.modalBtnConfirmar} onClick={onConfirmar}>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  );
}

/* ───── Aba Produtos ───── */
export function AbaProdutos({ produtos, setProdutos, mostrarToast }) {
  const [editId, setEditId] = useState(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponivel, setDisponivel] = useState(true);
  const [foto, setFoto] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);
  const [limpandoTudo, setLimpandoTudo] = useState(false);
  const fileInputRef = useRef(null);

  const categoriasExistentes = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];

  function limparForm() {
    setEditId(null); setNome(""); setDescricao(""); setPreco("");
    setCategoria(""); setDisponivel(true); setFoto(null);
  }

  async function selecionarFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { mostrarToast("⚠️ Foto muito grande. Máximo 5MB."); return; }
    setEnviandoFoto(true);
    const url = await uploadFotoProduto(file);
    setEnviandoFoto(false);
    if (url) { setFoto(url); mostrarToast("✅ Foto enviada!"); }
    else mostrarToast("⚠️ Erro ao enviar foto. Tente novamente.");
  }

  function salvar() {
    const precoNum = parseFloat(preco);
    if (!nome.trim()) { mostrarToast("⚠️ Informe o nome do item."); return; }
    if (isNaN(precoNum) || precoNum <= 0) { mostrarToast("⚠️ Informe um preço válido."); return; }
    const catFinal = categoria.trim() || "Pizzas";
    if (editId) {
      setProdutos(produtos.map((p) =>
        p.id === editId ? { ...p, nome: nome.trim(), descricao: descricao.trim(), preco: precoNum, categoria: catFinal, disponivel, foto } : p
      ));
      mostrarToast("✅ Produto atualizado!");
    } else {
      setProdutos([...produtos, { id: uid(), nome: nome.trim(), descricao: descricao.trim(), preco: precoNum, categoria: catFinal, disponivel, foto }]);
      mostrarToast("✅ Produto adicionado!");
    }
    limparForm();
  }

  function editar(p) {
    setEditId(p.id); setNome(p.nome); setDescricao(p.descricao || "");
    setPreco(String(p.preco)); setCategoria(p.categoria || "");
    setDisponivel(p.disponivel !== false); setFoto(p.foto || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDisponivel(id) {
    const prod = produtos.find((p) => p.id === id);
    if (!prod) return;
    setProdutos(produtos.map((p) => (p.id === id ? { ...p, disponivel: !p.disponivel } : p)));
    mostrarToast(prod.disponivel === false ? "✅ Disponível" : "⏸️ Pausado");
  }

  const produtoParaRemover = produtos.find((p) => p.id === removendoId);
  const ordenado = [...produtos].sort(
    (a, b) => (a.categoria || "").localeCompare(b.categoria || "", "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR")
  );

  return (
    <div>
      <h2 style={styles.h2}>Produtos do Cardápio</h2>
      <p style={styles.hint}>A <strong>categoria</strong> define em qual seção o item aparece. Adicione uma foto para ela aparecer no cardápio.</p>

      <div style={styles.card}>
        <div style={styles.cardTitle}>{editId ? "Editar Produto" : "Novo Produto"}</div>
        <div style={{ marginBottom: 14 }}>
          <label style={styles.label}>Foto do produto</label>
          <div style={styles.fotoUploadBox} onClick={() => fileInputRef.current?.click()}>
            {enviandoFoto ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Enviando...</div>
            ) : foto ? (
              <img src={foto} alt="Preview" style={styles.fotoUploadPreview} />
            ) : (
              <div style={{ textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 24 }}>📷</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Toque para adicionar foto</div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={selecionarFoto} style={{ display: "none" }} />
          {foto && <button style={{ ...styles.btnSecSmall, marginTop: 8 }} onClick={() => setFoto(null)}>Remover foto</button>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={styles.label}>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Margherita, Coca 2L..." style={styles.input} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={styles.label}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Mussarela, tomate fresco, manjericão" style={{ ...styles.input, minHeight: 54, resize: "vertical" }} />
        </div>
        <div style={styles.formGrid2}>
          <div>
            <label style={styles.label}>Preço (R$)</label>
            <input type="number" inputMode="decimal" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Categoria</label>
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Pizzas, Bebidas" list="cat-sugestoes" style={styles.input} />
            <datalist id="cat-sugestoes">{categoriasExistentes.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <Switch checked={disponivel} onChange={() => setDisponivel((d) => !d)} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>Disponível no cardápio</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button style={styles.btn} onClick={salvar}>{editId ? "Salvar Alterações" : "+ Adicionar Produto"}</button>
          {editId && <button style={{ ...styles.btnSec, width: "auto" }} onClick={limparForm}>Cancelar</button>}
        </div>
      </div>

      <h3 style={styles.h3}>Itens cadastrados ({produtos.length})</h3>
      {produtos.length === 0 ? (
        <div style={styles.emptyState}>🍕 Nenhum produto cadastrado ainda.</div>
      ) : (
        ordenado.map((p) => (
          <div key={p.id} style={{ ...styles.prodItem, ...(p.disponivel === false ? styles.prodItemPausado : {}) }}>
            <div style={styles.prodTop}>
              {p.foto && <img src={p.foto} alt={p.nome} style={styles.prodThumb} />}
              <div style={{ flex: 1 }}>
                <span style={styles.prodNome}>{p.nome}</span>
                <span style={styles.prodCatTag}>{p.categoria || "Pizzas"}</span>
                <div style={styles.prodDesc}>{p.descricao || "Sem descrição."}</div>
              </div>
              <div style={styles.prodPreco}>{brl(p.preco)}</div>
            </div>
            <div style={styles.prodActions}>
              <button style={styles.btnSecSmall} onClick={() => editar(p)}>✏️ Editar</button>
              <button style={styles.btnDanger} onClick={() => setRemovendoId(p.id)}>Remover</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
                <span>{p.disponivel === false ? "Pausado" : "Ativo"}</span>
                <Switch checked={p.disponivel !== false} onChange={() => toggleDisponivel(p.id)} />
              </div>
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #2a2a2a" }}>
        <h3 style={styles.h3}>⚠️ Zona de Perigo</h3>
        <button style={styles.btnOutline} onClick={() => setLimpandoTudo(true)}>🗑️ Apagar todos os produtos</button>
      </div>

      {removendoId && produtoParaRemover && (
        <ModalConfirm titulo="🗑️ Remover produto?" texto={`"${produtoParaRemover.nome}" será removido permanentemente.`}
          onCancelar={() => setRemovendoId(null)} onConfirmar={() => { setProdutos(produtos.filter((p) => p.id !== removendoId)); setRemovendoId(null); mostrarToast("🗑️ Removido"); }} textoConfirmar="Remover" />
      )}
      {limpandoTudo && (
        <ModalConfirm titulo="⚠️ Apagar todos os produtos?" texto="Todos os itens serão removidos permanentemente."
          onCancelar={() => setLimpandoTudo(false)} onConfirmar={() => { setProdutos([]); setLimpandoTudo(false); mostrarToast("🗑️ Todos removidos"); }} textoConfirmar="Apagar tudo" />
      )}
    </div>
  );
}

/* ───── Aba Lista Simples (Bordas / Bairros) ───── */
export function AbaListaSimples({ titulo, itens, setItens, mostrarToast, campoValor, labelValor, placeholderNome, permitirZero }) {
  const [editId, setEditId] = useState(null);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [removendoId, setRemovendoId] = useState(null);

  function limparForm() { setEditId(null); setNome(""); setValor(""); }

  function salvar() {
    const num = parseFloat(valor);
    if (!nome.trim()) { mostrarToast("⚠️ Informe o nome."); return; }
    if (isNaN(num) || (!permitirZero && num <= 0) || num < 0) { mostrarToast("⚠️ Informe um valor válido."); return; }
    if (editId) {
      setItens(itens.map((it) => (it.id === editId ? { ...it, nome: nome.trim(), [campoValor]: num } : it)));
      mostrarToast("✅ Atualizado!");
    } else {
      setItens([...itens, { id: uid(), nome: nome.trim(), [campoValor]: num }]);
      mostrarToast("✅ Adicionado!");
    }
    limparForm();
  }

  const itemRemover = itens.find((it) => it.id === removendoId);

  return (
    <div>
      <h2 style={styles.h2}>{titulo}</h2>
      <div style={styles.card}>
        <div style={styles.cardTitle}>{editId ? "Editar" : "Novo"}</div>
        <div style={styles.formGrid2}>
          <div>
            <label style={styles.label}>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={placeholderNome} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>{labelValor}</label>
            <input type="number" inputMode="decimal" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={styles.input} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button style={styles.btn} onClick={salvar}>{editId ? "Salvar" : "+ Adicionar"}</button>
          {editId && <button style={{ ...styles.btnSec, width: "auto" }} onClick={limparForm}>Cancelar</button>}
        </div>
      </div>
      {itens.length === 0 ? (
        <div style={styles.emptyState}>Nenhum item cadastrado ainda.</div>
      ) : (
        itens.map((it) => (
          <div key={it.id} style={styles.prodItem}>
            <div style={styles.prodTop}>
              <span style={styles.prodNome}>{it.nome}</span>
              <div style={styles.prodPreco}>{brl(it[campoValor])}</div>
            </div>
            <div style={styles.prodActions}>
              <button style={styles.btnSecSmall} onClick={() => { setEditId(it.id); setNome(it.nome); setValor(String(it[campoValor])); }}>✏️ Editar</button>
              <button style={styles.btnDanger} onClick={() => setRemovendoId(it.id)}>Remover</button>
            </div>
          </div>
        ))
      )}
      {removendoId && itemRemover && (
        <ModalConfirm titulo="🗑️ Remover?" texto={`"${itemRemover.nome}" será removido permanentemente.`}
          onCancelar={() => setRemovendoId(null)}
          onConfirmar={() => { setItens(itens.filter((it) => it.id !== removendoId)); setRemovendoId(null); mostrarToast("🗑️ Removido"); }}
          textoConfirmar="Remover" />
      )}
    </div>
  );
}
