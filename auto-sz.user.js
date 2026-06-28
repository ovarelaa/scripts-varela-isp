// ==UserScript==
// @name         Em atendimento no SZ by Varela
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automação Integrator 6 - Escudo Anti-Mouse + Captura Dinâmica de Nome
// @match        *://integrator6.alt.com.br/*
// @match        https://integrator6.acessoline.net.br/*
// @author       Varela
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const delay = ms => new Promise(res => setTimeout(res, ms));

    // ==========================================
    // CAPTURA DO NOME DO ATENDENTE
    // ==========================================
    function obterNomeAtendente() {
        try {
            // Procura o elemento da foto (avatar) no canto superior direito
            const avatarSpan = document.querySelector('span.avatar');
            if (avatarSpan && avatarSpan.parentElement) {
                // Pega o texto inteiro (" CSA: MATHEUS VARELA STEFANES   ")
                let textoBruto = avatarSpan.parentElement.textContent || "";

                // Tira o "CSA:", quebras de linha e limpa os espaços em branco
                let nomeLimpo = textoBruto.replace(/CSA:/i, '').replace(/\n/g, '').trim();

                if (nomeLimpo) {
                    // Formata de MATHEUS VARELA para Matheus Varela
                    return nomeLimpo.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                }
            }
        } catch (e) {
            console.error("Erro ao capturar nome do atendente:", e);
        }
        return "Agente"; // Fallback de segurança caso o Integrator demore a carregar o nome
    }

    // ==========================================
    // O ESCUDO ANTI-MOUSE
    // ==========================================
    let escudoAtivo = false;

    function bloqueadorDeMouseFisico(e) {
        if (escudoAtivo && e.isTrusted) {
            e.stopPropagation();
        }
    }

    const eventosMouse = ['mousemove', 'mouseout', 'mouseleave', 'mouseover', 'mouseenter', 'pointermove', 'pointerout', 'pointerleave'];
    eventosMouse.forEach(evt => {
        window.addEventListener(evt, bloqueadorDeMouseFisico, true);
    });

    function mostrarAviso(texto, cor = '#0056b3') {
        console.log("[SZ Chat] " + texto);
        let toast = document.getElementById('robo-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'robo-toast';
            toast.style.cssText = 'position: fixed; bottom: 30px; right: 30px; color: white; padding: 15px 25px; border-radius: 8px; font-weight: bold; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-family: Arial, sans-serif; pointer-events: none; transition: all 0.2s; font-size: 15px;';
            document.body.appendChild(toast);
        }
        toast.style.background = cor;
        toast.innerText = texto;
        toast.style.display = 'block';
        setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
    }

    function textMatch(elText, search) {
        if (!elText) return false;
        const limpaTexto = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").toUpperCase().trim();
        return limpaTexto(elText) === limpaTexto(search);
    }

    function dispararHover(el) {
        if (!el) return false;
        const eventParams = { bubbles: true, cancelable: true, view: window };
        el.dispatchEvent(new MouseEvent('mouseenter', eventParams));
        el.dispatchEvent(new MouseEvent('mouseover', eventParams));
        el.dispatchEvent(new MouseEvent('mousemove', eventParams));
        return true;
    }

    function clicarElemento(el) {
        if (!el) return false;
        const eventParams = { bubbles: true, cancelable: true, view: window };
        el.dispatchEvent(new MouseEvent('mousedown', eventParams));
        el.dispatchEvent(new MouseEvent('mouseup', eventParams));
        el.click();
        return true;
    }

    // Visão de Raio-X
    async function interagirComTexto(textoDesejado, acao, contexto = 'geral', maxTentativas = 20) {
        for (let i = 0; i < maxTentativas; i++) {

            let seletor = 'span, a, button, li, label, div';
            if (contexto === 'menu') seletor = 'li a, li span, li div, .ui-menuitem-text';
            else if (contexto === 'botao') seletor = 'button, button span';

            const elementos = Array.from(document.querySelectorAll(seletor))
                .filter(el => {
                    let text = el.textContent || el.innerText;
                    return textMatch(text, textoDesejado);
                });

            if (elementos.length > 0) {
                let alvo = elementos[elementos.length - 1];
                let linkParent = alvo.closest('a');
                let liParent = alvo.closest('li');

                if (acao === 'hover') {
                    if (liParent) dispararHover(liParent);
                    if (linkParent) dispararHover(linkParent);
                    dispararHover(alvo);
                } else if (acao === 'click') {
                    clicarElemento(linkParent || alvo);
                }

                return true;
            }
            await delay(400);
        }
        return false;
    }

    async function injetarTipoComentario(maxTentativas = 20) {
        for (let i = 0; i < maxTentativas; i++) {
            let alvo = document.querySelector('select[formcontrolname="codtca"]');

            if (!alvo) {
                const selects = Array.from(document.querySelectorAll('select'));
                alvo = selects.find(s => Array.from(s.options).some(opt => opt.text.includes('Padrão') || opt.text.includes('Padrao')));
            }

            if (alvo) {
                alvo.value = '01PADRAO';
                alvo.dispatchEvent(new Event('change', { bubbles: true }));
                alvo.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }
            await delay(500);
        }
        return false;
    }

    async function preencherComentario(texto, maxTentativas = 20) {
        for (let i = 0; i < maxTentativas; i++) {
            const textareas = Array.from(document.querySelectorAll('textarea'))
                .filter(ta => !ta.disabled && ta.offsetParent !== null);

            if (textareas.length > 0) {
                const ta = textareas[textareas.length - 1];
                let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;

                nativeInputValueSetter.call(ta, "");
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                await delay(300);

                nativeInputValueSetter.call(ta, texto);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                ta.dispatchEvent(new Event('blur', { bubbles: true }));
                return true;
            }
            await delay(500);
        }
        return false;
    }

    let executando = false;

    async function executarAutomacaoTotal() {
        if (executando) return;
        executando = true;

        escudoAtivo = true;

        try {
            // CAPTURA O NOME DINAMICAMENTE
            const nomeDoAgente = obterNomeAtendente();
            const comentarioFormatado = `Em atendimento via SZ Chat com ${nomeDoAgente} (CSA)`;

            // ETAPA 1: O COMENTÁRIO
            mostrarAviso('🤖 1/3: Escudo ativado! Abrindo Adicionar...', '#ff8c00');
            if (!await interagirComTexto('Adicionar', 'hover', 'menu')) throw new Error("Botão 'Adicionar' invisível.");
            await delay(800);

            mostrarAviso('🤖 Clicando em Comentário...', '#ff8c00');
            if (!await interagirComTexto('Comentário', 'click', 'menu') && !await interagirComTexto('Comentario', 'click', 'menu')) throw new Error("Opção 'Comentário' não abriu.");
            await delay(2000);

            mostrarAviso('🤖 Injetando "Comentário Padrão"...', '#ff8c00');
            if (!await injetarTipoComentario()) throw new Error("Select de Tipos não encontrado.");
            await delay(800);

            mostrarAviso(`✍️ Inserindo: ${nomeDoAgente}...`, '#ff8c00');
            if (!await preencherComentario(comentarioFormatado)) throw new Error("Caixa de texto não encontrada.");
            await delay(800);

            if (!await interagirComTexto('Salvar', 'click', 'botao') && !await interagirComTexto('Gravar', 'click', 'botao')) throw new Error("O botão Salvar sumiu.");
            mostrarAviso('✅ Salvando... Aguardando sistema (5s)', '#ff8c00');

            await delay(5000);

            // ETAPA 2: CATEGORIA
            mostrarAviso('🤖 2/3: Hover invisível no Mudar...', '#0056b3');
            if (!await interagirComTexto('Mudar', 'hover', 'menu')) throw new Error("Botão 'Mudar' invisível.");
            await delay(800);

            mostrarAviso('🤖 Hover em Categoria...', '#0056b3');
            if (!await interagirComTexto('Categoria', 'hover', 'menu')) throw new Error("Submenu 'Categoria' não abriu.");
            await delay(800);

            mostrarAviso('🤖 Raio-X detectou Técnico. Clicando!', '#0056b3');
            if (!await interagirComTexto('Técnico', 'click', 'menu') && !await interagirComTexto('Tecnico', 'click', 'menu')) throw new Error("Opção 'Técnico' falhou.");
            mostrarAviso('✅ Categoria aplicada! Esperando (4s)', '#ff8c00');

            await delay(4000);

            // ETAPA 3: STATUS
            mostrarAviso('🤖 3/3: Hover final no Mudar...', '#0056b3');
            if (!await interagirComTexto('Mudar', 'hover', 'menu')) throw new Error("Botão 'Mudar' invisível.");
            await delay(800);

            mostrarAviso('🤖 Hover em Status...', '#0056b3');
            if (!await interagirComTexto('Status', 'hover', 'menu')) throw new Error("Submenu 'Status' não abriu.");
            await delay(800);

            mostrarAviso('🤖 Raio-X detectou Aguardando Informações!', '#0056b3');
            if (!await interagirComTexto('Aguardando Informações', 'click', 'menu') && !await interagirComTexto('Aguardando Informacoes', 'click', 'menu')) throw new Error("Opção 'Aguardando Informações' falhou.");

            mostrarAviso('🏆 Automação Concluída! Você é o mestre do Integrator!', '#28a745');

        } catch (erro) {
            console.error(erro);
            mostrarAviso('❌ Travei: ' + erro.message, '#dc3545');
        } finally {
            escudoAtivo = false;
            executando = false;
        }
    }

    function injetarBotaoMenu() {
        if (document.getElementById('btn-sz-matheus')) return;

        const elementosRef = Array.from(document.querySelectorAll('span, a')).filter(el => el.textContent.trim().includes('Vincular Atendimento') && el.offsetParent !== null);

        if (elementosRef.length > 0) {
            const ref = elementosRef[0];
            const liItem = ref.closest('li');

            if (liItem && liItem.parentNode) {
                const novoBotao = document.createElement('li');
                novoBotao.id = 'btn-sz-matheus';
                novoBotao.style.cssText = 'display: inline-block; margin-left: 10px; cursor: pointer; height: 100%; list-style: none;';

                novoBotao.innerHTML = `
                    <div style="background: linear-gradient(135deg, #0056b3 0%, #007bff 100%); color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.2s; margin-top: 4px;">
                        ⚡ Auto SZ Chat
                    </div>
                `;

                novoBotao.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    executarAutomacaoTotal();
                };

                liItem.parentNode.appendChild(novoBotao);
            }
        }
    }

    setInterval(injetarBotaoMenu, 1500);

})();
