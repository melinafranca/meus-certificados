// URL do arquivo de dados com os certificados
const urlDados = 'certificados.json';
let todosCertificados = [];

// Função para formatar a data (ex: 2024-02-15 -> 15 de fev. de 2024)
function formatarDataLonga(dataString) {
    if (!dataString) return '';
    try {
        const parts = dataString.split('-');
        if (parts.length !== 3) return dataString;
        const [year, month, day] = parts;
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return dateObj.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dataString;
    }
}

// Renderiza a lista de certificados com base nos filtros
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
        card.className = "bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between";

        const tagsHTML = cert.tecnologias.map(tech => 
            `<span class="bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/15 text-3xs font-semibold px-2 py-0.5 rounded-full">${tech}</span>`
        ).join(' ');

        card.innerHTML = `
            <div>
                <span class="text-3xs text-[#58a6ff] font-bold uppercase tracking-wider">${formatarDataLonga(cert.data)}</span>
                <h3 class="text-base font-bold text-[#f0f6fc] leading-snug mt-1 mb-2">${cert.titulo}</h3>
                <p class="text-xs text-[#c9d1d9] mb-1"><strong class="text-[#8b949e]">Instituição:</strong> ${cert.instituicao}</p>
                <p class="text-xs text-[#c9d1d9] mb-2"><strong class="text-[#8b949e]">Carga Horária:</strong> ${cert.cargaHoraria}</p>
                ${cert.descricao ? `<p class="text-3xs text-[#8b949e] bg-[#0d1117] p-2 rounded-lg mb-4 border border-[#30363d]/55">${cert.descricao}</p>` : ''}
            </div>
            <div class="pt-3 border-t border-[#30363d] mt-4 flex flex-col gap-2">
                <div class="flex flex-wrap gap-1 leading-none text-[#c9d1d9]">
                    ${tagsHTML}
                </div>
                <a href="${cert.arquivo}" target="_blank" rel="noopener noreferrer" 
                   class="block text-center w-full bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#8b949e] text-[#c9d1d9] hover:text-[#f0f6fc] font-medium py-2 px-3 rounded-lg transition-colors text-xs mt-3">
                    Visualizar Certificado
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Popula o select dropdown das instituições disponíveis no JSON
function popularInstituicoes(certificados) {
    const select = document.getElementById('select-instituicao');
    const instituicoes = Array.from(new Set(certificados.map(c => c.instituicao))).sort();
    
    // Reseta exceto a primeira opção
    select.innerHTML = '<option value="">Todas as Instituições</option>';
    
    instituicoes.forEach(inst => {
        const sOption = document.createElement('option');
        sOption.value = inst;
        sOption.textContent = inst;
        select.appendChild(sOption);
    });
}

// Aplica filtros de texto, dropdown de instituição e ordenação
function aplicarFiltros() {
    const textBusca = document.getElementById('input-busca').value.toLowerCase();
    const instSelecionada = document.getElementById('select-instituicao').value;
    const ordemSelecionada = document.getElementById('select-ordem').value;

    let filtrados = todosCertificados.filter(cert => {
        const matchesBusca = 
            cert.titulo.toLowerCase().includes(textBusca) ||
            cert.instituicao.toLowerCase().includes(textBusca) ||
            cert.tecnologias.some(tech => tech.toLowerCase().includes(textBusca));
            
        const matchesInst = instSelecionada === '' || cert.instituicao === instSelecionada;

        return matchesBusca && matchesInst;
    });

    // Ordenação
    filtrados.sort((a, b) => {
        const dataA = new Date(a.data + 'T00:00:00').getTime();
        const dataB = new Date(b.data + 'T00:00:00').getTime();
        return ordemSelecionada === 'cronologica' ? dataA - dataB : dataB - dataA;
    });

    renderizarCertificados(filtrados);
}

// Carrega os dados assincronamente ao abrir o navegador
async function carregarCertificados() {
    try {
        const resposta = await fetch(urlDados);
        if (!resposta.ok) throw new Error('Erro ao carregar o JSON: ' + resposta.statusText);
        todosCertificados = await resposta.json();

        // Inicializa UI
        popularInstituicoes(todosCertificados);
        aplicarFiltros();
        
        // Adiciona Event Listeners
        document.getElementById('input-busca').addEventListener('input', aplicarFiltros);
        document.getElementById('select-instituicao').addEventListener('change', aplicarFiltros);
        document.getElementById('select-ordem').addEventListener('change', aplicarFiltros);

    } catch (erro) {
        console.error('Falha ao processar carregarCertificados:', erro);
        document.getElementById('grid-certificados').innerHTML = `
            <div class="col-span-full text-center text-[#ff7b72] py-12">
                <p class="font-bold">Infelizmente, ocorreu um erro ao carregar os dados.</p>
                <p class="text-xs text-[#8b949e] mt-1">${erro.message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', carregarCertificados);