/*:
 * @target MZ
 * @plugindesc Integração Thirdweb sem Client ID
 * @author SeuNome
 *
 * @command connectWallet
 * @text Conectar Carteira
 * @desc Abre o modal de conexão de carteira
 *
 * @help
 * Este plugin usa apenas carteiras Web3 básicas sem necessidade de Client ID
 */

(() => {
    const pluginName = "ThirdwebNoClientPlugin";

    // Lista de carteiras suportadas sem necessidade de client ID
    const wallets = [
        "metamask",
        "coinbase",
        "walletconnect"
    ];

    let currentWallet = null;

    // Função para conectar carteira
    async function connectWallet() {
        try {
            // Verifica se o MetaMask está instalado
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (accounts.length > 0) {
                    currentWallet = accounts[0];
                    $gameVariables.setValue(1, currentWallet);
                    $gameMessage.add("Carteira conectada!");
                    $gameMessage.add("Endereço: " + currentWallet.substring(0, 10) + "...");

                    // Adiciona listeners para eventos da carteira
                    setupWalletListeners();
                }
            } else {
                $gameMessage.add("Por favor, instale uma carteira Web3!");
            }
        } catch (error) {
            console.error("Erro ao conectar carteira:", error);
            $gameMessage.add("Erro ao conectar carteira!");
        }
    }

    // Configurar listeners de eventos da carteira
    function setupWalletListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }
    }

    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            currentWallet = null;
            $gameVariables.setValue(1, '');
            $gameMessage.add("Carteira desconectada!");
        } else if (accounts[0] !== currentWallet) {
            currentWallet = accounts[0];
            $gameVariables.setValue(1, currentWallet);
            $gameMessage.add("Conta alterada!");
        }
    }

    function handleChainChanged() {
        $gameMessage.add("Rede alterada!");
    }

    // Registra os comandos do plugin
    PluginManager.registerCommand(pluginName, "connectWallet", connectWallet);

    // Adiciona funções úteis para uso em eventos
    window.$gameWallet = {
        connect: connectWallet,
        disconnect: async () => {
            currentWallet = null;
            $gameVariables.setValue(1, '');
            $gameMessage.add("Carteira desconectada!");
        },
        getAddress: () => currentWallet,
        isConnected: () => !!currentWallet
    };

    // Funções básicas para interagir com contratos
    window.$gameWallet.contract = {
        async call(contractAddress, abi, method, ...args) {
            if (!currentWallet || !window.ethereum) return null;

            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(contractAddress, abi, provider);
                return await contract[method](...args);
            } catch (error) {
                console.error("Erro ao chamar contrato:", error);
                return null;
            }
        },

        async send(contractAddress, abi, method, ...args) {
            if (!currentWallet || !window.ethereum) return null;

            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(contractAddress, abi, signer);
                const tx = await contract[method](...args);
                return await tx.wait();
            } catch (error) {
                console.error("Erro ao enviar transação:", error);
                return null;
            }
        }
    };
})();