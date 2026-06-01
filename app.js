const urlDados = 'certificados.json';
let todosCertificados = [];

// Formata a data (ex: 2026-05-15 -> 15 de maio de 2026)
function formatarDataLonga(dataString) {
    if (!dataString) return '';
    try {
        const parts = dataString.split('-');
        if (parts.length !== 3) return dataString;
        const [year, month, day] = parts;
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return dateObj.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return dataString;
    }
}

// Renderiza a lista de certificados
function renderizarCertificados(certificados) {
    const grid = document.getElementById('grid-certificados');
    const emptyState = document.getElementById('empty-state');
    
    grid.innerHTML = '';
    
    if (certificados.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    certificados.forEach(cert => {
        const card = document.createElement('div');
        card.className = "cert-card";

        const tagsHTML = cert.tecnologias.map(tech => 
            `<span class="tag">${tech}</span>`
        ).join(' ');

        card.innerHTML = `
            <div>
                <span class="card-date">${formatarDataLonga(cert.data)}</span>
                <h3 class="card-title">${cert.titulo}</h3>
                
                <div class="card-info">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    <span>${cert.instituicao}</span>
                </div>
                
                <div class="card-info" style="margin-bottom: 1rem;">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Carga Horária: ${cert.cargaHoraria}</span>
                </div>

                <!-- Miniatura reposicionada e AGORA CLICÁVEL -->
                ${cert.miniatura ? `
                    <a href="${cert.arquivo}" target="_blank" rel="noopener noreferrer" class="card-thumbnail" style="display: block; cursor: pointer;" title="Clique para visualizar o certificado">
                        <img src="${cert.miniatura}" alt="Miniatura de ${cert.titulo}">
                    </a>
                ` : ''}

                <!-- Descrição / Resumo -->
                ${cert.descricao ? `<p class="card-desc">${cert.descricao}</p>` : ''}
            </div>
            
            <div class="card-footer">
                <div class="card-tags">
                    ${tagsHTML}
                </div>
                <a href="${cert.arquivo}" target="_blank" rel="noopener noreferrer" class="btn-view">
                    Visualizar Certificado
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Popula os selects dinamicamente (Instituições e Anos)
function popularFiltros(certificados) {
    const selectInst = document.getElementById('select-instituicao');
    const selectAno = document.getElementById('select-ano');
    
    // Extrai instituições únicas
    const instituicoes = Array.from(new Set(certificados.map(c => c.instituicao))).sort();
    
    // Extrai anos únicos (pegando os 4 primeiros caracteres da data "YYYY-MM-DD")
    const anos = Array.from(new Set(certificados.map(c => c.data.split('-')[0]))).sort((a, b) => b - a);
    
    // Preenche as opções de Instituição
    if(selectInst) {
        selectInst.innerHTML = '<option value="">Todas as Instituições</option>';
        instituicoes.forEach(inst => {
            const sOption = document.createElement('option');
            sOption.value = inst;
            sOption.textContent = inst;
            selectInst.appendChild(sOption);
        });
    }

    // Preenche as opções de Ano
    if(selectAno) {
        selectAno.innerHTML = '<option value="">Todos os Anos</option>';
        anos.forEach(ano => {
            const opt = document.createElement('option');
            opt.value = ano;
            opt.textContent = ano;
            selectAno.appendChild(opt);
        });
    }
}

// Aplica todos os filtros simultaneamente
function aplicarFiltros() {
    const textBusca = document.getElementById('input-busca').value.toLowerCase();
    const instSelecionada = document.getElementById('select-instituicao').value;
    const ordemSelecionada = document.getElementById('select-ordem').value;
    const selectAno = document.getElementById('select-ano');
    const anoSelecionado = selectAno ? selectAno.value : '';

    let filtrados = todosCertificados.filter(cert => {
        // Filtro de Texto (Busca)
        const matchesBusca = 
            cert.titulo.toLowerCase().includes(textBusca) ||
            cert.instituicao.toLowerCase().includes(textBusca) ||
            cert.tecnologias.some(tech => tech.toLowerCase().includes(textBusca));
            
        // Filtro de Instituição
        const matchesInst = instSelecionada === '' || cert.instituicao === instSelecionada;

        // Filtro de Ano
        const matchesAno = anoSelecionado === '' || cert.data.startsWith(anoSelecionado);

        return matchesBusca && matchesInst && matchesAno;
    });

    // Ordenação
    filtrados.sort((a, b) => {
        const dataA = new Date(a.data + 'T00:00:00').getTime();
        const dataB = new Date(b.data + 'T00:00:00').getTime();
        return ordemSelecionada === 'cronologica' ? dataA - dataB : dataB - dataA;
    });

    renderizarCertificados(filtrados);
}

// Inicializa o processo
async function carregarCertificados() {
    try {
        const resposta = await fetch(urlDados);
        if (!resposta.ok) throw new Error('Erro ao carregar o JSON: ' + resposta.statusText);
        todosCertificados = await resposta.json();

        // Inicializa UI
        popularFiltros(todosCertificados);
        aplicarFiltros();
        
        // Adiciona os monitores de eventos
        document.getElementById('input-busca').addEventListener('input', aplicarFiltros);
        document.getElementById('select-instituicao').addEventListener('change', aplicarFiltros);
        document.getElementById('select-ordem').addEventListener('change', aplicarFiltros);
        
        const selectAno = document.getElementById('select-ano');
        if (selectAno) {
            selectAno.addEventListener('change', aplicarFiltros);
        }

    } catch (erro) {
        console.error('Falha ao processar carregarCertificados:', erro);
        document.getElementById('grid-certificados').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #dc2626; padding: 4rem 0; background-color: #fef2f2; border-radius: 1rem; border: 1px solid #fee2e2;">
                <p style="font-weight: bold; font-size: 1.125rem;">Ocorreu um erro ao carregar os dados.</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.8;">${erro.message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', carregarCertificados);