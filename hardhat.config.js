require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.5",
  networks: {
    hardhat: {},
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/f3854796f45b439b8ed66b89e3bbc2a5",
      accounts: [
       
      ],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [

      ],
    },
  },
};
