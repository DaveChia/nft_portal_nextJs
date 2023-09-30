import React, { useState, useEffect } from "react";
import initializeWeb3 from "/utilities/Web3Initializer.js";
import styles from "/styles/index.module.css";
import nftContractJson from "/contracts/NftContract.json";
import Head from "next/head";

const { Web3, eth } = require("web3");

function Index() {
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [enableMintButton, setEnableMintButton] = useState(false);
  const [nricFieldError, setNricFieldError] = useState("");

  let abi = nftContractJson.abi;
  let contractAddress = nftContractJson.contractAddress;
  let nftMetadataUrl = "";
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [nftName, setNftName] = useState(null);
  const [nftDecription, setNftDecription] = useState(null);
  const [nftMaxMintCount, setNftMaxMintCount] = useState(0);
  const [nftCurrentMintCount, setNftCurrentMintCount] = useState(0);

  const getContractMetadata = (contract) => {
    contract.methods
      .nft_metadata_ipfs_url()
      .call()
      .then((_metadata_url) => {
        nftMetadataUrl = _metadata_url;

        getNftImageUrl();
      })
      .catch((err) => console.log(err));
  };

  const getContractMaximumMintCount = (contract) => {
    contract.methods
      .nft_minting_maximum_count()
      .call()
      .then((_count) => {
        console.log(_count);

        setNftMaxMintCount(parseInt(_count));
      })
      .catch((err) => console.log(err));
  };

  const getContractRemainingMintCount = (contract) => {
    contract.methods
      .nft_minting_current_count()
      .call()
      .then((_count) => {
        console.log(_count);

        setNftCurrentMintCount(parseInt(_count));
      })
      .catch((err) => console.log(err));
  };

  const getNftImageUrl = async () => {
    await fetch(nftMetadataUrl)
      .then((res) => res.json())
      .then((data) => {
        setNftImageUrl(data.image);
        setNftDecription(data.description);
        setNftName(data.name);
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

  const connectWallet = () => {
    return (
      <button
        onClick={connectWalletHandler}
        className={`${styles["button"]} ${styles["connect-wallet-button"]}`}
      >
        Connect Wallet
      </button>
    );
  };

  const mintNft = () => {
    return (
      <div className={styles["mint-actions-wrapper"]}>
        <form onSubmit={onSubmit}>
          <input
            className={styles["nric-input"]}
            value={formBody.nric}
            onChange={() => {
              const value = event.target.value;
              // Use a regular expression to match only alphanumeric characters
              const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");
              setEnableMintButton(alphanumericValue.length >= 8);
              setFormBody({ ...formBody, nric: alphanumericValue });
            }}
            placeholder="Enter NRIC here"
          ></input>
          <div>
            <small>
              The NRIC must be of at least 8 alphanumeric characters
            </small>
          </div>

          <button
            type="submit"
            className={`${styles["button"]} ${styles["mint-nft-button"]} ${
              enableMintButton == false ? styles["button-disabled"] : null
            }`}
          >
            Mint NFT
          </button>
        </form>
      </div>
    );
  };

  const spinner = () => {
    return <div className={styles["loader"]}></div>;
  };

  const nftImage = () => {
    return (
      <img
        className={styles["card-image"]}
        src={nftImageUrl}
        alt="Nft Image"
      ></img>
    );
  };

  useEffect(() => {
    checkWalletIsConnected();
    initializeContract();
    async function initializeContract() {
      try {
        const contractInstance = await initializeWeb3();

        if (contractInstance) {
          getContractMetadata(contractInstance);
          getContractMaximumMintCount(contractInstance);
          getContractRemainingMintCount(contractInstance);
        } else {
          console.error("Contract initialization failed.");
        }
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    }
  }, []);

  const [formBody, setFormBody] = useState({
    nric: "",
    wallet: "",
  });

  const onNricInputChange = () => {
    console.log("test");
  };

  const onSubmit = async (e) => {
    setEnableMintButton(false);
    e.preventDefault();

    console.log("test");
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
        console.log("result123213213", data);
        setEnableMintButton(true);
        if (data.hasOwnProperty("errors")) {
          // throw error and dont do minting
          console.log("error encountered, dont do minting", data);
          setNricFieldError(data["errors"][0]["error"]);
        } else {
          mintNftHandler();
          setNricFieldError("");
          setEnableMintButton(false);
        }
      });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Mint a NFT!</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>Mint a NFT!</h1>

        <p className={styles.description}>
          Get started by connecting your Metamask Wallet
        </p>

        <div className={styles.grid}>
          <div className={styles["nft-image-wrapper"]}>
            <img className={styles["nft-image"]} src={nftImageUrl}></img>
            {/* <img
              className={styles["nft-image"]}
              src="https://images.unsplash.com/photo-1501183007986-d0d080b147f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZnJlZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80"
            ></img> */}
          </div>

          <div className={styles.card}>
            <h3>About this NFT</h3>
            <h4>{nftName}</h4>
            <p>{nftDecription}</p>
            <h4>
              {nftCurrentMintCount} of {nftMaxMintCount} Minted
            </h4>
            <div className={styles["card-actions-wrapper"]}>
              {currentAccount ? mintNft() : connectWallet()}
            </div>
          </div>
        </div>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created by Dave Chia
        </a>
      </footer>

      <style jsx>{`
        main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

export default Index;
