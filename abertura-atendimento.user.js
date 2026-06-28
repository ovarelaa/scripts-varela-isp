// ==UserScript==
// @name         Motivo + Tipo do Atendimento by Varela
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adiciona atalhos durante a abertura do atendimento e botões para mudança rápida de motivo do atendimento já aberto.
// @author       Varela
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gegnet.com.br
// @match        *://integrator6.gegnet.com.br/*
// @match        https://integrator6.acessoline.net.br/*
// @match        https://integrator6.alt.com.br/*
// @grant        none
// @icon         https://raw.githubusercontent.com/devluiztoledo/copiar-dados-ONT/main/icon.png
// ==/UserScript==

(function () {
    'use strict';

    const host = window.location.host;
    const isGegnet = host.includes('gegnet.com.br') || host.includes('alt.com.br');
    const isAcessoLine = host.includes('acessoline.net.br');

    //////////// ALTERAR ATENDIMENTO ////////////
    const motivos = {
        "Lentidão":      "SUP RES - Lentidão",
        "Sem acesso":    "SUP RES - Sem conexão/Indisponibilidade",
        "Massiva":       "SUP RES - Massiva",
        "Alterar senha": "SUP RES - Troca /Informações senha",
        "Streaming TV":  "SUP RES - Streaming TV",
        "Alterar Configurações Equipamento": "SUP RES -  Alterar Configuração equipamento",
        "Visita técnica": "SUP RES - Visita técnica"
    };

    const delay = ms => new Promise(res => setTimeout(res, ms));
    function clickMudar() { const btn = Array.from(document.querySelectorAll('a.ui-menuitem-link')).find(a => a.textContent.trim()==='Mudar'); if(btn)btn.click(); }
    function clickMenu(label) { const item = Array.from(document.querySelectorAll('span.ui-menuitem-text')).find(s=>s.textContent.trim()===label); if(item) item.click(); }
    function clickSpan(text){ const el = Array.from(document.querySelectorAll('span.ng-star-inserted')).find(e=>e.textContent.trim()===text); if(el)el.click(); }
    function clickSalvar(){ const btn=document.querySelector('div.modal-footer button.btn-success')||document.querySelector('button.btn-success'); if(btn)btn.click(); }

    async function marcarCategoriaTecnico() {
        clickMudar(); await delay(150);
        clickMenu('Categoria'); await delay(120);
        clickMenu(isAcessoLine ? 'Tecnico' : 'Técnico');
        await delay(120);
        clickSalvar();
    }

    // ALT FLOWS (Acessoline antiga)
    const altFlows = {
        tipoCNPJ: async()=>{
            clickMudar(); await delay(200); clickMenu('Tipo'); await delay(150);
            clickSpan('SUPORTE RESIDENCIAL'); await delay(150); clickSpan('SUPORTE TÉCNICO - PJ'); await delay(150);
            clickSalvar(); await delay(200); await marcarCategoriaTecnico();
        },
        semAcesso: async()=>{
            clickMudar(); await delay(200); clickMenu('Categoria'); await delay(150);
            clickMenu(isAcessoLine ? 'Tecnico' : 'Técnico'); await delay(150); clickMenu('Motivo'); await delay(150);
            document.querySelector('.ui-dropdown-trigger')?.click(); await delay(150);
            clickSpan('SUP RES - Sem conexão / Indisponibilidade'); await delay(150); clickSalvar();
        },
        tipoCPF: async()=>{
            clickMudar(); await delay(200); clickMenu('Tipo'); await delay(150);
            clickSpan('SUPORTE RESIDENCIAL'); await delay(150); clickSpan('SUPORTE TÉCNICO - PF'); await delay(150);
            clickSalvar(); await delay(200); await marcarCategoriaTecnico();
        },
        lentidao: async()=>{
            clickMudar(); await delay(200); clickMenu('Categoria'); await delay(150);
            clickMenu(isAcessoLine ? 'Tecnico' : 'Técnico'); await delay(150); clickMenu('Motivo'); await delay(150);
            document.querySelector('.ui-dropdown-trigger')?.click(); await delay(150);
            clickSpan('SUP RES - Lentidão'); await delay(150); clickSalvar();
        },
        massiva: async()=>{
            clickMudar(); await delay(200); clickMenu('Categoria'); await delay(150);
            clickMenu(isAcessoLine ? 'Tecnico' : 'Técnico'); await delay(150); clickMenu('Motivo'); await delay(150);
            document.querySelector('.ui-dropdown-trigger')?.click(); await delay(150);
            clickSpan('SUP RES - Massiva'); await delay(150); clickSalvar();
        },
        req: async()=>{
            clickMudar(); await delay(200); clickMenu('Tipo'); await delay(150);
            clickSpan('REQUERIMENTO RES'); await delay(150); clickSalvar(); await delay(200); await marcarCategoriaTecnico();
        }
    };

    // GEGNET FLOWS (Utilizado pela ALT)
    const gegFlows = {
        default: async label=>{
            clickMudar(); await delay(200); clickMenu('Categoria'); await delay(150);
            clickMenu('Técnico'); await delay(150); clickMenu('Motivo'); await delay(150);
            document.querySelector('.ui-dropdown-trigger')?.click(); await delay(150);
            clickSpan(label); await delay(150); clickSalvar();
        },
        supPF: async()=>{
            clickMudar(); await delay(200); clickMenu('Tipo'); await delay(150);
            clickSpan('SUPORTE TÉCNICO RESIDENCIAL'); await delay(150); clickSpan('SUPORTE TÉCNICO - PF'); await delay(150);
            clickSalvar(); await delay(200); clickMudar(); await delay(150);
            clickMenu('Categoria'); await delay(120); clickMenu('Técnico'); await delay(120); clickSalvar();
        },
        supCNPJ: async()=>{
            clickMudar(); await delay(200); clickMenu('Tipo'); await delay(150);
            clickSpan('SUPORTE TÉCNICO RESIDENCIAL'); await delay(150); clickSpan('SUPORTE TÉCNICO - PJ'); await delay(150);
            clickSalvar(); await delay(200); clickMudar(); await delay(150);
            clickMenu('Categoria'); await delay(120); clickMenu('Técnico'); await delay(120); clickSalvar();
        },
        req: async()=>{
            clickMudar(); await delay(200); clickMenu('Tipo'); await delay(150);
            clickSpan('REQUERIMENTO CLIENTE'); await delay(150); clickSalvar(); await delay(200);
            clickMudar(); await delay(150); clickMenu('Categoria'); await delay(120);
            clickMenu('Técnico'); await delay(120); clickSalvar();
        }
    };

    function criarBotao(nome,action){
        const btn=document.createElement('button');
        btn.type = 'button';
        btn.textContent=nome;
        btn.id='btn-'+nome.replace(/\s+/g,'').toLowerCase();
        Object.assign(btn.style,{margin:'5px',padding:'6px 10px',background:'rgb(26, 66, 138)',color:'#fff',border:'none',borderRadius:'5px',cursor:'pointer'});
        btn.addEventListener('click',action);
        return btn;
    }

    function inserirBotoes(){
        if(document.querySelector('#btn-alterar-motivo')) return;
        const campo=document.querySelector('input[formcontrolname="descri_mvis"]') || document.querySelector('textarea[formcontrolname="descri_mvis"]') || document.querySelector('[formcontrolname="descri_mvis"]');
        if(!campo) return;

        const c=document.createElement('div');c.id='btn-alterar-motivo';c.style.margin='15px 0';
        if(isAcessoLine){
            c.appendChild(criarBotao('CPF',altFlows.tipoCPF));
            c.appendChild(criarBotao('CNPJ',altFlows.tipoCNPJ));
            c.appendChild(criarBotao('REQ',altFlows.req));
            c.appendChild(criarBotao('Sem Acesso',altFlows.semAcesso));
            c.appendChild(criarBotao('Lentidão',altFlows.lentidao));
            c.appendChild(criarBotao('Massiva',altFlows.massiva));
        } else if(isGegnet){
            Object.entries(motivos).forEach(([n,l])=>c.appendChild(criarBotao(n,()=>gegFlows.default(l))));
            c.appendChild(criarBotao('SUP - CNPJ', gegFlows.supCNPJ));
            c.appendChild(criarBotao('SUP - PF', gegFlows.supPF));
            c.appendChild(criarBotao('REQ', gegFlows.req));
        }
        campo.parentElement.prepend(c);
    }
    new MutationObserver(inserirBotoes).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('hashchange',()=>setTimeout(inserirBotoes,500));

    // Criar Atendimento (Gegnet / ALT)
    if(isGegnet){ (function(){
        const d=ms=>new Promise(r=>setTimeout(r,ms));

        function clickItem(t){
            const el=Array.from(document.querySelectorAll('span.ng-star-inserted, .ui-treenode-label, .p-treenode-label'))
                          .filter(e=>e.offsetParent!==null)
                          .find(s=>s.textContent.trim()===t);
            if(el) el.click();
            else console.warn(`Item '${t}' não encontrado`);
        }

        async function selectDropdown(n,l){
            const dropdown = document.querySelector(`p-dropdown[formcontrolname="${n}"]`);
            if(!dropdown) return;
            const trig = dropdown.querySelector('.ui-dropdown-trigger, .p-dropdown-trigger');
            if(!trig) return;
            trig.click();
            await d(250);
            const opt=Array.from(document.querySelectorAll('li.ui-dropdown-item, .ui-dropdown-item span, .p-dropdown-item'))
                            .find(li=> (li.getAttribute('aria-label') === l || li.textContent.trim() === l) && li.offsetParent !== null);
            if(opt) opt.click();
            else console.warn(`Opção '${l}' no '${n}' não encontrada`);
            await d(150);
        }

        async function preencherArvoreSuporteComum() {
            const pf=Array.from(document.querySelectorAll('span.ng-star-inserted')).filter(e=>e.offsetParent!==null).some(s=>s.textContent.trim()==='SUPORTE TÉCNICO - PF');
            if(!pf){clickItem('SUPORTE TÉCNICO RESIDENCIAL');await d(150);clickItem('SUPORTE TÉCNICO - PF');await d(200);}
            await selectDropdown('codcatoco','Técnico');
        }

        async function preencherArvoreRequerimentoComum() {
            clickItem('REQUERIMENTO CLIENTE');
            await d(250);
            await selectDropdown('codcatoco','Técnico');
        }

        const tipoActions = {
            requerimento: async () => { clickItem('REQUERIMENTO CLIENTE'); },
            cpf: async () => { clickItem('SUPORTE TÉCNICO RESIDENCIAL'); await d(200); clickItem('SUPORTE TÉCNICO - PF'); },
            cnpj: async () => { clickItem('SUPORTE TÉCNICO RESIDENCIAL'); await d(200); clickItem('SUPORTE TÉCNICO - PJ'); }
        };

        const f={
            semAcessoSuporte:async()=>{await preencherArvoreSuporteComum();await selectDropdown('codmvis','SUP RES - Sem conexão/Indisponibilidade');await selectDropdown('user_cargo','CSA - Suporte');},
            semAcessoDigital:async()=>{await preencherArvoreSuporteComum();await selectDropdown('codmvis','SUP RES - Sem conexão/Indisponibilidade');await selectDropdown('user_cargo','CSA - Digital');},
            lentidaoSuporte:async()=>{await preencherArvoreSuporteComum();await selectDropdown('codmvis','SUP RES - Lentidão');await selectDropdown('user_cargo','CSA - Suporte');},
            lentidaoDigital:async()=>{await preencherArvoreSuporteComum();await selectDropdown('codmvis','SUP RES - Lentidão');await selectDropdown('user_cargo','CSA - Digital');},
            senhaWifi:async()=>{await preencherArvoreSuporteComum();await selectDropdown('codmvis','SUP RES - Troca /Informações senha');await selectDropdown('user_cargo','CSA - Digital');},
            requerimentoSuporte:async()=>{await preencherArvoreRequerimentoComum();await selectDropdown('codmvis','REQ - Demanda cliente');await selectDropdown('user_cargo','CSA - Suporte');},
            requerimentoDigital:async()=>{await preencherArvoreRequerimentoComum();await selectDropdown('codmvis','REQ - Demanda cliente');await selectDropdown('user_cargo','CSA - Digital');}
        };

        function cp(){
            if(document.getElementById('tm-panel')) return;

            const ancora = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
            if(!ancora) return;

            // Localiza especificamente a malha flexbox de colunas do PrimeNG (.ui-g ou .row)
            const grid = ancora.closest('.ui-g') || ancora.closest('.row') || ancora.closest('.p-grid');
            if(!grid) return;

            // Painel montado com isolamento estrutural completo
            const p=document.createElement('div');
            p.id='tm-panel';
            p.style.cssText='margin-bottom:15px;padding:12px;background:#141414;border:1px solid #333;border-radius:6px;display:flex;flex-direction:column;gap:10px;width:100%;box-sizing:border-box;position:relative;clear:both;';

            // SEÇÃO 1: Macros Completas
            const rowMacros = document.createElement('div');
            rowMacros.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;';

            const labelMacros = document.createElement('span');
            labelMacros.textContent = 'Macros Rápidas:';
            labelMacros.style.cssText = 'color:#999;font-weight:bold;font-size:11px;margin-right:6px;font-family:sans-serif;';
            rowMacros.appendChild(labelMacros);

            const m={
                'Sem Acesso Suporte':'semAcessoSuporte','Sem Acesso Digital':'semAcessoDigital',
                'Lentidão Suporte':'lentidaoSuporte','Lentidão Digital':'lentidaoDigital',
                'Requerimento Suporte':'requerimentoSuporte','Requerimento Digital':'requerimentoDigital',
                'Senha Wi-Fi':'senhaWifi'
            };

            for(const[l,k]of Object.entries(m)){
                const btn=document.createElement('button');
                btn.type = 'button';
                btn.textContent=l;

                let corBg = '#1a428a';
                if(l.includes('Digital')) corBg = '#1e7e34';
                if(l.includes('Lentidão')) corBg = '#d97706';
                if(l.includes('Senha')) corBg = '#6b21a8';

                btn.style.cssText=`padding:6px 12px;background:${corBg};color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;font-family:sans-serif;box-shadow:0 2px 4px rgba(0,0,0,0.2);`;
                btn.addEventListener('click',(e)=>{ e.preventDefault(); f[k](); });
                rowMacros.appendChild(btn);
            }
            p.appendChild(rowMacros);

            // SEÇÃO 2: Alteração Rápida de Árvore
            const rowTipo = document.createElement('div');
            rowTipo.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;border-top:1px solid #2d2d2d;padding-top:8px;';

            const labelTipo = document.createElement('span');
            labelTipo.textContent = 'Tipo Atendimento:';
            labelTipo.style.cssText = 'color:#999;font-weight:bold;font-size:11px;margin-right:6px;font-family:sans-serif;';
            rowTipo.appendChild(labelTipo);

            const tButtons = [
                { text: 'Requerimento', action: tipoActions.requerimento, color: '#4b5563', textColor: '#fff' },
                { text: 'CPF', action: tipoActions.cpf, color: '#ffc107', textColor: '#000' },
                { text: 'CNPJ', action: tipoActions.cnpj, color: '#ffc107', textColor: '#000' }
            ];

            tButtons.forEach(b => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = b.text;
                btn.style.cssText = `padding:6px 12px;background:${b.color};color:${b.textColor};border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;font-family:sans-serif;box-shadow:0 2px 4px rgba(0,0,0,0.2);`;
                btn.addEventListener('click', (e) => { e.preventDefault(); b.action(); });
                rowTipo.appendChild(btn);
            });
            p.appendChild(rowTipo);

            // INJEÇÃO SEGURA: Injeta ANTES da malha grid de colunas.
            // Mantém os botões no topo do card cinza sem virar um item flex e sem criar overlays invisíveis.
            grid.before(p);
        }
        new MutationObserver(cp).observe(document.body,{childList:true,subtree:true});
        window.addEventListener('hashchange',()=>setTimeout(cp,300));
        setTimeout(cp,500);
    })();}

    // Criar Atendimento (Acessoline antiga)
    if(isAcessoLine){ (function(){
            const delay = ms => new Promise(r => setTimeout(r, ms));
            function clickItem(text) { const el = Array.from(document.querySelectorAll('span.ng-star-inserted')).filter(e => e.offsetParent !== null).find(s => s.textContent.trim() === text); if (el) el.click(); }
            async function selectDropdown(name, label) {
                const dropdown = document.querySelector(`p-dropdown[formcontrolname="${name}"]`); if (!dropdown) return;
                const trigger = dropdown.querySelector('.ui-dropdown-trigger'); if (!trigger) return;
                trigger.click(); await delay(200);
                const option = Array.from(document.querySelectorAll('li.ui-dropdown-item')).filter(li => li.offsetParent !== null).find(li => li.getAttribute('aria-label') === label);
                if (option) option.click(); await delay(200);
            }
            async function expandSuporteResidencialSeNecessario() {
                const subSelecionados = ['SUP RES - CLIENTE CRÍTICO','SUP RES - INTERNET LENTIDÃO','SUP RES - INTERNET SEM ACESSO','SUP RES - STREAMING TV','SUP RES - TELEFONE','SUP RES - VISITA CONSULTIVA'];
                const anySub = Array.from(document.querySelectorAll('span.ng-star-inserted')).filter(e => e.offsetParent !== null).some(s => subSelecionados.includes(s.textContent.trim()));
                if (!anySub) {
                    const node = Array.from(document.querySelectorAll('div.ui-treenode-content')).find(div => div.querySelector('span.ng-star-inserted')?.textContent.trim() === 'SUPORTE RESIDENCIAL');
                    if (node) { const toggler = node.querySelector('.ui-tree-toggler.pi-caret-right'); if (toggler) { toggler.click(); await delay(150); } }
                    clickItem('SUPORTE RESIDENCIAL'); await delay(150);
                }
            }
            async function atendimentoSemAcesso() { await expandSuporteResidencialSeNecessario(); clickItem('SUPORTE TÉCNICO - PF'); await delay(200); await selectDropdown('codcatoco','Tecnico'); await selectDropdown('codmvis','SUP RES - Sem conexão / Indisponibilidade'); }
            async function atendimentoLentidao() { await expandSuporteResidencialSeNecessario(); clickItem('SUPORTE TÉCNICO - PF'); await delay(200); await selectDropdown('codcatoco','Tecnico'); await selectDropdown('codmvis','SUP RES - Lentidão'); }

            function createALPanel() {
                if (document.getElementById('al-panel')) return;
                const ancora = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
                if(!ancora) return;
                const grid = ancora.closest('.ui-g') || ancora.closest('.row') || ancora.closest('.p-grid');
                if(!grid) return;

                const panel = document.createElement('div'); panel.id='al-panel'; panel.style.cssText='margin-bottom:15px;display:flex;gap:10px;width:100%;position:relative;clear:both;';
                const botao=(lbl,onClick,cor)=>{
                    const b=document.createElement('button');
                    b.type = 'button';
                    b.textContent=lbl;
                    b.style.cssText=`padding:6px 12px;background:${cor};color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;`;
                    b.addEventListener('click',onClick);
                    return b;
                };
                panel.appendChild(botao('Sem acesso',atendimentoSemAcesso,'#1a428a'));
                panel.appendChild(botao('Lentidão',atendimentoLentidao,'#a02121'));
                grid.before(panel);
            }
            new MutationObserver(createALPanel).observe(document.body,{childList:true,subtree:true});
            window.addEventListener('hashchange',()=>setTimeout(createALPanel,300));
            setTimeout(createALPanel,500);
        })();
    }
})();
