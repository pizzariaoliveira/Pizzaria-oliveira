import { useState, useRef } from "react";
import { uploadFotoProduto } from "./supabaseClient";
import { brl, uid } from "./constants";
import { styles } from "./styles";
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