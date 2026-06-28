// ==UserScript==
// @name         Documentação - Ax2 & WS
// @version      2026-05-03
// @description  Coleta instantânea via API lendo as flags de AutoChannelEnable
// @author       Varela
// @downloadURL  https://github.com/gu1zo/scriptsGG/blob/main/documentar-roteadores.user.js
// @updateURL    https://github.com/gu1zo/scriptsGG/blob/main/documentar-roteadores.user.js
// @match        *://*/html/index.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gegnet.com.br
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    const ip = window.location.hostname;
    const url_api = window.location.protocol + "//" + ip + "/api/";

    const headers = {
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Host": ip,
        "X-Requested-With": "XMLHttpRequest",
        "_ResponseFormat": "JSON"
    };

    function showToast(mensagem) {
        const toast = document.createElement("div");
        toast.innerText = mensagem;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.backgroundColor = "#4caf50";
        toast.style.color = "white";
        toast.style.padding = "12px 24px";
        toast.style.borderRadius = "8px";
        toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
        toast.style.zIndex = "999999";
        toast.style.fontFamily = "Arial, sans-serif";
        toast.style.fontSize = "14px";
        toast.style.transition = "opacity 0.5s ease-in-out";

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    async function apiFetch(endpoint) {
        try {
            let res = await fetch(url_api + endpoint, { headers });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // Função que cruza os dados do rádio para saber se é Auto ou Manual
    async function getWifiConfig(type) {
        // Busca a configuração raiz do roteador em vários endpoints possíveis da Huawei
        let config = await apiFetch(`ntwk/WlanBasic?type=${type}`) ||
                     await apiFetch(`ntwk/WlanAdvance?type=${type}`) ||
                     await apiFetch(`ntwk/lan_wlan?type=${type}`);

        // Busca o diagnóstico físico (qual canal está emitindo agora)
        let diag = await apiFetch(`system/diagnose_wlan_basic?type=${type}`);

        let isAuto = false;
        let canalAtual = "Erro";
        let largura = "Erro";

        // Descobre qual o canal real está sendo usado
        if (diag && diag.Channel !== undefined) {
            canalAtual = diag.Channel;
        } else if (config && config.Channel !== undefined) {
            canalAtual = config.Channel;
        }

        // Descobre se a configuração está em "Automático"
        if (config) {
            // Verifica a chave oficial da Huawei para canal automático
            if (config.AutoChannelEnable == 1 || config.AutoChannelEnable == "1" || config.AutoChannelEnable === true) isAuto = true;
            // Verifica se o canal foi salvo como 0 (que também significa Auto na API)
            if (config.Channel == 0 || config.Channel == "0" || String(config.Channel).toLowerCase() === "auto") isAuto = true;
        }

        // Redundância pelo diagnóstico
        if (diag) {
            if (diag.AutoChannelEnable == 1 || diag.AutoChannelEnable == "1") isAuto = true;
            if (diag.Channel == 0 || diag.Channel == "0" || String(diag.Channel).toLowerCase() === "auto") isAuto = true;
        }

        // A regra de ouro: Se é automático, puxa "auto". Se não é, puxa só o número.
        let canalFinal = isAuto ? "auto" : canalAtual;

        // Puxa a largura de banda
        if (config && config.Bandwidth) largura = config.Bandwidth;
        else if (diag && diag.Bandwidth) largura = diag.Bandwidth;

        if (largura !== "Erro" && !largura.includes("MHz")) largura += " MHz";
        if (largura !== "Erro" && largura.includes("MHz MHz")) largura = largura.replace("MHz MHz", "MHz");

        return { canal: canalFinal, largura };
    }

    async function coletarDados() {
        let deviceInfo = await apiFetch("system/deviceinfo");
        let modelo = deviceInfo ? deviceInfo.FriendlyName : "Não encontrado";
        let firmware = deviceInfo ? deviceInfo.SoftwareVersion : "";

        let uptimeVal = deviceInfo ? deviceInfo.UpTime : 0;
        let uptime = "Não encontrado";
        if (uptimeVal) {
            if (uptimeVal >= 86400) uptime = Math.floor(uptimeVal / 86400) + (Math.floor(uptimeVal / 86400) === 1 ? " dia" : " dias");
            else if (uptimeVal >= 3600) uptime = Math.floor(uptimeVal / 3600) + (Math.floor(uptimeVal / 3600) === 1 ? " hora" : " horas");
            else if (uptimeVal >= 60) uptime = Math.floor(uptimeVal / 60) + (Math.floor(uptimeVal / 60) === 1 ? " minuto" : " minutos");
            else uptime = uptimeVal + (uptimeVal === 1 ? " segundo" : " segundos");
        }

        let hostInfo = await apiFetch("system/HostInfo");
        let conectados = hostInfo ? hostInfo.filter(d => d.Active === true).length : 0;

        let wanInfo = await apiFetch("ntwk/wan?type=active");
        let dnsWAN = "Não encontrado";
        if (wanInfo && wanInfo.IPv4DnsServers) {
            dnsWAN = wanInfo.IPv4DnsServers.replace(/,/g, ' || ');
        }

        let wlanGuide = await apiFetch("ntwk/WlanGuideBasic?type=notshowpassall");
        let priorizar5G = (wlanGuide && (wlanGuide.DbhoEnable == 1 || wlanGuide.DbhoEnable === true || wlanGuide.DbhoEnable === "1")) ? "Habilitado" : "Desabilitado";

        let ipv6Info = await apiFetch("ntwk/ipv6_enable");
        let ipv6 = "Desabilitado";
        if (ipv6Info && (ipv6Info.Enable == 1 || ipv6Info.Enable === "1" || ipv6Info.Enable === true)) {
            let ipv6Wan = await apiFetch("ntwk/ipv6_wan");
            let tipo = ipv6Wan ? ipv6Wan.X_IPv6AddressingType : "Desconhecido";
            ipv6 = `Habilitado em ${tipo}`;
        }

        let upnpInfo = await apiFetch("ntwk/lan_upnp");
        let upnp = (upnpInfo && (upnpInfo.enable == 1 || upnpInfo.enable === true || upnpInfo.enable === "1")) ? "Habilitado" : "Desabilitado";

        // Chama a função nova
        let wifi24 = await getWifiConfig(1);
        let wifi5 = await getWifiConfig(2);

        let mensagem = `[Configurações do Roteador]
Modelo: ${modelo} ${firmware}
Equipamentos conectados: ${conectados}
DNS WAN ${dnsWAN}
DNS LAN ${dnsWAN}
Priorizar 5G ${priorizar5G}
IPv6 ${ipv6}
UPnP ${upnp}
Rede 2.4 com canal [em ${wifi24.canal}] e largura em ${wifi24.largura}
Rede 5G com canal [em ${wifi5.canal}] e largura em ${wifi5.largura}
Uptime: ${uptime}`;

        GM_setClipboard(mensagem);
        showToast("Relatório copiado com sucesso!");
    }

    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector("#internet > div")) {
            obs.disconnect();
            coletarDados();
        }
    });

    observer.observe(document, { childList: true, subtree: true });
})();
