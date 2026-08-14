import {
  carregarArquivoPdf,
  renderizarPagina,
  baixarPdf,
  baixarPaginasSeparadasZip
} from "../services/pdfService.js";

import { aplicarFaviconDinamico } from "./utils/favicon.js"

const estado = {
  modo: "juntar",
  sources: [],
  paginas: [],
  nextSourceId: 1,
  nextPageId: 1,
  previewPageId: null,
  draggingPageId: null,
  renderToken: 0,
  processando: false
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const arquivoPdf = $("#arquivoPdf");
const dropZone = $("#dropZone");
const listaArquivos = $("#listaArquivos");
const cardControles = $("#cardControles");
const barraExecucao = $("#barraExecucao");
const gradePaginas = $("#gradePaginas");
const resumoPaginas = $("#resumoPaginas");
const detalheExecucao = $("#detalheExecucao");
const statusExecucao = $("#statusExecucao");
const btnExecutar = $("#btnExecutar");
const descricaoModo = $("#descricaoModo");
const controlesDividir = $("#controlesDividir");
const campoPaginas = $("#campoPaginas");
const modalPreview = $("#modalPreview");
const canvasPreview = $("#canvasPreview");

const CONFIG_MODOS = {
  juntar: {
    descricao:
      "Adicione dois ou mais PDFs e organize as páginas na ordem desejada.",
    executar: "Juntar PDFs",
    icone: "fa-link",
    limite: "Você pode adicionar vários PDFs."
  },

  dividir: {
    descricao:
      "Separe todas as páginas ou crie um novo PDF somente com as páginas selecionadas.",
    executar: "Executar divisão",
    icone: "fa-scissors",
    limite: "Selecione um PDF. Um novo arquivo substitui o documento atual."
  },

  rotacionar: {
    descricao:
      "Rotacione páginas individualmente ou em grupo e salve uma nova cópia do PDF.",
    executar: "Salvar PDF",
    icone: "fa-rotate",
    limite: "Selecione um PDF. Um novo arquivo substitui o documento atual."
  }
};

function paginaPorId(id) {
  return estado.paginas.find((pagina) => pagina.id === Number(id));
}

function sourcePorId(id) {
  return estado.sources.find((source) => source.id === Number(id));
}

function nomeBase(nome) {
  return (nome || "documento").replace(/\.pdf$/i, "");
}

function mostrarErro(erro) {
  console.error(erro);

  statusExecucao.textContent =
    "Não foi possível concluir a tarefa.";

  detalheExecucao.textContent =
    erro?.message || "Ocorreu um erro inesperado.";

  alert(
    erro?.message ||
    "Não foi possível concluir a tarefa."
  );
}

function atualizarModoVisual() {
  $$(".modo-pdf").forEach((btn) => {
    btn.classList.toggle(
      "ativo",
      btn.dataset.modo === estado.modo
    );
  });

  const config = CONFIG_MODOS[estado.modo];

  descricaoModo.textContent = config.descricao;

  $("#textoLimite").textContent = config.limite;

  controlesDividir.hidden =
    estado.modo !== "dividir";

  const span = btnExecutar.querySelector("span");

  span.textContent = config.executar;

  const icone = btnExecutar.querySelector("i");

  icone.className =
    `fa-solid ${config.icone}`;

  arquivoPdf.multiple =
    estado.modo === "juntar";

  atualizarResumo();
}

async function trocarModo(novoModo) {
  if (novoModo === estado.modo) {
    return;
  }

  const haviaPaginas =
    estado.paginas.length > 0;

  if (haviaPaginas) {
    const manter = confirm(
      "Ao trocar de ferramenta, deseja manter as páginas já carregadas?\n\n" +
      "Escolha OK para manter ou Cancelar para limpar."
    );

    if (!manter) {
      limparTudo();
    } else if (
      novoModo !== "juntar" &&
      estado.sources.length > 1
    ) {
      alert(
        "Dividir e Rotacionar trabalham com um PDF por vez. " +
        "O documento atual será mantido como composição das páginas já carregadas."
      );
    }
  }

  estado.modo = novoModo;

  atualizarModoVisual();
}

function criarPagina(source, pageIndex) {
  return {
    id: estado.nextPageId++,
    sourceId: source.id,
    pageIndex,
    rotation: 0,
    selected: false
  };
}

async function adicionarArquivos(files) {
  const pdfs = [...files].filter(
    (file) =>
      file.type === "application/pdf" ||
      /\.pdf$/i.test(file.name)
  );

  if (!pdfs.length) {
    alert(
      "Selecione pelo menos um arquivo PDF."
    );

    return;
  }

  let arquivosParaAdicionar = pdfs;

  if (estado.modo !== "juntar") {
    arquivosParaAdicionar = [pdfs[0]];

    limparTudo();
  }

  statusExecucao.textContent =
    "Carregando PDF...";

  detalheExecucao.textContent = "";

  try {
    for (const file of arquivosParaAdicionar) {
      const sourceId =
        estado.nextSourceId++;

      const source =
        await carregarArquivoPdf(
          file,
          sourceId
        );

      estado.sources.push(source);

      for (
        let pageIndex = 0;
        pageIndex < source.pageCount;
        pageIndex++
      ) {
        estado.paginas.push(
          criarPagina(
            source,
            pageIndex
          )
        );
      }
    }

    renderizarTudo();
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    arquivoPdf.value = "";
  }
}

function renderizarListaArquivos() {
  listaArquivos.innerHTML = "";

  if (!estado.sources.length) {
    listaArquivos.hidden = true;

    return;
  }

  listaArquivos.hidden = false;

  estado.sources.forEach((source) => {
    const chip =
      document.createElement("span");

    chip.className = "arquivo-chip";

    chip.innerHTML = `
      <i class="fa-solid fa-file-pdf"></i>

      <span>
        ${escapeHtml(source.name)}
      </span>

      <small>
        ${source.pageCount} pág.
      </small>
    `;

    listaArquivos.appendChild(chip);
  });
}

function escapeHtml(valor = "") {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderizarTudo() {
  renderizarListaArquivos();

  renderizarGrade();

  atualizarResumo();

  const temPaginas =
    estado.paginas.length > 0;

  cardControles.hidden =
    !temPaginas;

  barraExecucao.hidden =
    !temPaginas;
}

async function renderizarGrade() {
  const token =
    ++estado.renderToken;

  gradePaginas.innerHTML = "";

  for (
    let index = 0;
    index < estado.paginas.length;
    index++
  ) {
    const pagina =
      estado.paginas[index];

    const source =
      sourcePorId(pagina.sourceId);

    const card =
      document.createElement("article");

    card.className =
      `pagina-card${pagina.selected ? " selecionada" : ""}`;

    card.draggable = true;

    card.dataset.pageId =
      pagina.id;

    card.innerHTML = `
      <input
        class="pagina-check"
        type="checkbox"
        ${pagina.selected ? "checked" : ""}
        aria-label="Selecionar página ${index + 1}"
      >

      <div
        class="pagina-preview"
        title="Clique para ampliar"
      >
        <canvas></canvas>
      </div>

      <div class="pagina-info">
        <strong>
          Página ${index + 1}
        </strong>

        <small>
          ${escapeHtml(
            source?.name || "PDF"
          )}

          • original ${pagina.pageIndex + 1}
        </small>
      </div>

      <div class="pagina-acoes">
        <button
          class="pagina-acao rotacionar"
          title="Rotacionar 90°"
        >
          <i class="fa-solid fa-rotate-right"></i>
        </button>

        <button
          class="pagina-acao excluir"
          title="Excluir página"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    const checkbox =
      card.querySelector(
        ".pagina-check"
      );

    checkbox.addEventListener(
      "change",
      () => {
        pagina.selected =
          checkbox.checked;

        card.classList.toggle(
          "selecionada",
          pagina.selected
        );

        atualizarResumo();
      }
    );

    card
      .querySelector(
        ".pagina-preview"
      )
      .addEventListener(
        "click",
        () => {
          abrirPreview(
            pagina.id
          );
        }
      );

    card
      .querySelector(
        ".rotacionar"
      )
      .addEventListener(
        "click",
        () => {
          rotacionarPagina(
            pagina.id,
            90
          );
        }
      );

    card
      .querySelector(
        ".excluir"
      )
      .addEventListener(
        "click",
        () => {
          excluirPagina(
            pagina.id
          );
        }
      );

    configurarDragDrop(
      card,
      pagina.id
    );

    gradePaginas.appendChild(
      card
    );

    const canvas =
      card.querySelector(
        "canvas"
      );

    try {
      await renderizarPagina(
        source,
        pagina.pageIndex,
        canvas,
        pagina.rotation,
        145,
        185
      );

      if (
        token !==
        estado.renderToken
      ) {
        return;
      }
    } catch (erro) {
      console.error(
        "Erro ao renderizar miniatura:",
        erro
      );
    }
  }
}

function configurarDragDrop(
  card,
  pageId
) {
  card.addEventListener(
    "dragstart",
    (event) => {
      estado.draggingPageId =
        pageId;

      card.classList.add(
        "arrastando"
      );

      event.dataTransfer.effectAllowed =
        "move";

      event.dataTransfer.setData(
        "text/plain",
        String(pageId)
      );
    }
  );

  card.addEventListener(
    "dragend",
    () => {
      estado.draggingPageId =
        null;

      card.classList.remove(
        "arrastando"
      );

      $$(".pagina-card").forEach(
        (item) =>
          item.classList.remove(
            "alvo-drop"
          )
      );
    }
  );

  card.addEventListener(
    "dragover",
    (event) => {
      event.preventDefault();

      if (
        estado.draggingPageId !==
        pageId
      ) {
        card.classList.add(
          "alvo-drop"
        );
      }
    }
  );

  card.addEventListener(
    "dragleave",
    () => {
      card.classList.remove(
        "alvo-drop"
      );
    }
  );

  card.addEventListener(
    "drop",
    (event) => {
      event.preventDefault();

      card.classList.remove(
        "alvo-drop"
      );

      const origemId =
        Number(
          event.dataTransfer.getData(
            "text/plain"
          )
        ) ||
        estado.draggingPageId;

      moverPagina(
        origemId,
        pageId
      );
    }
  );
}

function moverPagina(
  origemId,
  destinoId
) {
  if (
    !origemId ||
    origemId === destinoId
  ) {
    return;
  }

  const origemIndex =
    estado.paginas.findIndex(
      (pagina) =>
        pagina.id === origemId
    );

  const destinoIndex =
    estado.paginas.findIndex(
      (pagina) =>
        pagina.id === destinoId
    );

  if (
    origemIndex < 0 ||
    destinoIndex < 0
  ) {
    return;
  }

  const [movida] =
    estado.paginas.splice(
      origemIndex,
      1
    );

  const novoDestinoIndex =
    estado.paginas.findIndex(
      (pagina) =>
        pagina.id === destinoId
    );

  estado.paginas.splice(
    novoDestinoIndex,
    0,
    movida
  );

  renderizarTudo();
}

function rotacionarPagina(
  pageId,
  graus
) {
  const pagina =
    paginaPorId(pageId);

  if (!pagina) {
    return;
  }

  pagina.rotation =
    (
      (
        pagina.rotation +
        graus
      ) %
      360 +
      360
    ) %
    360;

  renderizarTudo();

  if (
    estado.previewPageId ===
      pageId &&
    !modalPreview.hidden
  ) {
    renderizarPreview();
  }
}

function excluirPagina(pageId) {
  const index =
    estado.paginas.findIndex(
      (pagina) =>
        pagina.id === pageId
    );

  if (index < 0) {
    return;
  }

  estado.paginas.splice(
    index,
    1
  );

  if (
    estado.previewPageId ===
    pageId
  ) {
    if (
      estado.paginas.length
    ) {
      const nova =
        estado.paginas[
          Math.min(
            index,
            estado.paginas.length - 1
          )
        ];

      estado.previewPageId =
        nova.id;

      renderizarPreview();
    } else {
      fecharPreview();
    }
  }

  removerSourcesSemPaginas();

  renderizarTudo();
}

function removerSourcesSemPaginas() {
  const idsUsados =
    new Set(
      estado.paginas.map(
        (pagina) =>
          pagina.sourceId
      )
    );

  estado.sources =
    estado.sources.filter(
      (source) =>
        idsUsados.has(
          source.id
        )
    );
}

function paginasSelecionadas() {
  return estado.paginas.filter(
    (pagina) =>
      pagina.selected
  );
}

function selecionarTodas(valor) {
  estado.paginas.forEach(
    (pagina) =>
      pagina.selected = valor
  );

  renderizarTudo();
}

function rotacionarSelecionadas(
  graus
) {
  const selecionadas =
    paginasSelecionadas();

  if (!selecionadas.length) {
    alert(
      "Selecione pelo menos uma página."
    );

    return;
  }

  selecionadas.forEach(
    (pagina) => {
      pagina.rotation =
        (
          (
            pagina.rotation +
            graus
          ) %
          360 +
          360
        ) %
        360;
    }
  );

  renderizarTudo();
}

function excluirSelecionadas() {
  const selecionadas =
    paginasSelecionadas();

  if (!selecionadas.length) {
    alert(
      "Selecione pelo menos uma página."
    );

    return;
  }

  if (
    !confirm(
      `Excluir ${selecionadas.length} página(s) da composição atual?`
    )
  ) {
    return;
  }

  const ids =
    new Set(
      selecionadas.map(
        (pagina) =>
          pagina.id
      )
    );

  estado.paginas =
    estado.paginas.filter(
      (pagina) =>
        !ids.has(
          pagina.id
        )
    );

  removerSourcesSemPaginas();

  fecharPreview();

  renderizarTudo();
}

function limparTudo() {
  estado.sources = [];

  estado.paginas = [];

  estado.previewPageId =
    null;

  gradePaginas.innerHTML =
    "";

  listaArquivos.innerHTML =
    "";

  listaArquivos.hidden =
    true;

  cardControles.hidden =
    true;

  barraExecucao.hidden =
    true;

  campoPaginas.value =
    "";

  arquivoPdf.value =
    "";

  statusExecucao.textContent =
    "Pronto para executar.";

  detalheExecucao.textContent =
    "";

  fecharPreview();
}

function atualizarResumo() {
  const total =
    estado.paginas.length;

  const selecionadas =
    paginasSelecionadas().length;

  resumoPaginas.textContent =
    `${total} página${total === 1 ? "" : "s"} • ` +
    `${selecionadas} selecionada${selecionadas === 1 ? "" : "s"}`;

  if (!total) {
    detalheExecucao.textContent =
      "";

    return;
  }

  if (
    estado.modo === "juntar"
  ) {
    detalheExecucao.textContent =
      `${estado.sources.length} arquivo${estado.sources.length === 1 ? "" : "s"} • ` +
      `${total} página${total === 1 ? "" : "s"} no resultado`;
  } else if (
    estado.modo === "rotacionar"
  ) {
    detalheExecucao.textContent =
      `${total} página${total === 1 ? "" : "s"} serão preservadas na nova cópia`;
  } else {
    const tipo =
      $(
        'input[name="tipoDivisao"]:checked'
      )?.value || "todas";

    detalheExecucao.textContent =
      tipo === "todas"
        ? `${total} PDF${total === 1 ? "" : "s"} serão criados dentro de um ZIP`
        : `${selecionadas} página${selecionadas === 1 ? "" : "s"} no novo PDF`;
  }
}

function parseIntervaloPaginas(
  texto,
  total
) {
  const numeros =
    new Set();

  const partes =
    texto
      .split(",")
      .map(
        (parte) =>
          parte.trim()
      )
      .filter(Boolean);

  if (!partes.length) {
    throw new Error(
      "Informe os números das páginas."
    );
  }

  for (
    const parte of partes
  ) {
    if (/^\d+$/.test(parte)) {
      const n =
        Number(parte);

      if (
        n < 1 ||
        n > total
      ) {
        throw new Error(
          `A página ${n} está fora do intervalo de 1 a ${total}.`
        );
      }

      numeros.add(n);

      continue;
    }

    const match =
      parte.match(
        /^(\d+)\s*-\s*(\d+)$/
      );

    if (!match) {
      throw new Error(
        `Formato inválido: "${parte}". Use, por exemplo, 1-3, 5, 8-10.`
      );
    }

    let inicio =
      Number(match[1]);

    let fim =
      Number(match[2]);

    if (inicio > fim) {
      [
        inicio,
        fim
      ] = [
        fim,
        inicio
      ];
    }

    if (
      inicio < 1 ||
      fim > total
    ) {
      throw new Error(
        `O intervalo ${parte} está fora de 1 a ${total}.`
      );
    }

    for (
      let n = inicio;
      n <= fim;
      n++
    ) {
      numeros.add(n);
    }
  }

  return [...numeros].sort(
    (a, b) =>
      a - b
  );
}

function aplicarCampoPaginas() {
  try {
    const numeros =
      parseIntervaloPaginas(
        campoPaginas.value,
        estado.paginas.length
      );

    const selecionadas =
      new Set(
        numeros.map(
          (numero) =>
            numero - 1
        )
      );

    estado.paginas.forEach(
      (
        pagina,
        index
      ) => {
        pagina.selected =
          selecionadas.has(
            index
          );
      }
    );

    const radio =
      $(
        'input[name="tipoDivisao"][value="selecionadas"]'
      );

    if (radio) {
      radio.checked =
        true;
    }

    renderizarTudo();
  } catch (erro) {
    alert(
      erro.message
    );
  }
}

async function executarTarefa() {
  if (
    estado.processando ||
    !estado.paginas.length
  ) {
    return;
  }

  estado.processando =
    true;

  btnExecutar.disabled =
    true;

  statusExecucao.textContent =
    "Processando...";

  detalheExecucao.textContent =
    "Aguarde a geração do arquivo no navegador.";

  try {
    if (
      estado.modo === "juntar"
    ) {
      if (
        estado.sources.length < 2
      ) {
        throw new Error(
          "Para juntar PDFs, adicione pelo menos dois arquivos."
        );
      }

      await baixarPdf(
        estado.paginas,
        estado.sources,
        "pdf-unificado.pdf"
      );

      statusExecucao.textContent =
        "PDF unificado gerado com sucesso.";
    }

    if (
      estado.modo ===
      "rotacionar"
    ) {
      const base =
        nomeBase(
          estado.sources[0]?.name
        );

      await baixarPdf(
        estado.paginas,
        estado.sources,
        `${base}-editado.pdf`
      );

      statusExecucao.textContent =
        "PDF editado gerado com sucesso.";
    }

    if (
      estado.modo === "dividir"
    ) {
      const tipo =
        $(
          'input[name="tipoDivisao"]:checked'
        )?.value || "todas";

      const base =
        nomeBase(
          estado.sources[0]?.name
        );

      if (
        tipo === "todas"
      ) {
        await baixarPaginasSeparadasZip(
          estado.paginas,
          estado.sources,
          `${base}-dividido.zip`
        );

        statusExecucao.textContent =
          "Páginas separadas com sucesso.";
      } else {
        const selecionadas =
          paginasSelecionadas();

        if (
          !selecionadas.length
        ) {
          throw new Error(
            "Selecione pelo menos uma página para criar o novo PDF."
          );
        }

        await baixarPdf(
          selecionadas,
          estado.sources,
          `${base}-paginas-selecionadas.pdf`
        );

        statusExecucao.textContent =
          "PDF com páginas selecionadas gerado com sucesso.";
      }
    }

    atualizarResumo();
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    estado.processando =
      false;

    btnExecutar.disabled =
      false;
  }
}

async function abrirPreview(
  pageId
) {
  estado.previewPageId =
    pageId;

  modalPreview.hidden =
    false;

  document.body.style.overflow =
    "hidden";

  await renderizarPreview();
}

function fecharPreview() {
  modalPreview.hidden =
    true;

  document.body.style.overflow =
    "";

  estado.previewPageId =
    null;
}

async function renderizarPreview() {
  const pagina =
    paginaPorId(
      estado.previewPageId
    );

  if (!pagina) {
    return;
  }

  const index =
    estado.paginas.findIndex(
      (item) =>
        item.id === pagina.id
    );

  const source =
    sourcePorId(
      pagina.sourceId
    );

  $("#modalTitulo").textContent =
    `Página ${index + 1}`;

  $("#modalArquivo").textContent =
    `${source?.name || "PDF"} • página original ${pagina.pageIndex + 1}`;

  $("#btnPreviewAnterior").disabled =
    index <= 0;

  $("#btnPreviewProxima").disabled =
    index >=
    estado.paginas.length - 1;

  const wrap =
    document.querySelector(
      ".preview-canvas-wrap"
    );

  const largura =
    Math.max(
      300,
      wrap.clientWidth - 36
    );

  const altura =
    Math.max(
      300,
      wrap.clientHeight - 36
    );

  await renderizarPagina(
    source,
    pagina.pageIndex,
    canvasPreview,
    pagina.rotation,
    largura,
    altura
  );
}

function navegarPreview(
  delta
) {
  const atual =
    paginaPorId(
      estado.previewPageId
    );

  const index =
    estado.paginas.findIndex(
      (pagina) =>
        pagina.id === atual?.id
    );

  const novo =
    estado.paginas[
      index + delta
    ];

  if (!novo) {
    return;
  }

  estado.previewPageId =
    novo.id;

  renderizarPreview();
}

$$(".modo-pdf").forEach(
  (btn) => {
    btn.addEventListener(
      "click",
      () =>
        trocarModo(
          btn.dataset.modo
        )
    );
  }
);

arquivoPdf.addEventListener(
  "change",
  (event) => {
    adicionarArquivos(
      event.target.files
    );
  }
);

[
  "dragenter",
  "dragover"
].forEach(
  (evento) => {
    dropZone.addEventListener(
      evento,
      (event) => {
        event.preventDefault();

        dropZone.classList.add(
          "arrastando"
        );
      }
    );
  }
);

[
  "dragleave",
  "drop"
].forEach(
  (evento) => {
    dropZone.addEventListener(
      evento,
      (event) => {
        event.preventDefault();

        dropZone.classList.remove(
          "arrastando"
        );
      }
    );
  }
);

dropZone.addEventListener(
  "drop",
  (event) => {
    adicionarArquivos(
      event.dataTransfer.files
    );
  }
);

$("#btnSelecionarTodas")
  .addEventListener(
    "click",
    () =>
      selecionarTodas(true)
  );

$("#btnLimparSelecao")
  .addEventListener(
    "click",
    () =>
      selecionarTodas(false)
  );

$("#btnRotacionarEsquerda")
  .addEventListener(
    "click",
    () =>
      rotacionarSelecionadas(
        -90
      )
  );

$("#btnRotacionarDireita")
  .addEventListener(
    "click",
    () =>
      rotacionarSelecionadas(
        90
      )
  );

$("#btnExcluirSelecionadas")
  .addEventListener(
    "click",
    excluirSelecionadas
  );

$("#btnLimparTudo")
  .addEventListener(
    "click",
    () => {
      if (
        !estado.paginas.length ||
        confirm(
          "Limpar todos os PDFs carregados?"
        )
      ) {
        limparTudo();
      }
    }
  );

$("#btnAplicarPaginas")
  .addEventListener(
    "click",
    aplicarCampoPaginas
  );

campoPaginas.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      aplicarCampoPaginas();
    }
  }
);

$$(
  'input[name="tipoDivisao"]'
).forEach(
  (radio) => {
    radio.addEventListener(
      "change",
      atualizarResumo
    );
  }
);

btnExecutar.addEventListener(
  "click",
  executarTarefa
);

$("#btnFecharPreview")
  .addEventListener(
    "click",
    fecharPreview
  );

$("[data-fechar-preview]")
  .addEventListener(
    "click",
    fecharPreview
  );

$("#btnPreviewAnterior")
  .addEventListener(
    "click",
    () =>
      navegarPreview(-1)
  );

$("#btnPreviewProxima")
  .addEventListener(
    "click",
    () =>
      navegarPreview(1)
  );

$("#btnPreviewRotacionar")
  .addEventListener(
    "click",
    () => {
      if (
        estado.previewPageId
      ) {
        rotacionarPagina(
          estado.previewPageId,
          90
        );
      }
    }
  );

$("#btnPreviewExcluir")
  .addEventListener(
    "click",
    () => {
      if (
        estado.previewPageId
      ) {
        excluirPagina(
          estado.previewPageId
        );
      }
    }
  );

document.addEventListener(
  "keydown",
  (event) => {
    if (
      modalPreview.hidden
    ) {
      return;
    }

    if (
      event.key === "Escape"
    ) {
      fecharPreview();
    }

    if (
      event.key === "ArrowLeft"
    ) {
      navegarPreview(-1);
    }

    if (
      event.key === "ArrowRight"
    ) {
      navegarPreview(1);
    }
  }
);

window.addEventListener(
  "resize",
  () => {
    if (
      !modalPreview.hidden
    ) {
      renderizarPreview();
    }
  }
);

atualizarModoVisual();

renderizarTudo();