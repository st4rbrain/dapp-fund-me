/* import ethers js */
import { ethers } from "./ethers-5.6.esm.min.js";
import {
    abi,
    contractAddress,
    blockExplorerLinks,
    chainIdToSymbol,
} from "./constants.js";

/* class for creating background logo animation */

class Logo {
    constructor(x, y, scaleFactor) {
        this.x = x;
        this.y = y;
        this.scaleFactor = scaleFactor; // for scaling
        this.direction = [1, -1]; // movement direction
        this.speedFactor = 5; // dec this will inc speed
        /* movement values */
        this.dx =
            (0.01 + (Math.random() * 1) / this.speedFactor) *
            this.direction[Math.floor(Math.random() * 2)];
        this.dy =
            (0.01 + (Math.random() * 1) / this.speedFactor) *
            this.direction[Math.floor(Math.random() * 2)];
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;

        /* Reverse direction if the circle reaches imgCanvas edges */
        if (this.x + this.dx > imgCanvas.width - 25 || this.x + this.dx <= 0) {
            this.dx = -this.dx;
        }
        if (this.y + this.dy > imgCanvas.height - 25 || this.y + this.dy <= 0) {
            this.dy = -this.dy;
        }
    }
}

/* state variables for elements related to the contract and network */

const connectButton = document.getElementById("connectButton");
const withdrawButton = document.getElementById("withdrawButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const ethChainLabel = document.getElementById("ethChain");
const contractAddressLabel = document.getElementById("contractAddressLabel");
const contractOwnerAddress = document.getElementById("ownerAddressLabel");
const latestFunderAddress = document.getElementById("latest-funder");
const maximumFunderAddress = document.getElementById("maximum-funder");
const latestFundAmount = document.getElementById("latest-fund-amt");
const maximumFundAmount = document.getElementById("maximum-fund-amt");
const totalFunders = document.getElementById("total-funders");
const totalFundedAmount = document.getElementById("total-funded-amt");
const ethPairPrice = document.getElementById("eth-pair-price");
const amountInput = document.getElementById("ethAmount");
const maticPairPrice = document.getElementById("matic-pair-price");
const convertedAmount = document.getElementById("converted-amt");
let blockExplorer = document.getElementById("blockExplorer");
let walletConnected = false;
const supportedNetworks = ["SepoliaETH", "mMATIC", "GO"];

/* notification and loading variables */

let currentNotificationTimeout;
const upvoteCount = document.getElementById("upvote-count");
const loading = document.getElementsByClassName("loading");
const notificationLabel = document.getElementById("notificationLabel");
const notificationValue = document.getElementById("notificationValue");
const defaultNotificationLabel = "None";
const defaultNotificationValue = "";
const notificationColor = {
    errorColor: "#f54244",
    warningColor: "#f5c242",
    successColor: "#24ffc8",
};

/* canvas related variables */

const imgCanvas = document.getElementById("imageCanvas");
imgCanvas.width = window.innerWidth;
imgCanvas.height = window.innerHeight;
const context = imgCanvas.getContext("2d");

const ethImage = new Image();
const ethImageDimension = [612, 408];
const scaleFactor = [0.015, 0.05, 0.032, 0.07];
let opacity = 1;
let opacityDec = true;
const fadeSpeed = 0.002;

ethImage.src = "./images/ethLogo.png";

const totalEthLogos = 50;
let ethLogos = [];

/* create a websocket connection to get live prices of the network */

const ws = new WebSocket("wss://stream.binance.com:9443/ws");

let inputValue = null;
let ethPrice = null;
let maticPrice = null;
let lastEthPrice = null;
let lastMaticPrice = null;

const symbols = ["maticusdt", "ethusdt", "gousd"];

/* subscribe to the network prices */

ws.onopen = () => {
    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        ws.send(
            JSON.stringify({
                method: "SUBSCRIBE",
                params: [`${symbol}@ticker`],
                id: i,
            })
        );
    }
};

/* set the prices */

ws.onmessage = (e) => {
    let message = JSON.parse(e.data);
    if (message.s === "ETHUSDT") ethPrice = parseFloat(message.c).toFixed(4);
    else if (message.s === "MATICUSDT")
        maticPrice = parseFloat(message.c).toFixed(4);
    ethPairPrice.innerHTML = ethPrice;
    ethPairPrice.style.color =
        !lastEthPrice || lastEthPrice === ethPrice
            ? "#e7e7e7"
            : lastEthPrice > ethPrice
            ? "#6eeb34"
            : "#ed3b44";
    lastEthPrice = ethPrice;

    maticPairPrice.innerHTML = maticPrice;
    maticPairPrice.style.color =
        !lastMaticPrice || lastMaticPrice === maticPrice
            ? "#e7e7e7"
            : lastMaticPrice > maticPrice
            ? "#6eeb34"
            : "#ed3b44";
    lastMaticPrice = maticPrice;
};

/* event handlers */

let upvoted = false;
let upvotes = 0;

// button clicks

withdrawButton.onclick = withdraw;
fundButton.onclick = fund;
balanceButton.onclick = showBalanceNotification;
connectButton.onclick = () => {
    if (walletConnected == false) connect();
    else disconnect();
};

// background animation
ethImage.onload = () => {
    getLogos("eth");
    animate();
};

//set network data
window.onload = async () => {
    if (typeof window.ethereum !== "undefined") {
        await setNetworkRelatedData();
    } else {
        installMetamaskNotification();
    }
};

//handling metamask events
if (typeof window.ethereum !== "undefined") {
    // network change event
    window.ethereum.on("chainChanged", async (/* chainId */) => {
        await setNetworkRelatedData();
    });

    /* account change */
    window.ethereum.on("accountsChanged", (accounts) => {
        if (walletConnected) connectButton.innerHTML = accounts[0];
        else connectButton.innerHTML = "Connect";
    });
}

// handle the input given in the amount field
amountInput.oninput = async (e) => {
    const currentChainSymbol = await getCurrentChainSymbol();
    const validInputs = "01234567989.";
    let validInputSet = new Set();
    for (const v of validInputs) {
        validInputSet.add(v);
    }
    let updateValue = true;
    inputValue = e.target.value;
    for (const c of inputValue) {
        if (!validInputSet.has(c)) {
            updateValue = false;
            break;
        }
    }
    if (updateValue) {
        if (currentChainSymbol === "SepoliaETH")
            convertedAmount.innerHTML =
                parseFloat(lastEthPrice * inputValue).toFixed(2) + " USD";
        else if (currentChainSymbol === "mMATIC")
            convertedAmount.innerHTML =
                parseFloat(lastMaticPrice * inputValue).toFixed(2) + " USD";
        else if (currentChainSymbol == "GO")
            // for local anvil mock chain - price GO/USD - 2000
            convertedAmount.innerHTML =
                parseFloat(2000 * inputValue).toFixed(2) + " USD";
    }
};

// create different eth logos for the background
const getLogos = (name) => {
    for (let i = 0; i < totalEthLogos; i++) {
        const newLogo = new Logo(
            Math.random() * imgCanvas.width,
            Math.random() * imgCanvas.height,
            scaleFactor[Math.floor(Math.random() * 4)]
        );
        if (name == "eth") {
            ethLogos.push(newLogo);
        }
    }
};

// function to animate the background
function animate() {
    context.clearRect(0, 0, imgCanvas.width, imgCanvas.height);

    for (let i = 0; i < totalEthLogos; i++) {
        const currentEthLogo = ethLogos[i];
        const ethWidth = currentEthLogo.scaleFactor * ethImageDimension[0];
        const ethHeight = currentEthLogo.scaleFactor * ethImageDimension[1];

        context.drawImage(
            ethImage,
            currentEthLogo.x,
            currentEthLogo.y,
            ethWidth,
            ethHeight
        );
        ethLogos[i].move();
    }
    // Draw the image with the current opacity
    context.globalAlpha = opacity;
    if (opacityDec) opacity -= fadeSpeed;
    else opacity += fadeSpeed;

    if (opacity <= 0) {
        setTimeout(() => {
            ethLogos = [];
            getLogos("eth");
            opacityDec = false;
        }, 0);
    }
    if (opacity >= 1)
        setTimeout(() => {
            opacityDec = true;
        }, 250);
    requestAnimationFrame(animate);
}

/* function to get the current network id */

async function getCurrentChainId() {
    if (typeof window.ethereum !== "undefined") {
        try {
            const chianId = await window.ethereum.request({
                method: "eth_chainId",
            });
            return chianId;
        } catch (error) {
            console.error("Error while fetching Chain ID:", error);
        }
    } else {
        installMetamaskNotification();
    }
}

/* get current network symbol */

async function getCurrentChainSymbol() {
    const chianId = await getCurrentChainId();
    if (chianId in chainIdToSymbol) return chainIdToSymbol[chianId];
    else return "";
}

/* connect to the metamask wallet accounts*/

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            // request metamask for accounts
            await ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
            console.error(error);
        }
        const accounts = await ethereum.request({ method: "eth_accounts" });
        walletConnected = true;
        clearTimeout(currentNotificationTimeout);

        // show connected notification
        notificationLabel.style.color = notificationColor["successColor"];
        notificationLabel.innerHTML = "Wallet Connected";
        notificationValue.innerHTML = "$$$";
        connectButton.innerHTML = accounts[0];
        resetNotification(2);
    } else {
        installMetamaskNotification();
    }
}

function disconnect() {
    walletConnected = false;
    connectButton.innerHTML = "Connect";
    clearTimeout(currentNotificationTimeout);
    notificationLabel.style.color = notificationColor["successColor"];
    notificationLabel.innerHTML = "Wallet Disonnected";
    notificationValue.innerHTML = ">_<";
    resetNotification(2);
}

/* function to call withdraw function in the smart contract */

async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        if (walletConnected) {
            if (await isSupportedNetwork()) {
                const startingBalance = await getBalance();
                const currentChainSymbol = await getCurrentChainSymbol();
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                );
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    contractAddress[currentChainSymbol],
                    abi,
                    signer
                );
                try {
                    // call the withdraw function in the contract
                    const transactionResponse = await contract.withdraw();
                    clearTimeout(currentNotificationTimeout);

                    // show withdrawing notification
                    notificationLabel.style.color =
                        notificationColor["warningColor"];
                    notificationLabel.innerHTML = "Withdrawing...";

                    // wait for transaction completion
                    await listenForTransactionMine(
                        transactionResponse,
                        provider
                    );
                    clearTimeout(currentNotificationTimeout);

                    // show success withdraw notification
                    notificationLabel.style.color =
                        notificationColor["successColor"];
                    notificationLabel.innerHTML = "Withdrawn";
                    notificationValue.innerHTML =
                        ethers.utils.formatEther(startingBalance) +
                        "  " +
                        currentChainSymbol;
                    resetNotification(5);
                } catch (error) {
                    if (error.code != 4001) {
                        // show error if not called by owner
                        notification(
                            notificationColor["errorColor"],
                            "Not Owner",
                            "error"
                        );
                        resetNotification(3);
                    }
                    console.log(error);
                }
            } else {
                // show error if not on any supported network
                notification(
                    notificationColor["warningColor"],
                    "Network Unsupported",
                    "warning"
                );
                resetNotification(3);
            }
        } else {
            // show error if wallet not connected
            notification(
                notificationColor["errorColor"],
                "Connect Wallet",
                "error"
            );
            resetNotification(3);
        }
    } else {
        installMetamaskNotification();
    }
}

/* function to call the fund function of the contract */

async function fund() {
    if (typeof window.ethereum !== "undefined") {
        if (walletConnected) {
            if (await isSupportedNetwork()) {
                const currentChainSymbol = await getCurrentChainSymbol();
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                );
                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    contractAddress[currentChainSymbol],
                    abi,
                    signer
                );
                try {
                    const amount = amountInput.value;
                    // call the fund function
                    const transactionResponse = await contract.fund({
                        value: ethers.utils.parseEther(amount),
                    });
                    clearTimeout(currentNotificationTimeout);

                    // set funding notification
                    notificationLabel.style.color =
                        notificationColor["warningColor"];
                    notificationLabel.innerHTML = "Funding...";

                    // wait for transaction completion
                    await listenForTransactionMine(
                        transactionResponse,
                        provider
                    );

                    // update data in the side boxes after successful transaction
                    await setSideBoxDetails();
                    // reset converted amount
                    convertedAmount.innerHTML = "0.00 USD";

                    // show success notification
                    const currentChainSymbol = await getCurrentChainSymbol();
                    clearTimeout(currentNotificationTimeout);
                    notificationLabel.style.color =
                        notificationColor["successColor"];
                    notificationLabel.innerHTML = "Successfully Funded";
                    notificationValue.innerHTML =
                        amount + "  " + currentChainSymbol;
                    document.getElementById("ethAmount").value = "";
                    resetNotification(5);
                } catch (error) {
                    if (error.code != 4001) {
                        // show error if the input field doesn't contain valid value of submitting
                        notification(
                            notificationColor["errorColor"],
                            "Invalid Value",
                            "error"
                        );
                        resetNotification(3);
                    }
                    console.log(error);
                }
            } else {
                // show error if the network is not supported
                notification(
                    notificationColor["warningColor"],
                    "Network Unsupported",
                    "warning"
                );
                resetNotification(3);
            }
        } else {
            // show error if wallet not connected
            notification(
                notificationColor["errorColor"],
                "Connect Wallet",
                "error"
            );
            resetNotification(3);
        }
    } else {
        installMetamaskNotification();
    }
}

/* function to get the balance of the smart contract */

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        if (walletConnected) {
            if (await isSupportedNetwork()) {
                const currentChainSymbol = await getCurrentChainSymbol();
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                );
                try {
                    // call the getbalance function using metamask
                    const balance = await provider.getBalance(
                        contractAddress[currentChainSymbol]
                    );
                    return balance;
                } catch (error) {
                    console.log(error);
                }
            } else {
                // error if on unsupported network
                notification(
                    notificationColor["warningColor"],
                    "Network Unsupported",
                    "warning"
                );
                resetNotification(3);
            }
        } else {
            // if wallet not connected
            return -1;
        }
    } else {
        // if metamask not installed
        return -2;
    }
}

/* show the balance on the UI after getBalance */

async function showBalanceNotification() {
    const balance = await getBalance();
    if (balance >= 0) {
        const currentChainSymbol = await getCurrentChainSymbol();
        clearTimeout(currentNotificationTimeout);

        // show the balance notification
        notificationLabel.style.color = notificationColor["successColor"];
        notificationLabel.innerHTML = "Contract Balance";
        notificationValue.innerHTML =
            ethers.utils.formatEther(balance) + "  " + currentChainSymbol;
        resetNotification(3);
    } else if (balance == -1) {
        notification(
            notificationColor["errorColor"],
            "Connect Wallet",
            "error"
        );
        resetNotification(3);
    } else if (balance == -2) {
        installMetamaskNotification();
    }
}

/* function to reset the notification area to none after given time */

const resetNotification = (seconds) => {
    currentNotificationTimeout = setTimeout(function () {
        notificationLabel.innerHTML = defaultNotificationLabel;
        notificationValue.innerHTML = defaultNotificationValue;
        notificationLabel.style.color = notificationColor["successColor"];
    }, seconds * 1000);
};

/* function for the format of similar types of notifications */

const notification = (col, msg, type) => {
    clearTimeout(currentNotificationTimeout);
    notificationLabel.style.color = col;

    if (type == "error") {
        // error notification
        notificationValue.innerHTML = "-__-";
        notificationLabel.innerHTML = "Error : " + msg;
    } else {
        // warning notification
        notificationValue.innerHTML = ">_<";
        notificationLabel.innerHTML = msg;
    }
};

/* check if current network if supported */

const isSupportedNetwork = async () => {
    const currentNetwork = await getCurrentChainSymbol();
    for (const network of supportedNetworks)
        if (network == currentNetwork) return true;
    return false;
};

/* function for formatting the amount received by the contract */

const formatAmount = (amount) => {
    return parseFloat(amount / 1e18).toFixed(4);
};

/* set the sidebox - transactions and insights details */

const setSideBoxDetails = async () => {
    const currentNetwork = await getCurrentChainSymbol();
    loading[0].innerHTML = "Loading...";
    loading[1].innerHTML = "Loading...";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
        contractAddress[currentNetwork],
        abi,
        signer
    );

    // set all fields to empty initially
    latestFundAmount.innerHTML = "";
    maximumFundAmount.innerHTML = "";
    latestFunderAddress.innerHTML = "";
    maximumFunderAddress.innerHTML = "";
    try {
        // call the contract getter functions
        const numberOfFunders = await contract.getNumberOfFunders();
        const latestFundAmt = await contract.getLatestAmountFunded();
        const maximumFundAmt = await contract.getMaximumAmountFunded();
        const maximumFunder = await contract.getMaximumAmountFunder();
        const latestFunder = await contract.getFunder(
            parseInt(numberOfFunders, 16) - 1
        );
        const numFunders = await contract.getNumberOfFunders();
        const fundedAmt = await contract.getTotalAmountFunded();

        loading[0].innerHTML = "";
        loading[1].innerHTML = "";

        // update the field with the returned values
        totalFunders.innerHTML = numFunders;
        totalFundedAmount.innerHTML =
            formatAmount(fundedAmt) + "&nbsp;&nbsp;" + currentNetwork;
        latestFunderAddress.innerHTML = latestFunder;
        maximumFunderAddress.innerHTML = maximumFunder;
        latestFundAmount.innerHTML =
            formatAmount(latestFundAmt) + "&nbsp;&nbsp;" + currentNetwork;
        maximumFundAmount.innerHTML =
            formatAmount(maximumFundAmt) + "&nbsp;&nbsp;" + currentNetwork;
    } catch (error) {
        console.error(error);
    }
};

const setNetworkRelatedData = async () => {
    const currentNetwork = await getCurrentChainSymbol();
    if (currentNetwork in contractAddress) {
        ethChainLabel.innerHTML = currentNetwork;
        loading[0].innerHTML = "Loading...";
        loading[1].innerHTML = "Loading...";
        contractAddressLabel.innerHTML = contractAddress[currentNetwork];
        if (currentNetwork != "GO")
            blockExplorer.href =
                blockExplorerLinks[currentNetwork] +
                "/address/" +
                contractAddress[currentNetwork];
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            contractAddress[currentNetwork],
            abi,
            signer
        );
        latestFundAmount.innerHTML = "";
        maximumFundAmount.innerHTML = "";
        latestFunderAddress.innerHTML = "";
        maximumFunderAddress.innerHTML = "";
        totalFundedAmount.innerHTML = "";
        totalFunders.innerHTML = "";

        try {
            const owner = await contract.getOwner();
            const numberOfFunders = await contract.getNumberOfFunders();
            contractOwnerAddress.innerHTML = owner;

            // call getter functions only if there is at least one funder
            if (parseInt(numberOfFunders, 16)) {
                const latestFundAmt = await contract.getLatestAmountFunded();
                const maximumFundAmt = await contract.getMaximumAmountFunded();
                const maximumFunder = await contract.getMaximumAmountFunder();
                const latestFunder = await contract.getFunder(
                    parseInt(numberOfFunders, 16) - 1
                );
                const numFunders = await contract.getNumberOfFunders();
                const fundedAmt = await contract.getTotalAmountFunded();

                loading[0].innerHTML = "";
                loading[1].innerHTML = "";

                // replace field values with the ones returned
                latestFunderAddress.innerHTML = latestFunder;
                maximumFunderAddress.innerHTML = maximumFunder;
                totalFunders.innerHTML = numFunders;
                totalFundedAmount.innerHTML =
                    formatAmount(fundedAmt) + "&nbsp;&nbsp;" + currentNetwork;
                latestFundAmount.innerHTML =
                    formatAmount(latestFundAmt) +
                    "&nbsp;&nbsp;" +
                    currentNetwork;
                maximumFundAmount.innerHTML =
                    formatAmount(maximumFundAmt) +
                    "&nbsp;&nbsp;" +
                    currentNetwork;
            } else {
                // updated field values if not data present
                loading[0].innerHTML = "";
                loading[1].innerHTML = "";
                latestFundAmount.innerHTML = "---- None ----";
                maximumFundAmount.innerHTML = "---- None ----";
                latestFunderAddress.innerHTML = "";
                maximumFunderAddress.innerHTML = "";
                totalFundedAmount.innerHTML = "---- None ----";
                totalFunders.innerHTML = "---- None ----";
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        // set all the field to their default values
        contractAddressLabel.innerHTML = "Not Deployed on this Network";
        contractOwnerAddress.innerHTML = "";
        latestFundAmount.innerHTML = "";
        maximumFundAmount.innerHTML = "";
        latestFunderAddress.innerHTML = "";
        maximumFunderAddress.innerHTML = "";
        totalFundedAmount.innerHTML = "";
        totalFunders.innerHTML = "";
    }
};

/* notify to install metamask if not present */

const installMetamaskNotification = () => {
    notificationLabel.style.color = notificationColor["warningColor"];
    notificationLabel.innerHTML = "Install MetaMask";
};

/* wait for transaction completion after calling withdraw and fund function */

function listenForTransactionMine(transactionResponse, provider) {
    // console.log(`Mining ${transactionResponse.hash}`);
    return new Promise((resolve) => {
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            console.log(
                `Completed with ${transactionReceipt.confirmations} confirmations.`
            );
            resolve();
        });
    });
}
