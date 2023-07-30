# DApp - Fund Me
- This repository contains plain HTML, CSS, and JavaScript that is used to create a simple frontend interface for the FundMe smart contract.
- It uses an ethers.min.js file that imports the **ethers** library to interact with the smart contract.
- It also uses the Metamask browser extension that can be used to interact with the blockchain.

  Netlify Deploy: [**https://dappfundme.netlify.app**](https://dappfundme.netlify.app/)
<br><br>
# Getting Started
### Requirements
  - **[git](https://git-scm.com/downloads)**
      - Download and install git from this link
      - Verify installation by running `git --version` in the terminal to see an output like `git version x.y.z`
  - **[Metamask](https://book.getfoundry.sh/)**
      - This is a browser extension that lets you interact with the blockchain.
### Setup
  - Clone the repository: <br><br>
      ```bash
      git clone https://github.com/Cyfrin/dapp-fund-me
      cd dapp-fund-me
      ```
      Setup completed!<br>
### Run the HTML file
  - Right-click the file in your VSCode and select "open with live server".
  - Click on the "Connect" button and you should see a Metamask popup
<br><br>
# Make Transactions
  - To fund the contract used in this repo, just hit the fund button and confirm the click confirm in the Metamask pop-up.
  - Wait for the transaction to complete and you will see the notification (Funded Successfully)
  - Check the contract balance by clicking on the balance button
  - Look for the changes made in the Transactions and Insights boxes<br>
  ### And Voilà! You just made a transaction.🥳
  ### But wait... there's something more you can do!
  <br><br>
  ## Make Transaction to your own contract:
  - Follow these steps to deploy your FundMe contract:
    
    ```bash
    git clone https://github.com/Cyfrin/foundry-fund-me
    cd foundry-fund-me
    forge build
    ```
  - Create a .env file similar to the .env.example file and replace the existing values with your own
  - Deploy on Sepolia/Mumbai by running the command:
  
      ```bash
      forge script script/DeployFundMe.s.sol --rpc-url $NETWORK_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
      ```
  - Update your constants.js with the deployed contract address.
    <br>Replace the SepliaETH / mMATIC values in the `contractAddress` object with your contract address.
  - Refresh the frontend page and now you will see your contract address shown in the contract label and the owner is your account address.
  - Input an amount and hit the fund button.
  - Switch to the account that deployed the address using Metamask. Now hit the withdraw button to send all funds to your account.

# Thank You!
If you find this useful, feel free to contribute to this project by adding more functionality or finding any bugs 🤝

## You can also donate! 💸
**Metamsk Account Address**: 0x2726c81f38f445aEBA4D54cc74CBca4f51597D17
  

