// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    var buffer

    var loader = new AudioSampleLoader();
    loader.src = 'audio/Classic.mp3'
    loader.ctx = context
    loader.onload = function(){
      var source1 = context.createBufferSource();
      buffer = loader.response
      source1.connect(context.destination);
      //source1.start(0);
    }

    loader.send()

angular.module('starter', ['ionic'])

.controller('MetronomeController', ['Metronome', '$scope','$ionicSlideBoxDelegate','$timeout', function(Metronome, $scope, $ionicSlideBoxDelegate, $timeout){

  $scope.phraseConfigs = Metronome.getConfigs()
  $scope.sync = false
  $scope.running = false

  var RhythmSample = {
  };

  RhythmSample.play = function() {
    function playSound(buffer, time) {
      var source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      if (!source.start)
        source.start = source.noteOn;
      var started = source.start(time);
    }

    
    // We'll start playing the rhythm 100 milliseconds from "now"
    var startTime = context.currentTime + 0.100;
    var tempo = 80; // BPM (beats per minute)
    var eighthNoteTime = (60 / tempo) / 2;

    // Play 2 bars of the following:
    for (var bar = 0; bar < 2; bar++) {
      console.log("starting")
      var time = startTime + bar * 8 * eighthNoteTime;
      // Play the bass (kick) drum on beats 1, 5
      playSound(buffer, time);
      playSound(buffer, time + 4 * eighthNoteTime);

      // Play the snare drum on beats 3, 7
      playSound(buffer, time + 2 * eighthNoteTime);
      playSound(buffer, time + 6 * eighthNoteTime);

      // Play the hi-hat every eighthh note.
      for (var i = 0; i < 8; ++i) {
        playSound(buffer, time + i * eighthNoteTime);
      }
    }
  };

  $scope.play = function(){
    RhythmSample.play()
  }

  $scope.$watchCollection('phraseConfigs', function(){
    //var currentIdx = $ionicSlideBoxDelegate.currentIndex()
    //$ionicSlideBoxDelegate.slide(0)
    console.log("phrases: " + $scope.phraseConfigs.length)
    $timeout(function(){
      $ionicSlideBoxDelegate.update()
    },0)
  })

  $scope.$on("metronome-beat", function(event, data){
    console.log("beat")
  })

  $scope.$on("metronome-status", function(event, data){
    $scope.running = data.running
  })

  $scope.addPhrase = function(){
    Metronome.addConfig($scope.sync)
  }

  $scope.deletePhrase = function(index){
    Metronome.deleteConfig(index)
  }

  $scope.toggle = function(){
    if(!$scope.running){
      Metronome.start()  
    } else {
      Metronome.stop()
    }
  }

  $scope.stop = function(){
    Metronome.stop()
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
  var currentInterval, isRunning 
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

  function publishStatus(running){
    isRunning = running
    $rootScope.$broadcast("metronome-status",{ running : running }) 
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

  function loadAudio(){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    var loader = new AudioSampleLoader();
    loader.src = 'audio/Classic.mp3'
    loader.ctx = context
    loader.onload = function(){
      var source1 = context.createBufferSource();
      source1.buffer = loader.response
      source1.connect(context.destination);
      //source1.start(0);
    }

    loader.send()
  }
 
  return {
    start : function(){
      if(!isRunning){
        currentInterval = $timeout(handleIntervalUpdate,0)
        publishStatus(true)        
      }
    },
    stop : function(){
      $timeout.cancel(currentInterval)
      currentPhrase = initPhrase()
      tick();  
      publishStatus(false)
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
