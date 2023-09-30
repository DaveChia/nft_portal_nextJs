import Web3 from "web3";
import ContractDetails from "/contracts/NftContract.json";

async function initializeWeb3() {
  // Check if Web3 is already available (e.g., from MetaMask)
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    try {
      // Request account access if needed
      await window.ethereum.enable();
      const web3 = window.web3;

      // Initialize your contract
      const contractInstance = new web3.eth.Contract(
        ContractDetails.abi,
        ContractDetails.contractAddress
      );

      return contractInstance;
    } catch (error) {
      console.error("User denied account access:", error);
      return null;
    }
  } else {
    console.error("No Ethereum provider detected");
    return null;
  }
}

export default initializeWeb3;
