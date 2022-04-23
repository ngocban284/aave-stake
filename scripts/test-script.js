// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ehthers = hre.ethers;
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  //get user
  const [owner, vault, user1, user2] = await ehthers.getSigners();

  // We get the contract to deploy
  const TVBToken = await ehthers.getContractFactory("TVBToken");
  const token = await TVBToken.deploy();
  await token.deployed();
  console.log("TVBToken deployed to:", token.address);
  console.log("balance of owner :", await token.balanceOf(owner.address));
  console.log("owner addess:", owner.address);
  console.log("vault address :", vault.address);
  console.log("user1 addess:", user1.address);
  console.log("user2 addess:", user2.address);

  const StakedAave = await ehthers.getContractFactory("StakedAave");
  const stkToken = await StakedAave.deploy(
    token.address,
    token.address,
    10,
    10,
    vault.address,
    owner.address,
    365 * 24 * 60 * 60
  );
  await stkToken.deployed();
  console.log("StakedAave deployed to:", stkToken.address);

  // send to user TVBtoken
  await token.transfer(user1.address, 1000);
  console.log("\nuser1 balance:", await token.balanceOf(user1.address));
  await token.transfer(user2.address, 2000);
  console.log("user2 balance:", await token.balanceOf(user2.address));
  await token.transfer(vault.address, 30000);
  console.log("vault balance:", await token.balanceOf(vault.address));

  //config asset
  await stkToken.configureAssets([
    {
      emissionPerSecond: 1,
      totalStaked: 0,
      underlyingAsset: stkToken.address,
    },
  ]);

  //stake token
  await token.connect(vault).approve(stkToken.address, 300000);

  await token.connect(user1).approve(stkToken.address, 500);
  await stkToken.connect(user1).stake(user1.address, 500);
  console.log("\nuser1 staked:", await stkToken.balanceOf(user1.address));

  await token.connect(user2).approve(stkToken.address, 1000);
  await stkToken.connect(user2).stake(user2.address, 1000);
  console.log("user2 staked:", await stkToken.balanceOf(user2.address));

  // check reward
  console.log(
    "\nuser1 balance  after stake:",
    await token.balanceOf(user1.address)
  );

  // incre time to claim reward
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
  await ethers.provider.send("evm_mine");

  //claim reward
  let totalReward = await stkToken.getTotalRewardsBalance(user1.address);
  console.log("totalReward : ", totalReward);

  await stkToken.connect(user1).claimRewards(user1.address, 10000);
  console.log(
    "user1 balance after claim:",
    await token.balanceOf(user1.address)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
