import React, { useState, useEffect } from "react";
import styles from "/styles/index.module.css";
import nftContractJson from "/contracts/NftContract.json";

const { Web3, eth } = require("web3");

function Index() {
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState(null);
  const [contract, setContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [nricFieldError, setNricFieldError] = useState("");

  let abi = nftContractJson.abi;
  let contractAddress = nftContractJson.contractAddress;
  let nftMetadataUrl = "";
  const [nftImageUrl, setNftImageUrl] = useState("");

  const checkContractMetadataUrl = async () => {
    let w3 = new Web3(ethereum);
    setWeb3(w3);
    let c = new w3.eth.Contract(abi, contractAddress);
    setContract(c);

    c.methods
      .nft_metadata_ipfs_url()
      .call()
      .then((_metadata_url) => {
        nftMetadataUrl = _metadata_url;

        getNftImageUrl();
      })
      .catch((err) => console.log(err));
  };

  const getNftImageUrl = async () => {
    await fetch(nftMetadataUrl)
      .then((res) => res.json())
      .then((data) => {
        setNftImageUrl(data.image);
      })
      .catch((err) => console.log(err));
  };

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

  const connectWalletHandler = async (e) => {
    e.preventDefault();
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
        type="submit"
        className={`${styles["button"]} ${styles["mint-nft-button"]}`}
      >
        Mint NFT
      </button>
    );
  };

  useEffect(() => {
    checkContractMetadataUrl();
    checkWalletIsConnected();
  }, []);

  const [formBody, setFormBody] = useState({
    nric: "",
    wallet: "",
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (formBody.nric === "") return alert("NRIC cannot be empty!");

    if (currentAccount === null || currentAccount === "")
      return alert(
        "Unexpected Error, wallet address has not been not retrieved!"
      );

    formBody.wallet = currentAccount;

    await fetch("http://127.0.0.1:8080/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formBody),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("result", data);

        if (data.hasOwnProperty("errors")) {
          // throw error and dont do minting
          console.log("error encountered, dont do minting", data);
          setNricFieldError(data["errors"][0]["error"]);
        } else {
          mintNftHandler();
          setNricFieldError("");
        }
      });
  };

  return (
    <div className={styles["main-app"]}>
      <h1>NFT Web Application</h1>
      <img className={styles["nft-image-wrapper"]} src={nftImageUrl}></img>
      <form
        onSubmit={onSubmit}
        className="w-1/3 justify-center border-2 flex flex-col gap-4 m-4 p-2"
      >
        <label htmlFor="nric">NRIC</label>
        <input
          className="border-2 border-gray-200 p-2"
          onChange={() => {
            setFormBody({ ...formBody, nric: event.target.value });
          }}
        ></input>

        <p>{nricFieldError}</p>

        <div>{currentAccount ? mintNftButton() : connectWalletButton()}</div>
      </form>
    </div>
  );
}

export default Index;
