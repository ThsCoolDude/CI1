require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  // Connect to Sepolia network
  const provider = new ethers.providers.JsonRpcProvider(process.env.VITE_SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.VITE_PRIVATE_KEY, provider);

  console.log('Deploying contracts with the account:', wallet.address);

  // Read contract source
  const contractPath = path.join(__dirname, 'CryptoInvoice.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  // Compile contract
  const solc = require('solc');
  const input = {
    language: 'Solidity',
    sources: {
      'CryptoInvoice.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts['CryptoInvoice.sol']['CryptoInvoice'];

  // Deploy contract
  const factory = new ethers.ContractFactory(
    contract.abi,
    contract.evm.bytecode.object,
    wallet
  );

  const feeWallet = process.env.VITE_FEE_WALLET_ADDRESS;
  console.log('Fee wallet address:', feeWallet);

  const deployedContract = await factory.deploy(feeWallet);
  await deployedContract.deployed();

  console.log('Contract deployed to:', deployedContract.address);

  // Save contract address and ABI
  const deploymentInfo = {
    address: deployedContract.address,
    abi: contract.abi,
  };

  fs.writeFileSync(
    path.join(__dirname, 'deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 