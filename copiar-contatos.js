// ==UserScript==
// @name         Copiar Contatos - Varela
// @description  Coleta todos os números do cliente e insere uma mensagem de contato no clipboard.
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gegnet.com.br
// @namespace    http://tampermonkey.net/
// @version      1.0
// @author       ovarela
// @match        https://integrator6.alt.com.br/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
'use strict';

let botao;

/* =========================
   EXTRAIR TELEFONE BR
========================= */

function extrairTelefone(texto){

    let match = texto.match(/(\+?55\s*)?\(?\d{2}\)?\s*9?\s*\d{4}-?\d{4}/);

    if(!match) return null;

    let numero = match[0].replace(/\D/g,'');

    if(numero.startsWith("55")){
        numero = numero.slice(2);
    }

    if(!numero.startsWith("0")){
        numero = "0" + numero;
    }

    return numero;
}

/* =========================
   CHAVE PARA DUPLICADOS
========================= */

function chaveComparacao(numero){

    let n = numero.slice(1);

    let ddd = n.slice(0,2);
    let resto = n.slice(2);

    if(resto.length === 9 && resto.startsWith("9")){
        resto = resto.slice(1);
    }

    return ddd + resto;
}

/* =========================
   COLETAR TELEFONES
========================= */

function coletarNumeros(){

    let mapa = new Map();

    document.querySelectorAll(".tabela-item").forEach(el => {

        let numero = extrairTelefone(el.innerText);

        if(!numero) return;

        let chave = chaveComparacao(numero);

        if(!mapa.has(chave)){
            mapa.set(chave, numero);
            return;
        }

        let atual = numero;
        let existente = mapa.get(chave);

        let atualTem9 = atual.length === 12;
        let existenteTem9 = existente.length === 12;

        /* PRIORIDADE PARA CELULAR COM 9 */

        if(atualTem9 && !existenteTem9){
            mapa.set(chave, atual);
        }

    });

    return [...mapa.values()];
}

/* =========================
   ABRIR CONTATOS
========================= */

function abrirContatos(){

    document.querySelectorAll(".ui-fieldset").forEach(fs=>{

        let titulo = fs.querySelector(".ui-fieldset-legend-text");

        if(!titulo) return;

        if(titulo.innerText.trim() === "Contatos"){

            let link = fs.querySelector("legend a");

            if(link && link.getAttribute("aria-expanded") === "false"){
                link.click();
            }

        }

    });

}

/* =========================
   GERAR TEXTO
========================= */

function gerarTexto(numeros){

    let linhas = numeros.map(n =>
        `${n} - Caixa Postal | SZ: --`
    );

    return `Tentado contato telefônico:\n${linhas.join('\n')}`;
}

/* =========================
   EXECUTAR
========================= */

function executar(){

    abrirContatos();

    setTimeout(()=>{

        let numeros = coletarNumeros();

        if(!numeros.length){
            alert("Nenhum telefone encontrado.");
            return;
        }

        let texto = gerarTexto(numeros);

        GM_setClipboard(texto);

        botao.innerText = "Copiado!";

        setTimeout(()=>{
            botao.innerText = "Copiar Telefones";
        },2000);

    },1200);

}

/* =========================
   INSERIR BOTÃO
========================= */

function inserirBotao(){

    if(document.getElementById("btnCopiarTelefones")) return;

    let icone = document.querySelector(".glyphicon-pencil");

    if(!icone) return;

    let editar = icone.closest("button");

    if(!editar) return;

    botao = document.createElement("button");

    botao.id = "btnCopiarTelefones";
    botao.className = editar.className;

    botao.innerText = "Copiar Telefones";

    botao.style.marginLeft = "8px";

    botao.onclick = executar;

    editar.insertAdjacentElement("afterend",botao);
}

/* =========================
   OBSERVAR DOM (ANGULAR)
========================= */

const observer = new MutationObserver(()=>{
    inserirBotao();
});

observer.observe(document.body,{
    childList:true,
    subtree:true
});

})();