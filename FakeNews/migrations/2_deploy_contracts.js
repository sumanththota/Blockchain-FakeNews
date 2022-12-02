var FakeNews = artifacts.require("./FakeNews.sol");

module.exports = function(deployer) {
  deployer.deploy(FakeNews);
};
