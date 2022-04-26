const hre = require("hardhat");
const { ethers } = require("ethers");
const { util } = require("chai");
const utils = ethers.utils;

async function main() {
  const ether = utils.parseEther("0.0000000000001");
  console.log("ether :", ether);
  const [owner, vault, user1, user2, user3] = await hre.ethers.getSigners();

  const TVBToken = await hre.ethers.getContractFactory("TVBToken");
  const token = await TVBToken.deploy();
  await token.deployed();
  console.log("TVBToken deployed to:", token.address);
  console.log("\nbalance of owner :", await token.balanceOf(owner.address));
  console.log("owner addess:", owner.address);
  console.log("vault address :", vault.address);
  console.log("user1 addess:", user1.address);
  console.log("user2 addess:", user2.address);

  const StakedAave = await hre.ethers.getContractFactory("StakedAave");
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

  //send token to user and vault
  await token.transfer(user1.address, utils.parseEther("1"));
  console.log(
    "\nuser1 balance:",
    utils.formatEther(await token.balanceOf(user1.address))
  );

  await token.transfer(user2.address, utils.parseEther("2"));
  console.log(
    "user2 balance:",
    utils.formatEther(await token.balanceOf(user2.address))
  );

  await token.transfer(user3.address, utils.parseEther("3"));
  console.log(
    "user3 balance:",
    utils.formatEther(await token.balanceOf(user3.address))
  );

  await token.transfer(vault.address, utils.parseEther("9990"));
  console.log(
    "vault balance:",
    utils.formatEther(await token.balanceOf(vault.address))
  );

  //stake token with user1
  await token
    .connect(vault)
    .approve(stkToken.address, utils.parseEther("9990"));

  await token.connect(user1).approve(stkToken.address, utils.parseEther("1"));
  await stkToken.connect(user1).stake(user1.address, utils.parseEther("1"));
  console.log(
    "\nuser1 staked:",
    utils.formatEther(await stkToken.balanceOf(user1.address))
  );
  const timeLockUser1 = await stkToken.stakerRewardLockTime(user1.address);
  console.log("time lock reward of user1 :", timeLockUser1);

  //increase time to contract
  await hre.ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
  await hre.ethers.provider.send("evm_mine");

  //stake token with user2
  await token.connect(user2).approve(stkToken.address, utils.parseEther("2"));
  await stkToken.connect(user2).stake(user2.address, utils.parseEther("2"));
  console.log(
    "\nuser2 staked:",
    utils.formatEther(await stkToken.balanceOf(user2.address))
  );
  const timeLockUser2 = await stkToken.stakerRewardLockTime(user2.address);
  console.log("time lock reward of user2 :", timeLockUser2);

  console.log(
    "\nindex of user1 after 7 days :",
    await stkToken.timestampToIndexOfUsers(timeLockUser1)
  );
  //user1 rewrad
  let user1Reward = utils.formatEther(
    await stkToken.getTotalRewardsBalance(user1.address)
  );
  console.log("get total reward of user1 after 7 days :", user1Reward);
  //current time of contract
  let currentTime = (
    await hre.ethers.provider.getBlock(
      await hre.ethers.provider.getBlockNumber()
    )
  ).timestamp;
  console.log("current time of contract :", currentTime);
  // // user1 claim reward
  // // await stkToken.connect(user1).claimRewards(user1.address, user1Reward);
  // // console.log(
  // //   "\nbalance of user1 after claim reward:",
  // //   await token.balanceOf(user1.address)
  // // );

  //next 2 days
  await hre.ethers.provider.send("evm_increaseTime", [2 * 24 * 3600]);
  await hre.ethers.provider.send("evm_mine");

  //user2 reward
  let user2Reward = utils.formatEther(
    await stkToken.getTotalRewardsBalance(user2.address)
  );
  console.log("get total reward of user2 after 2 days :", user2Reward);

  //stake token with user3
  await token.connect(user3).approve(stkToken.address, utils.parseEther("3"));
  await stkToken.connect(user3).stake(user3.address, utils.parseEther("3"));
  console.log(
    "\nuser3 staked:",
    utils.formatEther(await stkToken.balanceOf(user3.address))
  );

  //user1 rewrad
  user1Reward = await stkToken.getTotalRewardsBalance(user1.address);
  console.log("get total reward of user1 after 9 days :", user1Reward);
  //current time of contract
  currentTime = (
    await hre.ethers.provider.getBlock(
      await hre.ethers.provider.getBlockNumber()
    )
  ).timestamp;
  console.log("current time of contract :", currentTime);

  //user1 call cooldown
  await stkToken.connect(user1).cooldown();
  //increa time to back cooldown
  await hre.ethers.provider.send("evm_increaseTime", [20]);
  await hre.ethers.provider.send("evm_mine");
  //current time of contract
  currentTime = (
    await hre.ethers.provider.getBlock(
      await hre.ethers.provider.getBlockNumber()
    )
  ).timestamp;
  console.log("current time of contract :", currentTime);

  // redeem and claim reward of user1
  await stkToken.connect(user1).redeem(user1.address, utils.parseEther("1"));
  await stkToken.connect(user1).claimRewards(user1.address, user1Reward);

  console.log(
    "\nbalance of user1:",
    utils.formatEther(await token.balanceOf(user1.address))
  );

  //next 2 day => user2 4day
  await hre.ethers.provider.send("evm_increaseTime", [2 * 24 * 3600]);
  await hre.ethers.provider.send("evm_mine");

  user2Reward = utils.formatEther(
    await stkToken.getTotalRewardsBalance(user2.address)
  );
  console.log("get total reward of user2 after 4 days :", user2Reward);

  let user3Reward = utils.formatEther(
    await stkToken.getTotalRewardsBalance(user3.address)
  );
  console.log("get total reward of user3 after 20s  :", user3Reward);

  //next 4 day
  await hre.ethers.provider.send("evm_increaseTime", [4 * 24 * 3600]);
  await hre.ethers.provider.send("evm_mine");

  user2Reward = utils.formatEther(
    await stkToken.getTotalRewardsBalance(user2.address)
  );
  console.log("get total reward of user2 after 8 days :", user2Reward);

  // //user2 call cooldown
  // await stkToken.connect(user2).cooldown();
  // //increa time to back cooldown
  // await hre.ethers.provider.send("evm_increaseTime", [20]);
  // await hre.ethers.provider.send("evm_mine");
  // //current time of contract
  // currentTime = (
  //   await hre.ethers.provider.getBlock(
  //     await hre.ethers.provider.getBlockNumber()
  //   )
  // ).timestamp;
  // console.log("current time of contract :", currentTime);

  // redeem and claim reward of user1
  // await stkToken.connect(user2).redeem(user2.address, utils.parseEther("2"));
  // await stkToken
  //   .connect(user2)
  //   .claimRewards(user2.address, utils.parseUnits(user2Reward, 18));

  // //total user
  // const totalUser = await stkToken.TOTAL_USERS();
  // console.log("\ntotal user staked :", totalUser);

  // //increase time to contract
  // await hre.ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
  // await hre.ethers.provider.send("evm_mine");
  // console.log("----");
  // //check emmissionPerSecond
  // const emissionPerSecond = await stkToken._getEmissionPerSecondByTotalUsers(
  //   totalUser
  // );
  // console.log("----");
  // console.log("\nemmissionPerSecond :", emissionPerSecond);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
