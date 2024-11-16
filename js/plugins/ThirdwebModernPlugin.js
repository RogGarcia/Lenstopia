/*:
 * @target MZ
 * @plugindesc Integração moderna com Thirdweb para RPG Maker MZ
 * @author SeuNome
 *
 * @param clientId
 * @text Client ID Thirdweb
 * @desc Seu Client ID do Thirdweb
 * @default YOUR_CLIENT_ID
 *
 * @command showWalletModal
 * @text Mostrar Modal de Carteira
 * @desc Abre o modal de conexão de carteira
 *
 * @help
 * Plugin moderno de integração Thirdweb com múltiplas carteiras
 */

(() => {
    const pluginName = "ThirdwebModernPlugin";
    const parameters = PluginManager.parameters(pluginName);

    // Adiciona os scripts necessários
    const scripts = [
        'https://unpkg.com/@thirdweb-dev/sdk/dist/thirdweb-sdk.umd.js',
        'https://unpkg.com/@thirdweb-dev/wallets/dist/thirdweb-wallets.umd.js'
    ];

    let client;
    let currentWallet;
    let modalElement;

    // Carrega os scripts necessários
    Promise.all(scripts.map(src => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    })).then(initializeThirdweb).catch(console.error);

    async function initializeThirdweb() {
        try {
            client = createThirdwebClient({
                clientId: parameters.clientId,
            });

            // Define as carteiras disponíveis
            const wallets = [
                inAppWallet({
                    auth: {
                        options: [
                            "google",
                            "discord",
                            "email",
                            "phone",
                        ],
                    },
                }),
                createWallet("io.metamask"),
                createWallet("com.coinbase.wallet"),
                createWallet("me.rainbow")
            ];

            // Cria o modal de carteira customizado
            createWalletModal(wallets);

        } catch (error) {
            console.error("Erro ao inicializar Thirdweb:", error);
        }
    }

    function createWalletModal(wallets) {
        modalElement = document.createElement('div');
        modalElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            z-index: 9999;
            display: none;
        `;

        const walletList = document.createElement('div');
        wallets.forEach(wallet => {
            const button = document.createElement('button');
            button.style.cssText = `
                display: block;
                width: 100%;
                margin: 10px 0;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
                cursor: pointer;
            `;
            button.textContent = wallet.name || 'Conectar Carteira';
            button.onclick = () => connectWallet(wallet);
            walletList.appendChild(button);
        });

        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            border: none;
            background: none;
            cursor: pointer;
        `;
        closeButton.onclick = hideModal;

        modalElement.appendChild(closeButton);
        modalElement.appendChild(walletList);
        document.body.appendChild(modalElement);
    }

    function showModal() {
        modalElement.style.display = 'block';
    }

    function hideModal() {
        modalElement.style.display = 'none';
    }

    async function connectWallet(wallet) {
        try {
            currentWallet = await wallet.connect();
            const address = await currentWallet.getAddress();
            
            // Armazena o endereço em uma variável do jogo
            $gameVariables.setValue(1, address);
            
            $gameMessage.add("Carteira conectada!");
            $gameMessage.add("Endereço: " + address.substring(0, 10) + "...");

            hideModal();
            setupWalletListeners();

        } catch (error) {
            console.error("Erro ao conectar carteira:", error);
            $gameMessage.add("Erro ao conectar carteira!");
        }
    }

    function setupWalletListeners() {
        if (!currentWallet) return;

        currentWallet.on("disconnect", () => {
            $gameMessage.add("Carteira desconectada!");
            $gameVariables.setValue(1, "");
        });

        currentWallet.on("change", async () => {
            const newAddress = await currentWallet.getAddress();
            $gameVariables.setValue(1, newAddress);
            $gameMessage.add("Carteira alterada!");
        });
    }

    // Registra os comandos do plugin
    PluginManager.registerCommand(pluginName, "showWalletModal", () => {
        showModal();
    });

    // Adiciona funções úteis para uso em eventos
    window.$gameWallet = {
        showModal,
        hideModal,
        getAddress: async () => {
            return currentWallet ? await currentWallet.getAddress() : null;
        },
        isConnected: () => !!currentWallet,
        disconnect: async () => {
            if (currentWallet) {
                await currentWallet.disconnect();
                currentWallet = null;
            }
        }
    };
})();