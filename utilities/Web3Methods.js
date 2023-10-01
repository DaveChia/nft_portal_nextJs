export const getNftMetadata = async (contractInstance) => {
  console.log("chjekincg");
  try {
    throw "wrtggggg";
    const response = await contractInstance.methods
      .nft_metadata_ipfs_url123()
      .call();

    return response;
  } catch (error) {
    console.log("error123", error);
  }
};
