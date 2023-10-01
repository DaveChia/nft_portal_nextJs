import React, { useState, useEffect } from "react";
import initializeWeb3 from "/utilities/Web3Initializer.js";
import styles from "/styles/index.module.css";
import nftContractJson from "/contracts/NftContract.json";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Index() {
  let contractInstance = null;
  let walletAddress = null;
  let contractAddress = nftContractJson.contractAddress;
  let nftMetadataUrl = "";

  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [nftName, setNftName] = useState(null);
  const [nftDecription, setNftDecription] = useState(null);
  const [nftMaxMintCount, setNftMaxMintCount] = useState(0);
  const [nftCurrentMintCount, setNftCurrentMintCount] = useState(0);
  const [nftMintedReceipt, setNftMintedReceipt] = useState(null);
  const [nftMintedTimeStamp, setNftMintedTimeStamp] = useState(null);
  const [enableMintButton, setEnableMintButton] = useState(false);
  const [contractInstanceAsync, setContractInstanceAsync] = useState(false);
  const [walletAddressAsync, setWalletAddressAsync] = useState(false);

  const getContractMetadata = () => {
    contractInstance.methods
      .nft_metadata_ipfs_url()
      .call()
      .then((_metadata_url) => {
        nftMetadataUrl = _metadata_url;
        getNftImageUrl();
      })
      .catch((err) =>
        toast.error("Something went wrong, please try again later.")
      );
  };

  const getContractMaximumMintCount = () => {
    contractInstance.methods
      .nft_minting_maximum_count()
      .call()
      .then((_count) => {
        setNftMaxMintCount(parseInt(_count));
      })
      .catch((err) =>
        toast.error("Something went wrong, please try again later.")
      );
  };

  const getContractRemainingMintCount = () => {
    contractInstance.methods
      .nft_minting_current_count()
      .call()
      .then((_count) => {
        setNftCurrentMintCount(parseInt(_count));
      })
      .catch((err) =>
        toast.error("Something went wrong, please try again later.")
      );
  };

  const getNftImageUrl = async () => {
    await fetch(nftMetadataUrl)
      .then((res) => res.json())
      .then((data) => {
        setNftImageUrl(data.image);
        setNftDecription(data.description);
        setNftName(data.name);
      })
      .catch((err) =>
        toast.error("Something went wrong, please try again later.")
      );
  };

  const getMintingReceiptIfExists = () => {
    contractInstance.methods
      .addresses_minting_data(walletAddress)
      .call()
      .then((_data) => {
        console.log("receipt", _data);

        // setNftMintedReceipt(_data.receipt);

        const date = new Date(parseInt(_data.minted_timestamp) * 1000);

        // Format the date and time in the user's locale
        const readableTimestamp = date.toLocaleString();

        setNftMintedTimeStamp(readableTimestamp);
      })
      .catch((err) =>
        toast.error("Something went wrong, please try again later.")
      );
  };

  const loadMintingWorkflow = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      toast.error("Please install Metamask on your browser!");
    }
    const accounts = await ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length != 0) {
      const account = accounts[0];

      walletAddress = account;
      setWalletAddressAsync(walletAddress);

      initializeContract();

      async function initializeContract() {
        try {
          const initializedContractInstance = await initializeWeb3();
          if (initializedContractInstance) {
            toast.success("Your wallet has been connected successfully!");

            contractInstance = initializedContractInstance;
            setContractInstanceAsync(contractInstance);
            getContractMetadata();
            getContractMaximumMintCount();
            getContractRemainingMintCount();
            getMintingReceiptIfExists();
          } else {
            toast.error("Contract initialization failed.");
          }
        } catch (error) {
          toast.error("Error initializing contract.");
        }
      }
    } else {
      toast.error("Connect your metamask wallet to mint an NFT!");
    }
  };

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      toast.error("Please install Metamask!");
    }

    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      walletAddress = accounts[0];
      setWalletAddressAsync(walletAddress);

      loadMintingWorkflow();
    } catch (err) {
      toast.error("Error connecting to your wallet, please try again later.");
    }
  };

  const mintNftHandler = async (mintToAddress, receipt) => {
    const encoded = contractInstanceAsync.methods
      .mint(mintToAddress, receipt)
      .encodeABI();

    console.log("encoded", encoded);

    let tx = {
      from: walletAddressAsync,
      to: contractAddress,
      data: encoded,
      nonce: "0x00",
      value: 0,
    };

    console.log("tx", tx);

    let txHash = ethereum
      .request({
        method: "eth_sendTransaction",
        params: [tx],
      })
      .then((hash) => {
        toast.success("You can now view your transaction with hash: " + hash);
        setNftMintedReceipt(receipt);
      })
      .catch((err) => toast.error(err));
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

  const nftMinted = () => {
    return (
      <div className={styles["mint-actions-wrapper"]}>
        <div className={styles["minted-wrapper"]}>
          {" "}
          <h4 className={styles["minted-wrapper-title"]}>
            Your NFT receipt is:
          </h4>
          <small>{nftMintedReceipt}</small>
          <h4 className={styles["minted-wrapper-title"]}>
            You minted the NFT at:{" "}
          </h4>
          <small>{nftMintedTimeStamp}</small>
        </div>
        <button
          className={`${styles["button"]} ${styles["mint-nft-button"]} ${styles["button-disabled"]}`}
        >
          You already own this NFT
        </button>
      </div>
    );
  };

  const mintNft = () => {
    return (
      <form className={styles["mint-actions-wrapper"]} onSubmit={onSubmit}>
        <input
          className={styles["nric-input"]}
          value={formBody.nric}
          onChange={() => {
            const value = event.target.value;

            if (value.length <= 10) {
              // Use a regular expression to match only alphanumeric characters
              const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");
              setEnableMintButton(alphanumericValue.length >= 8);
              setFormBody({ ...formBody, nric: alphanumericValue });
            }
          }}
          placeholder="Enter your NRIC here to mint"
        ></input>
        <div>
          <small>
            The NRIC must be between 8 and 10 alphanumeric characters
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
    );
  };

  const nftDetails = () => {
    return (
      <div className={styles.card}>
        <h3>About this NFT</h3>
        <h4>{nftName}</h4>
        <p>{nftDecription}</p>
        <h4>
          {nftCurrentMintCount} of {nftMaxMintCount} NFTs Minted
        </h4>
        <div className={styles["card-actions-wrapper"]}>
          {nftMintedReceipt ? nftMinted() : mintNft()}
        </div>
      </div>
    );
  };

  const nftImage = () => {
    return (
      <div className={styles["nft-image-wrapper"]}>
        <img className={styles["nft-image"]} src={nftImageUrl}></img>
      </div>
    );
  };

  const nftLoaded = () => {
    return (
      <div className={styles.grid}>
        {nftImage()}

        {nftDetails()}
      </div>
    );
  };

  const nftLoading = () => {
    return <div className={styles.grid}>{connectWallet()}</div>;
  };

  useEffect(() => {
    loadMintingWorkflow();
  }, []);

  const [formBody, setFormBody] = useState({
    nric: "",
    wallet: "",
  });

  const onSubmit = async (e) => {
    setEnableMintButton(false);
    e.preventDefault();

    formBody.wallet = walletAddressAsync;

    await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/users", {
      method: "POST",
      headers: {
        Authorization: process.env.NEXT_PUBLIC_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formBody),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.hasOwnProperty("receipt")) {
          mintNftHandler(data.user.wallet, data.receipt);
        } else {
          // Create global handler to show errors from API
          if (data.hasOwnProperty("errors")) {
            if (data.hasOwnProperty("message")) {
              toast.error(data.message);
            } else {
              toast.error(
                "Error encountered, the NFT was not minted, please try again later."
              );
            }
          } else {
            toast.error(
              "Error encountered, the NFT was not minted, please try again later."
            );
          }
          setEnableMintButton(true);
        }
      })
      .catch((err) => toast.error(err));
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Mint a NFT!</title>
      </Head>

      <main>
        <h1 className={styles.title}>Mint a NFT!</h1>
        <p className={styles.description}>
          {nftImageUrl == null
            ? "Get started by connecting your Metamask Wallet"
            : ""}
        </p>
        {nftImageUrl == null ? nftLoading() : nftLoaded()}
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

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
      />
    </div>
  );
}

export default Index;
