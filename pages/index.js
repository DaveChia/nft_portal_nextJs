import React, { useState, useEffect } from "react";
import styles from "/styles/index.module.css";
import nftContractJson from "/contracts/NftContract.json";

const { Web3, eth } = require("web3");

function Index() {
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState(null);
  const [contract, setContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);

  let abi = nftContractJson.abi;
  let contractAddress = nftContractJson.contractAddress;

  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Please install Metamask on your browser!");
    } else {
      console.log("Wallet exists, lets go!");
    }

    const accounts = await ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length != 0) {
      const account = accounts[0];
      console.log("Account found: ", account);
      setCurrentAccount(account);
    } else {
      console.log("An authorized account is not found!");
    }
  };

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please install Metamask!");
    }

    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Found an account! Address: ", accounts[0]);

      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };

  const mintNftHandler = () => {
    console.log("I am triggering this");

    let w3 = new Web3(ethereum);
    setWeb3(w3);

    console.log("w3 ", w3);

    let c = new w3.eth.Contract(abi, contractAddress);
    setContract(c);

    console.log("c", c);

    let encoded = c.methods
      .mint(
        "0x5544aeB07f7889a8525F7ccA994f685c5725E7B0",
        "abcdefg002",
        "www.google.com/ipfs"
      )
      .encodeABI();

    console.log("address", currentAccount);

    let tx = {
      from: currentAccount,
      to: contractAddress,
      data: encoded,
      nonce: "0x00",
      value: 0,
    };

    console.log("encoded", encoded);

    let txHash = ethereum
      .request({
        method: "eth_sendTransaction",
        params: [tx],
      })
      .then((hash) => {
        console.log("You can now view your transaction with hash: " + hash);

        // TODO: need to find a way to get the ipfs url of the NFT after minting to display it

        c.methods
          .addresses_minting_data(contractAddress)
          .call()
          .then((_test) => {
            // Optionally set it to the state to render it using React
            console.log(_test);
            console.log("done");
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  };

  const connectWalletButton = () => {
    return (
      <button
        onClick={connectWalletHandler}
        className={`${styles["button"]} ${styles["connect-wallet-button"]}`}
      >
        Connect Wallet
      </button>
    );
  };

  const mintNftButton = () => {
    return (
      <button
        onClick={mintNftHandler}
        className={`${styles["button"]} ${styles["mint-nft-button"]}`}
      >
        Mint NFT
      </button>
    );
  };

  useEffect(() => {
    checkWalletIsConnected();
  }, []);

  return (
    <div className={styles["main-app"]}>
      <h1>NFT Web Application</h1>
      <div>{currentAccount ? mintNftButton() : connectWalletButton()}</div>
    </div>
  );
}

export default Index;
