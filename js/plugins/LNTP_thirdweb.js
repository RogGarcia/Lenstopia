/*:
 * @target MZ
 * @plugindesc Integração com Thirdweb para login com carteira Web3
 * @help
 * Este plugin permite que os jogadores conectem suas carteiras Web3 (ex. MetaMask)
 * ao jogo, utilizando o SDK da Thirdweb.
 *
 * Funções:
 * - Permite conexão com uma carteira Web3 (como MetaMask).
 * - Exibe o endereço da carteira conectada no jogo.
 * 
 * Comandos:
 * - Plugin Command: ConnectWallet
 * - Script Call: LNTP_connectWallet();
 *
 * @command ConnectWallet
 * @text Conectar Carteira
 * @desc Conecta a carteira do jogador via Web3.
 */

(() => {
    // URL para o SDK da Thirdweb
    const thirdwebScriptUrl = "https://unpkg.com/@thirdweb-dev/sdk@latest/dist/thirdweb.min.js";

    // Função para carregar o SDK da Thirdweb
    function loadThirdwebSDK(callback) {
        const script = document.createElement("script");
        script.src = thirdwebScriptUrl;
        script.onload = callback;
        document.body.appendChild(script);
    }

    // Função para exibir o endereço da carteira no jogo
    function displayWalletAddress(address) {
        $gameMessage.add("Carteira conectada: " + address);
    }

    // Função principal para conectar a carteira (global para eventos)
    window.LNTP_connectWallet = async function () {
        if (!window.thirdweb) {
            console.error("SDK da Thirdweb não carregado!");
            $gameMessage.add("Erro: SDK da Thirdweb não foi carregado.");
            return;
        }

        const sdk = new thirdweb.ThirdwebSDK("mumbai"); // Rede de teste Mumbai (Polygon)
        try {
            const address = await sdk.wallet.connect();
            console.log("Endereço da carteira:", address);
            displayWalletAddress(address); // Exibe mensagem no jogo
        } catch (error) {
            console.error("Erro ao conectar a carteira:", error);
            $gameMessage.add("Falha ao conectar com a carteira.");
        }
    };

    // Comando de plugin para conectar a carteira
    PluginManager.registerCommand("LNTP_thirdweb", "ConnectWallet", () => {
        window.LNTP_connectWallet();
    });

    // Carregar o SDK e exibir uma mensagem de inicialização
    loadThirdwebSDK(() => {
        console.log("SDK da Thirdweb carregado com sucesso!");
    });
})();
