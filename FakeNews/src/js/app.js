App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    ethereum.enable()

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("FakeNews.json", function(fakenews) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.FakeNews = TruffleContract(fakenews);
      // Connect provider to interact with contract
      App.contracts.FakeNews.setProvider(App.web3Provider);

      App.listenForEvents();
      // alert("Loaded")
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.FakeNews.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    }).catch( err => console.error(err) ) ;
  },

  render: function() {
    var newsInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.FakeNews.deployed().then(function(instance) {
      newsInstance = instance;
      newsInstance.newsCount();
      return newsInstance.newsCount();
    }).then(function(newsCount) {
      var newsResults = $("#newsResults");
      newsResults.empty();
      console.log(newsCount)

      var newsSelect = $('#newsSelect');
      newsSelect.empty();

      for (var i = 1; i <= newsCount; i++) {
        newsInstance.newses(i).then(function(news) {
          var id = news[0];
          var name = news[1];
          var voteCount = news[2];
          var verdict = news[5];

          // Render candidate Result
          var newsTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td><td>" + verdict + "</td></tr>"
          newsResults.append(newsTemplate);

          // Render candidate ballot option
          var newsOption = "<option value='" + id + "' >" + name + "</ option>"
          newsSelect.append(newsOption);
        });
      }
      
      loader.hide();
      content.show();
      // console.log(newsInstance.voters())
      // return newsInstance.voters(App.account);
    })
    // .then(function(hasVoted) {
    //   // Do not allow a user to vote
    //   if(hasVoted) {
    //     // $('form').hide();
    //   }
      
    //   loader.hide();
    //   content.show();
    // }).catch(function(error) {
    //   console.log(error);
    // });
  },

  castVote: function() {
    var newsId = $('#newsSelect').val();
    App.contracts.FakeNews.deployed().then(function(instance) {
      return instance.vote(newsId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  downVote: function() {
    var newsId = $('#newsSelect').val();
    App.contracts.FakeNews.deployed().then(function(instance) {
      return instance.downVote(newsId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
