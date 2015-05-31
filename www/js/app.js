// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.controller('MetronomeController', ['Metronome', '$scope','$ionicSlideBoxDelegate','$timeout', function(Metronome, $scope, $ionicSlideBoxDelegate, $timeout){

  $scope.phraseConfigs = Metronome.getConfigs()
  $scope.sync = false

  $scope.$watchCollection('phraseConfigs', function(){
    //var currentIdx = $ionicSlideBoxDelegate.currentIndex()
    //$ionicSlideBoxDelegate.slide(0)
    console.log("phrases: " + $scope.phraseConfigs.length)
    $timeout(function(){
      $ionicSlideBoxDelegate.update()
    },0)
    
  })

  $scope.addPhrase = function(){
    Metronome.addConfig($scope.sync)
    
  }

  $scope.deletePhrase = function(index){
    
    
    Metronome.deleteConfig(index)
  }

}])

.factory('Metronome', ['$timeout','$rootScope',function($timeout, $rootScope) {
 
  var defaultConfig = {
    bpm: 120,
    bpb: 4,
    bars: 2,
    mute: false
  }
 
  var phrases = [ defaultConfig ]
  var currentPhraseIdx = 0;
  var currentInterval 
  var currentPhrase = initPhrase();
 
  function handleIntervalUpdate(){
    tick()
    
    var interval = nextInterval()
    currentInterval = $timeout(handleIntervalUpdate, interval)
  }
 
  function initPhrase(){
    return {
      beats: 1,
      bar: 1,
    }
  }
 
  function nextInterval(){
    // increment the beat
    currentPhrase.beats++;  
        
    // check if this is the last beat need to check if 
    // we move on to next phrase or stay here
    var currentConfig = phrases[currentPhraseIdx]
    var interval = calculateIntervalFromConfig(currentConfig)
 
    if(currentPhrase.beats > currentConfig.bpb){
      currentPhrase.bar++;
      currentPhrase.beats = 1;
      
      if(currentPhrase.bar > currentConfig.bars){
        incrementCurrentPhraseIdx();  
        currentPhrase = initPhrase();
      }
    }
        
    return interval;
  }
 
  function calculateIntervalFromConfig(config){
    return 1000 / (config.bpm / 60);
  }
 
  function incrementCurrentPhraseIdx(){
    if(currentPhraseIdx < phrases.length - 1) currentPhraseIdx++;
    else currentPhraseIdx = 0;
  }
 
  function tick(){
    var config = phrases[currentPhraseIdx]
    $rootScope.$broadcast("metronome-beat",{ config : config, phrase: angular.copy(currentPhrase) })
  }
 
  function syncConfig(idx){
    var config = phrases[idx]
    var barsPerMinute = config.bpm / config.bpb;
          
    for(var phraseIdx in phrases){
      if(phraseIdx != idx){
        var phrase = phrases[phraseIdx]
        phrase.bpm = phrase.bpb * barsPerMinute
      }
    }    
  }
 
  return {
    start : function(){
      currentInterval = $timeout(handleIntervalUpdate,0)      
    },
    stop : function(){
      $timeout.cancel(currentInterval)
      currentPhrase = initPhrase()
      tick();  
    },
    getConfigs : function(){
      return phrases;
    },
    updateConfig : function(idx, config, sync){
      if(idx < phrases.length - 1){
        phrases[idx] = config
        if(sync){
          syncConfig(idx)
        }
      }
    },
    addConfig : function(sync){
      phrases.push(angular.copy(defaultConfig))
      if(sync){
        syncConfig(phrases.length - 1, config)
      }
    },
    deleteConfig : function(index){
      if(index > 0 && index < phrases.length)
      phrases.splice(index, 1)
    }
  }
}])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
