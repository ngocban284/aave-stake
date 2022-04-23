const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const [owner, vault, user1, user2, user3] = await ethers.getSigners();

  const TVBToken = await ethers.getContractFactory("TVBToken");
  const token = await TVBToken.deploy();
  await token.deployed();
  console.log("TVBToken deployed to:", token.address);
  console.log("\nbalance of owner :", await token.balanceOf(owner.address));
  console.log("owner addess:", owner.address);
  console.log("vault address :", vault.address);
  console.log("user1 addess:", user1.address);
  console.log("user2 addess:", user2.address);

  const StakedAave = await ethers.getContractFactory("StakedAave");
  const stkToken = await StakedAave.deploy(
    token.address,
    token.address,
    10,
    24 * 60 * 60,
    vault.address,
    owner.address,
    365 * 24 * 60 * 60
  );
  await stkToken.deployed();
  console.log("\nStakedAave deployed to:", stkToken.address);

  //config asset
  await stkToken.configureAssets([
    {
      emissionPerSecond: 1,
      totalStaked: 0,
      underlyingAsset: stkToken.address,
    },
  ]);

  // sendt token to user and vault
  await token.transfer(user1.address, 1000);
  console.log("\nuser1 balance:", await token.balanceOf(user1.address));

  await token.transfer(user2.address, 2000);
  console.log("user2 balance:", await token.balanceOf(user2.address));

  await token.transfer(user3.address, 3000);
  console.log("user3 balance:", await token.balanceOf(user3.address));

  await token.transfer(vault.address, 3000000);
  console.log("vault balance:", await token.balanceOf(vault.address));

  //stake token with user1
  await token.connect(vault).approve(stkToken.address, 3000000);

  await token.connect(user1).approve(stkToken.address, 500);
  await stkToken.connect(user1).stake(user1.address, 500);
  console.log("\nuser1 staked:", await stkToken.balanceOf(user1.address));
  const timeLockUser1 = await stkToken.stakerRewardLockTime(user1.address);
  console.log("time lock reward of user1 :", timeLockUser1);

  //increase time to contract
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
  await ethers.provider.send("evm_mine");

  //stake token with user2
  await token.connect(user2).approve(stkToken.address, 500);
  await stkToken.connect(user2).stake(user2.address, 500);
  console.log("\nuser2 staked:", await stkToken.balanceOf(user2.address));
  const timeLockUser2 = await stkToken.stakerRewardLockTime(user2.address);
  console.log("time lock reward of user2 :", timeLockUser2);

  console.log(
    "\nindex of user1 after 7 days :",
    await stkToken.timestampToIndexOfUsers(timeLockUser1)
  );
  //user1 rewrad
  let user1Reward = await stkToken.getTotalRewardsBalance(user1.address);
  console.log("get total reward of user1 after 7 days :", user1Reward);
  //current time of contract
  let currentTime = (
    await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  ).timestamp;
  console.log("current time of contract :", currentTime);
  // user1 claim reward
  // await stkToken.connect(user1).claimRewards(user1.address, user1Reward);
  // console.log(
  //   "\nbalance of user1 after claim reward:",
  //   await token.balanceOf(user1.address)
  // );

  //next 2 days
  await ethers.provider.send("evm_increaseTime", [2 * 24 * 3600]);
  await ethers.provider.send("evm_mine");
  //user1 rewrad
  user1Reward = await stkToken.getTotalRewardsBalance(user1.address);
  console.log("get total reward of user1 after 9 days :", user1Reward);
  //current time of contract
  currentTime = (
    await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  ).timestamp;
  console.log("current time of contract :", currentTime);

  //user1 call cooldown
  await stkToken.connect(user1).cooldown();
  //increa time to back cooldown
  await ethers.provider.send("evm_increaseTime", [20]);
  await ethers.provider.send("evm_mine");
  //current time of contract
  currentTime = (
    await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  ).timestamp;
  console.log("current time of contract :", currentTime);

  // redeem and claim reward of user1
  await stkToken.connect(user1).redeem(user1.address, 300);
  await stkToken.connect(user1).claimRewards(user1.address, user1Reward);
  await stkToken.connect(user1).redeem(user1.address, 200);

  console.log("\nbalance of user1:", await token.balanceOf(user1.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
