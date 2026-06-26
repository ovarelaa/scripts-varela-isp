// ==UserScript==
// @name         Copiar atendimentos ISP - Varela
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Copia TODOS os atendimentos dos últimos 3 meses com suporte a "Aguardando Informações" e notificações Toast temporárias.
// @author       Varela
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gegnet.com.br
// @match        *://integrator6.gegnet.com.br/*
// @match        *://integrator6.alt.com.br/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    /* ===========================
       UTILIDADES
    =========================== */

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function normalizar(txt) {
        return (txt || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // Função de Notificação Flutuante Temporária (Toast)
    function mostrarToast(mensagem, tipo = 'success') {
        const toast = document.createElement('div');
        let corBg = '#1e7e34'; // Verde elegante
        let corTexto = '#fff';

        if (tipo === 'warn') corBg = '#d97706'; // Amarelo/Laranja
        if (tipo === 'error') corBg = '#dc3545'; // Vermelho

        toast.textContent = mensagem;
        toast.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: ${corBg};
            color: ${corTexto};
            padding: 10px 20px;
            border-radius: 5px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            z-index: 1000000;
            transition: all 0.4s ease;
            pointer-events: none;
        `;
        document.body.appendChild(toast);

        // Efeito de sumir sozinho
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.top = '15px';
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    /* ===========================
       CLIQUE REAL (ANGULAR)
    =========================== */

    function cliqueReal(el) {
        if (!el) return;
        ['mousedown', 'mouseup', 'click'].forEach(ev =>
            el.dispatchEvent(new MouseEvent(ev, { bubbles: true }))
        );
    }

    /* ===========================
       ATIVAR TODOS OS FILTROS
    =========================== */

    async function activarFiltros() {
        const filtros = document.querySelectorAll('p-selectbutton .ui-button');

        filtros.forEach(f => {
            if (!f.classList.contains('ui-state-active')) {
                cliqueReal(f);
            }
        });

        await sleep(2000);
    }

    /* ===========================
       STATUS
    =========================== */

    function detectarStatus(linha) {
        const flag = linha.querySelector('.fa-flag');
        if (flag) {
            const c = flag.className.toLowerCase();
            if (c.includes('concluid')) return 'Concluído';
            if (c.includes('semsoluc')) return 'Sem Solução';
            if (c.includes('pend')) return 'Pendente';
            if (c.includes('analise')) return 'Em Análise';
            if (c.includes('resol')) return 'Em Resolução';
            if (c.includes('contato')) return 'Sem Contato';
            // Ampliado para capturar variações de "Aguardando Informações" via classe
            if (c.includes('aguard') || c.includes('info')) return 'Aguardando Informações';
        }

        const t = normalizar(linha.innerText);
        if (t.includes('concluido')) return 'Concluído';
        if (t.includes('sem solucao')) return 'Sem Solução';
        if (t.includes('pendente')) return 'Pendente';
        if (t.includes('em analise')) return 'Em Análise';
        if (t.includes('em resolucao')) return 'Em Resolução';
        if (t.includes('sem contato')) return 'Sem Contato';
        // Procura por termos parciais para evitar quebras por abreviações do sistema
        if (t.includes('aguardando') || t.includes('aguard') || t.includes('informac')) return 'Aguardando Informações';

        return null;
    }

    function tipoAceito(txt) {
        const t = normalizar(txt);
        return (
            t.includes('suporte tecnico') ||
            t.includes('sup res') ||
            t.includes('sup-res') ||
            t.includes('requerimento cliente')
        );
    }

    /* ===========================
       COLETA
    =========================== */

    function coletar() {
        const hoje = new Date();
        const limite = new Date();
        limite.setMonth(hoje.getMonth() - 3);

        const linhas = document.querySelectorAll('p-datatable tbody tr');
        const lista = [];

        linhas.forEach(linha => {
            try {
                const status = detectarStatus(linha);
                if (!status) return;

                let data = '', hora = '', protocolo = '', tipo = '';

                linha.querySelectorAll('td, span').forEach(el => {
                    const tx = el.innerText?.trim() || '';
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(tx)) data = tx;
                    else if (/^\d{2}:\d{2}$/.test(tx)) hora = tx;
                    else if (/^\d{6,10}$/.test(tx)) protocolo = tx;
                    else if (tipoAceito(tx)) tipo = tx;
                });

                if (!data || !hora || !protocolo || !tipo) return;

                const [d, m, a] = data.split('/');
                const dh = new Date(`${a}-${m}-${d}T${hora}:00`);
                if (dh < limite || dh > hoje) return;

                lista.push(`${data} ${hora} ${protocolo} ${tipo} (${status})`);
            } catch (e) {
                console.warn('Erro em linha ignorado', e);
            }
        });

        return lista;
    }

    /* ===========================
       COPIAR COM FALLBACK
    =========================== */

    async function copiarTexto(texto) {
        if (!texto) throw new Error('Texto vazio');

        if (typeof GM_setClipboard === 'function') {
            try {
                GM_setClipboard(texto);
                return;
            } catch (_) {}
        }

        await navigator.clipboard.writeText(texto);
    }

    /* ===========================
       BOTÃO
    =========================== */

    function criarBotao() {
        if (document.getElementById('btn-copiar-atendimentos')) return;

        const base = document.querySelector('li.icon-blue button.btn-acao');
        if (!base) return;

        const btn = document.createElement('button');
        btn.id = 'btn-copiar-atendimentos';
        btn.textContent = 'Copiar atendimentos';
        btn.className = 'btn btn-success btn-acao';
        btn.style.marginLeft = '10px';

        btn.onclick = async () => {
            try {
                await activarFiltros();
                const atendimentos = coletar();

                if (!atendimentos.length) {
                    mostrarToast('⚠️ Nenhum atendimento encontrado nos últimos 3 meses', 'warn');
                    return;
                }

                const texto =
                    `Cliente possui ${atendimentos.length} atendimentos para Suporte Técnico nos últimos 3 meses\n` +
                    atendimentos.join('\n');

                await copiarTexto(texto);
                mostrarToast(`✅ ${atendimentos.length} atendimentos copiados com sucesso!`, 'success');
            } catch (e) {
                console.error(e);
                mostrarToast('❌ Falha ao copiar atendimentos', 'error');
            }
        };

        base.parentElement.insertAdjacentElement('afterend', btn);
    }

    const obs = new MutationObserver(criarBotao);
    obs.observe(document.body, { childList: true, subtree: true });
})();