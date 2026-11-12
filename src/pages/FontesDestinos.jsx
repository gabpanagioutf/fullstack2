import React, { useState } from "react";

export default function FontesDestinos() {
    const [fontes, setFontes] = useState([
        { id: 1, nome: "Salário", tipo: "renda" },
        { id: 2, nome: "Conta corrente", tipo: "conta" },
        {
            id: 3,
            nome: "Cartão Nubank",
            tipo: "cartao_credito",
            diaFechamento: 3,
            diaVencimento: 10,
            limite: 3000,
        },
    ]);

    const [nome, setNome] = useState("");
    const [tipo, setTipo] = useState("conta");
    const [diaFechamento, setDiaFechamento] = useState("");
    const [diaVencimento, setDiaVencimento] = useState("");
    const [limite, setLimite] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const [erro, setErro] = useState("");

    const formatarMoeda = (valor) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);

    const tipos = {
        renda: "Fonte de renda",
        conta: "Conta",
        cartao_credito: "Cartão de crédito",
    };

    function limparFormulario() {
        setNome("");
        setTipo("conta");
        setDiaFechamento("");
        setDiaVencimento("");
        setLimite("");
        setEditandoId(null);
        setErro("");
    }

    function salvar(e) {
        e.preventDefault();
        const nomeLimpo = nome.trim();

        if (!nomeLimpo) {
            setErro("Informe o nome.");
            return;
        }

        const duplicado = fontes.some(
            (fonte) =>
                fonte.id !== editandoId &&
                fonte.nome.toLowerCase() === nomeLimpo.toLowerCase()
        );

        if (duplicado) {
            setErro("Já existe uma fonte ou destino com esse nome.");
            return;
        }

        if (tipo === "cartao_credito") {
            const fechamento = Number(diaFechamento);
            const vencimento = Number(diaVencimento);
            const valorLimite = Number(limite);

            if (
                !diaFechamento ||
                !diaVencimento ||
                !limite ||
                !Number.isInteger(fechamento) ||
                !Number.isInteger(vencimento) ||
                fechamento < 1 ||
                fechamento > 31 ||
                vencimento < 1 ||
                vencimento > 31 ||
                !Number.isFinite(valorLimite) ||
                valorLimite < 0
            ) {
                setErro("Preencha corretamente os dados do cartão.");
                return;
            }
        }

        const dados = {
            id: editandoId ?? Date.now(),
            nome: nomeLimpo,
            tipo,
            ...(tipo === "cartao_credito"
                ? {
                    diaFechamento: Number(diaFechamento),
                    diaVencimento: Number(diaVencimento),
                    limite: Number(limite),
                }
                : {}),
        };

        if (editandoId !== null) {
            setFontes(fontes.map((f) => (f.id === editandoId ? dados : f)));
        } else {
            setFontes([...fontes, dados]);
        }

        limparFormulario();
    }

    function editar(fonte) {
        setEditandoId(fonte.id);
        setNome(fonte.nome);
        setTipo(fonte.tipo);
        setDiaFechamento(fonte.diaFechamento ?? "");
        setDiaVencimento(fonte.diaVencimento ?? "");
        setLimite(fonte.limite ?? "");
        setErro("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function excluir(id) {
        if (!window.confirm("Deseja excluir este item?")) return;

        setFontes(fontes.filter((f) => f.id !== id));

        if (editandoId === id) limparFormulario();
    }

    return (
        <div style={styles.pagina}>
            <div style={styles.container}>
                <header style={styles.cabecalho}>
                    <h1 style={styles.titulo}>Fontes e Destinos</h1>
                    <p style={styles.subtitulo}>
                        Gerencie suas fontes de renda, contas e cartões de crédito.
                    </p>
                </header>

                <div style={styles.resumo}>
                    <div style={styles.cardResumo}>
                        <span>Fontes de renda</span>
                        <strong style={styles.numero}>
                            {fontes.filter((f) => f.tipo === "renda").length}
                        </strong>
                    </div>

                    <div style={styles.cardResumo}>
                        <span>Contas</span>
                        <strong style={styles.numero}>
                            {fontes.filter((f) => f.tipo === "conta").length}
                        </strong>
                    </div>

                    <div style={styles.cardResumo}>
                        <span>Cartões de crédito</span>
                        <strong style={styles.numero}>
                            {fontes.filter((f) => f.tipo === "cartao_credito").length}
                        </strong>
                    </div>
                </div>

                <section style={styles.card}>
                    <h2 style={styles.secaoTitulo}>
                        {editandoId !== null
                            ? "Editar fonte ou destino"
                            : "Adicionar fonte ou destino"}
                    </h2>

                    <form onSubmit={salvar} style={styles.formulario}>
                        <label style={styles.label} htmlFor="nome-fonte">
                            Nome
                        </label>
                        <input
                            id="nome-fonte"
                            style={styles.input}
                            type="text"
                            maxLength={60}
                            placeholder="Ex.: Conta corrente"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />

                        <label style={styles.label} htmlFor="tipo-fonte">
                            Tipo
                        </label>
                        <select
                            id="tipo-fonte"
                            style={styles.input}
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <option value="renda">Fonte de renda</option>
                            <option value="conta">Conta</option>
                            <option value="cartao_credito">Cartão de crédito</option>
                        </select>

                        {tipo === "cartao_credito" && (
                            <>
                                <label style={styles.label} htmlFor="fechamento">
                                    Dia do fechamento
                                </label>
                                <input
                                    id="fechamento"
                                    style={styles.input}
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={diaFechamento}
                                    onChange={(e) => setDiaFechamento(e.target.value)}
                                    placeholder="Ex.: 3"
                                />

                                <label style={styles.label} htmlFor="vencimento">
                                    Dia do vencimento
                                </label>
                                <input
                                    id="vencimento"
                                    style={styles.input}
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={diaVencimento}
                                    onChange={(e) => setDiaVencimento(e.target.value)}
                                    placeholder="Ex.: 10"
                                />

                                <label style={styles.label} htmlFor="limite">
                                    Limite do cartão (R$)
                                </label>
                                <input
                                    id="limite"
                                    style={styles.input}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={limite}
                                    onChange={(e) => setLimite(e.target.value)}
                                    placeholder="Ex.: 3000"
                                />
                            </>
                        )}

                        {erro && <p style={styles.erro}>{erro}</p>}

                        <div style={styles.acoes}>
                            <button type="submit" style={styles.botao}>
                                {editandoId !== null
                                    ? "Salvar alterações"
                                    : "Adicionar"}
                            </button>

                            {editandoId !== null && (
                                <button
                                    type="button"
                                    style={styles.botaoSecundario}
                                    onClick={limparFormulario}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section style={styles.card}>
                    <h2 style={styles.secaoTitulo}>
                        Fontes e destinos cadastrados
                    </h2>

                    {fontes.length === 0 ? (
                        <p style={styles.subtitulo}>
                            Nenhuma fonte ou destino cadastrado.
                        </p>
                    ) : (
                        <div style={styles.lista}>
                            {fontes.map((fonte) => (
                                <div key={fonte.id} style={styles.item}>
                                    <div style={styles.itemInfo}>
                                        <strong style={styles.itemNome}>
                                            {fonte.nome}
                                        </strong>

                                        <span style={styles.itemTipo}>
                                            {tipos[fonte.tipo]}
                                        </span>

                                        {fonte.tipo === "cartao_credito" && (
                                            <span style={styles.detalhes}>
                                                Fechamento: dia {fonte.diaFechamento}
                                                {" | "}
                                                Vencimento: dia {fonte.diaVencimento}
                                                {" | "}
                                                Limite: {formatarMoeda(fonte.limite)}
                                            </span>
                                        )}
                                    </div>

                                    <div style={styles.acoes}>
                                        <button
                                            type="button"
                                            style={styles.botao}
                                            onClick={() => editar(fonte)}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            style={styles.botaoExcluir}
                                            onClick={() => excluir(fonte.id)}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

const styles = {
    pagina: {
        minHeight: "100vh",
        backgroundColor: "#f4f4f9",
        fontFamily: "Arial, sans-serif",
        padding: "30px 16px",
        boxSizing: "border-box",
        color: "#333",
    },
    container: {
        maxWidth: "950px",
        margin: "0 auto",
    },
    cabecalho: {
        marginBottom: "25px",
    },
    titulo: {
        fontSize: "30px",
        marginBottom: "8px",
    },
    subtitulo: {
        color: "#666",
        fontSize: "14px",
    },
    resumo: {
        display: "flex",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px",
    },
    cardResumo: {
        flex: "1 1 180px",
        backgroundColor: "#fff",
        padding: "22px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    numero: {
        fontSize: "30px",
        color: "#4CAF50",
    },
    card: {
        backgroundColor: "#fff",
        padding: "25px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        marginBottom: "25px",
    },
    secaoTitulo: {
        fontSize: "20px",
        marginTop: 0,
        marginBottom: "22px",
    },
    formulario: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    label: {
        fontSize: "14px",
        fontWeight: "bold",
    },
    input: {
        padding: "12px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "15px",
        backgroundColor: "#fff",
        color: "#333",
        boxSizing: "border-box",
        width: "100%",
    },
    acoes: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginTop: "10px",
    },
    botao: {
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        padding: "11px 18px",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    botaoSecundario: {
        backgroundColor: "#777",
        color: "#fff",
        border: "none",
        padding: "11px 18px",
        borderRadius: "4px",
        cursor: "pointer",
    },
    botaoExcluir: {
        backgroundColor: "#e74c3c",
        color: "#fff",
        border: "none",
        padding: "11px 18px",
        borderRadius: "4px",
        cursor: "pointer",
    },
    erro: {
        color: "#dc2626",
        fontSize: "14px",
    },
    lista: {
        display: "flex",
        flexDirection: "column",
    },
    item: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        padding: "18px 0",
        borderBottom: "1px solid #eee",
    },
    itemInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        flex: "1 1 250px",
    },
    itemNome: {
        fontSize: "16px",
    },
    itemTipo: {
        fontSize: "13px",
        color: "#4CAF50",
    },
    detalhes: {
        fontSize: "13px",
        color: "#666",
        lineHeight: "1.6",
    },
};