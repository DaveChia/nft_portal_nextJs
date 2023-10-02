import React, { useState, useEffect } from "react";
import initializeWeb3 from "/utilities/Web3Initializer.js";
import {
  connectWalletAddresses,
  getConnectedWalletAddresses,
  getNftMetadata,
  getNftMaximumMintCount,
  getNftCurrentMintCount,
  getMintedNftDetails,
} from "/utilities/Web3Methods.js";
import styles from "/styles/index.module.css";
import nftContractJson from "/contracts/NftContract.json";
import Head from "next/head";
import { toast } from "react-toastify";
import CustomToast from "/components/Toast.js";

function Index() {
  let contractAddress = nftContractJson.contractAddress;
  let contractNetwork = nftContractJson.network;
  let contractNftType = nftContractJson.nftType;

  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [nftName, setNftName] = useState(null);
  const [nftDecription, setNftDecription] = useState(null);
  const [nftMaxMintCount, setNftMaxMintCount] = useState(0);
  const [nftCurrentMintCount, setNftCurrentMintCount] = useState(0);
  const [nftMintedReceipt, setNftMintedReceipt] = useState(null);
  const [nftMintedTimeStamp, setNftMintedTimeStamp] = useState(null);
  const [enableMintButton, setEnableMintButton] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  const loadMintingWorkflow = async () => {
    let connectedWalletAddress = null;

    try {
      const connectedWalletAddresses = await getConnectedWalletAddresses();

      if (connectedWalletAddresses.length == 0) {
        toast.error("Connect your metamask wallet to mint an NFT!");
        return;
      }

      connectedWalletAddress = connectedWalletAddresses[0];

      setWalletAddress(connectedWalletAddress);

      toast.success("Your wallet has been connected successfully!");
    } catch (error) {
      toast.error("Error connecting your wallet. Please try again later");
    }

    try {
      const initializedContractInstance = await initializeWeb3();

      if (!initializedContractInstance) {
        toast.error("Contract initialization failed. Please try again later");
        return;
      }

      const nftMetadata = await getNftMetadata(initializedContractInstance);
      setNftImageUrl(nftMetadata.imageUrl);
      setNftDecription(nftMetadata.description);
      setNftName(nftMetadata.name);

      const nftMaximumMintCount = await getNftMaximumMintCount(
        initializedContractInstance
      );
      setNftMaxMintCount(nftMaximumMintCount);

      const nftCurrentMintCount = await getNftCurrentMintCount(
        initializedContractInstance
      );
      setNftCurrentMintCount(nftCurrentMintCount);

      const mintedNftDetails = await getMintedNftDetails(
        initializedContractInstance,
        connectedWalletAddress
      );
      setNftMintedReceipt(mintedNftDetails.receipt);
      setNftMintedTimeStamp(mintedNftDetails.minted_timestamp);
    } catch (error) {
      toast.error(
        "Error initializing contract. Please ensure you are using the correct network."
      );
    }
  };

  const connectWalletHandler = async () => {
    try {
      await connectWalletAddresses();

      loadMintingWorkflow();
    } catch (error) {
      toast.error("Error connecting to your wallet, please try again later.");
    }
  };

  const mintNftHandler = async (mintToAddress, receipt) => {
    const initializedContractInstance = await initializeWeb3();
    if (!initializedContractInstance) {
      toast.error("Contract initialization failed. Please try again later");
      return;
    }

    const encoded = initializedContractInstance.methods
      .mint(mintToAddress, receipt)
      .encodeABI();

    let tx = {
      from: walletAddress,
      to: contractAddress,
      data: encoded,
      nonce: "0x00",
      value: 0,
    };

    ethereum
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

        <h4 className={styles["minted-wrapper-title"]}>Your wallet address:</h4>
        <small>{walletAddress}</small>

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

    const connectedAddresses = await getConnectedWalletAddresses();

    if (!connectedAddresses.includes(walletAddress)) {
      toast.error(
        "Your wallet address: " +
          walletAddress +
          " is not authorized to perform the minting, please check your Metamask accounts."
      );
      return;
    }

    formBody.wallet = walletAddress;

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
            toast.error(data.error);
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
        <div className={styles["tag-wrapper"]}>
          <div className={styles["tag"]}>{contractNetwork}</div>
          <div className={styles["tag"]}>{contractNftType}</div>
        </div>
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
      <CustomToast
        position="top-right"
        autoCloseInSeconds={4000}
        isHideProgressBar={false}
      />
    </div>
  );
}

export default Index;
