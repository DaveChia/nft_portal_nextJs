export const getNftMetadata = async (contractInstance) => {
  const nftMetadataURL = await getNftMetadataUrl(contractInstance);

  const nftMetaData = {
    name: "",
    description: "",
    imageUrl: "",
  };

  await fetch(nftMetadataURL)
    .then((res) => res.json())
    .then((data) => {
      if (!("name" in data) || !("description" in data) || !("image" in data))
        throw "Invalid metadata format.";

      nftMetaData.name = data.name;
      nftMetaData.description = data.description;
      nftMetaData.imageUrl = data.image;
    })
    .catch((error) => {
      throw error;
    });

  return nftMetaData;
};

export const getNftMetadataUrl = (contractInstance) => {
  try {
    return contractInstance.methods.nft_metadata_ipfs_url().call();
  } catch (error) {
    throw error;
  }
};

export const getNftMaximumMintCount = async (contractInstance) => {
  try {
    const nftMaximumMintCount = await contractInstance.methods
      .nft_minting_maximum_count()
      .call();
    return parseInt(nftMaximumMintCount);
  } catch (error) {
    throw error;
  }
};

export const getNftCurrentMintCount = async (contractInstance) => {
  try {
    const nftCurrentMintCount = await contractInstance.methods
      .nft_minting_current_count()
      .call();
    return parseInt(nftCurrentMintCount);
  } catch (error) {
    throw error;
  }
};

export const getMintedNftDetails = async (contractInstance, walletAddress) => {
  try {
    const mintedNftDetails = await contractInstance.methods
      .addresses_minting_data(walletAddress)
      .call();

    if (
      !("minted_timestamp" in mintedNftDetails) ||
      !("nft_ipfs_url" in mintedNftDetails) ||
      !("receipt" in mintedNftDetails)
    )
      throw "Invalid nft details format.";

    const date = new Date(parseInt(mintedNftDetails.minted_timestamp) * 1000);
    const readableTimestamp = date.toLocaleString();

    const mintedNftDataOutput = {
      receipt: mintedNftDetails.receipt,
      nft_ipfs_url: mintedNftDetails.nft_ipfs_url,
      minted_timestamp: readableTimestamp,
    };

    return mintedNftDataOutput;
  } catch (error) {
    throw error;
  }
};

export const connectWalletAddresses = async () => {
  try {
    const { ethereum } = window;

    if (!ethereum) {
      throw "Please install Metamask!";
    }

    const addresses = await ethereum.request({
      method: "eth_requestAccounts",
    });

    return addresses;
  } catch (error) {
    throw error;
  }
};

export const getConnectedWalletAddresses = async () => {
  try {
    const { ethereum } = window;

    if (!ethereum) {
      throw "Please install Metamask!";
    }

    const addresses = await ethereum.request({
      method: "eth_accounts",
    });

    return addresses;
  } catch (error) {
    throw error;
  }
};
